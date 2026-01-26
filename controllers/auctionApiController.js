import db from '../models/index.js';
const { Auction, Player, Team, BidHistory } = db;
import { decodeId, encodeId } from '../utils/idHasher.js';

const auctionApiController = {};

// Global state stored in memory (Vercel serverless limitation - use DB for production)
// For Vercel, we'll rely on the database as the source of truth
if (!global.auctionActive) {
    global.auctionActive = false;
}

/**
 * GET /api/auction/state
 * Returns current auction state for all clients to poll
 */
auctionApiController.getState = async (req, res) => {
    try {
        const activeAuction = await Auction.findOne({
            where: { status: 'active' },
            include: [
                { model: Player, as: 'currentPlayer' },
                { model: Team, as: 'currentHighestBidder' }
            ]
        });

        // Get recent bid history for the current auction
        let recentBids = [];
        if (activeAuction && activeAuction.playerId) {
            recentBids = await BidHistory.findAll({
                where: { playerId: activeAuction.playerId },
                include: [{ model: Team, as: 'team' }],
                order: [['createdAt', 'DESC']],
                limit: 10
            });
        }

        res.json({
            success: true,
            isSessionActive: global.auctionActive,
            auction: activeAuction ? {
                playerId: activeAuction.playerId,
                player: activeAuction.currentPlayer ? {
                    id: activeAuction.currentPlayer.id,
                    name: activeAuction.currentPlayer.name,
                    category: activeAuction.currentPlayer.category,
                    basePrice: activeAuction.currentPlayer.basePrice,
                    playerImage: activeAuction.currentPlayer.playerImage
                } : null,
                currentBid: activeAuction.currentBid,
                highestBidder: activeAuction.currentHighestBidder ? {
                    id: activeAuction.currentHighestBidder.id,
                    name: activeAuction.currentHighestBidder.name
                } : null
            } : null,
            recentBids: recentBids.map(bid => ({
                amount: bid.bidAmount,
                teamName: bid.team ? bid.team.name : 'Unknown',
                time: bid.createdAt
            }))
        });
    } catch (error) {
        console.error('Error getting auction state:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/auction/session/start
 * Admin: Initialize global auction session
 */
auctionApiController.startSession = async (req, res) => {
    try {
        global.auctionActive = true;
        res.json({ success: true, message: 'Auction session started' });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
};

/**
 * POST /api/auction/session/end
 * Admin: End global auction session
 */
auctionApiController.endSession = async (req, res) => {
    try {
        global.auctionActive = false;

        // Also pause any active auction
        await Auction.update(
            { status: 'paused' },
            { where: { status: 'active' } }
        );

        res.json({ success: true, message: 'Auction session ended' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ success: false, message: 'Failed to end session' });
    }
};

/**
 * POST /api/auction/player/call
 * Admin: Call a player to the auction block
 */
auctionApiController.callPlayer = async (req, res) => {
    try {
        const { playerId } = req.body;

        if (!global.auctionActive) {
            return res.status(400).json({ success: false, message: 'Auction session not active' });
        }

        const player = await Player.findByPk(playerId);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (player.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Player not available for auction' });
        }

        // End any existing active auction
        await Auction.update({ status: 'completed' }, { where: { status: 'active' } });

        // Create new auction for this player
        const auction = await Auction.create({
            playerId: player.id,
            currentBid: player.basePrice,
            lastBidTeamId: null,
            status: 'active'
        });

        // Update player status
        await player.update({ status: 'bidding' });

        res.json({
            success: true,
            message: `${player.name} called to auction block`,
            auction: {
                playerId: player.id,
                playerName: player.name,
                basePrice: player.basePrice,
                currentBid: player.basePrice
            }
        });
    } catch (error) {
        console.error('Error calling player:', error);
        res.status(500).json({ success: false, message: 'Failed to call player' });
    }
};

/**
 * POST /api/auction/bid
 * Owner: Place a bid
 */
auctionApiController.placeBid = async (req, res) => {
    try {
        const { bidAmount } = req.body;
        const ownerId = req.user.id; // From requireOwnerAuth middleware

        if (!global.auctionActive) {
            return res.status(400).json({ success: false, message: 'Auction session not active' });
        }

        // Get active auction
        const auction = await Auction.findOne({
            where: { status: 'active' },
            include: [{ model: Player, as: 'currentPlayer' }]
        });

        if (!auction) {
            return res.status(400).json({ success: false, message: 'No active auction' });
        }

        // Find team for this owner
        const team = await Team.findOne({ where: { ownerId } });
        if (!team) {
            return res.status(404).json({ success: false, message: 'Owner has no team assigned' });
        }

        // Validate bid amount
        if (bidAmount <= auction.currentBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be higher than current bid: $${auction.currentBid.toLocaleString()}`
            });
        }

        if (bidAmount > team.remainingBudget) {
            return res.status(400).json({
                success: false,
                message: `Insufficient budget! Your remaining budget is $${team.remainingBudget.toLocaleString()}`
            });
        }

        // Update auction with new bid
        await auction.update({
            currentBid: bidAmount,
            lastBidTeamId: team.id
        });

        // Record bid in history
        await BidHistory.create({
            playerId: auction.playerId,
            teamId: team.id,
            bidAmount: bidAmount
        });

        res.json({
            success: true,
            message: 'Bid placed successfully',
            currentBid: bidAmount,
            teamName: team.name,
            remainingBudget: team.remainingBudget
        });
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).json({ success: false, message: 'Failed to place bid' });
    }
};

/**
 * POST /api/auction/sold
 * Admin: Mark current player as sold
 */
auctionApiController.markSold = async (req, res) => {
    try {
        const auction = await Auction.findOne({
            where: { status: 'active' },
            include: [
                { model: Player, as: 'currentPlayer' },
                { model: Team, as: 'currentHighestBidder' }
            ]
        });

        if (!auction) {
            return res.status(400).json({ success: false, message: 'No active auction' });
        }

        if (!auction.lastBidTeamId) {
            return res.status(400).json({ success: false, message: 'No bids placed yet' });
        }

        const player = auction.currentPlayer;
        const team = auction.currentHighestBidder;

        // Update player - mark as sold and assign to team
        await player.update({
            status: 'sold',
            soldPrice: auction.currentBid,
            teamId: team.id
        });

        // Update team - deduct from budget and increment playerCount
        await team.update({
            remainingBudget: team.remainingBudget - auction.currentBid,
            playerCount: team.playerCount + 1
        });

        // Complete the auction
        await auction.update({ status: 'completed' });

        res.json({
            success: true,
            message: `${player.name} sold to ${team.name} for ${auction.currentBid}`,
            soldPrice: auction.currentBid,
            teamName: team.name
        });
    } catch (error) {
        console.error('Error marking sold:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as sold' });
    }
};

/**
 * POST /api/auction/unsold
 * Admin: Mark current player as unsold
 */
auctionApiController.markUnsold = async (req, res) => {
    try {
        const auction = await Auction.findOne({
            where: { status: 'active' },
            include: [{ model: Player, as: 'currentPlayer' }]
        });

        if (!auction) {
            return res.status(400).json({ success: false, message: 'No active auction' });
        }

        const player = auction.currentPlayer;

        // Update player status
        await player.update({ status: 'unsold' });

        // Complete the auction
        await auction.update({ status: 'completed' });

        res.json({
            success: true,
            message: `${player.name} marked as unsold`
        });
    } catch (error) {
        console.error('Error marking unsold:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as unsold' });
    }
};

/**
 * GET /api/auction/bid-history/:playerId
 * Get bid history for a specific player
 */
auctionApiController.getBidHistory = async (req, res) => {
    try {
        const { playerId } = req.params;

        const bids = await BidHistory.findAll({
            where: { playerId },
            include: [{ model: Team, as: 'team' }],
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        res.json({
            success: true,
            bids: bids.map(bid => ({
                amount: bid.bidAmount,
                teamName: bid.team ? bid.team.name : 'Unknown',
                time: bid.createdAt
            }))
        });
    } catch (error) {
        console.error('Error getting bid history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export default auctionApiController;
