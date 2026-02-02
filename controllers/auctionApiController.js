import db from '../models/index.js';
const { Auction, Player, Team, BidHistory, Setting } = db;
import { decodeId, encodeId } from '../utils/idHasher.js';
import pusher from '../config/pusher.js';

const auctionApiController = {};

// Helper to get session state
const getSessionState = async () => {
    try {
        if (!Setting) {
            console.error('CRITICAL: Setting model is undefined! Falling back to memory.');
            return global.auctionActive === true;
        }
        let setting = await Setting.findByPk('auction_session_active');
        if (!setting) {
            // Default to false if not found
            return false;
        }
        return setting.value === 'true';
    } catch (error) {
        console.error('Error fetching session state:', error);
        // Fallback to memory if DB fails
        return global.auctionActive === true;
    }
};

/**
 * GET /api/auction/state
 * Returns current auction state for all clients to poll
 */
auctionApiController.getState = async (req, res) => {
    try {
        const isSessionActive = await getSessionState();

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
            isSessionActive,
            auction: activeAuction ? {
                playerId: activeAuction.playerId,
                player: activeAuction.currentPlayer ? {
                    id: activeAuction.currentPlayer.id,
                    name: activeAuction.currentPlayer.name,
                    category: activeAuction.currentPlayer.category,
                    basePrice: activeAuction.currentPlayer.basePrice,
                    playerImage: activeAuction.currentPlayer.playerImage,
                    campus: activeAuction.currentPlayer.campus,
                    auctionCategory: activeAuction.currentPlayer.auctionCategory,
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
        console.log('Attempting to start session...');
        // Updates persistent store
        if (Setting) {
            await Setting.upsert({ key: 'auction_session_active', value: 'true' });
            console.log('Session start success. DB updated.');
        } else {
            console.warn('Setting model missing, using memory only');
        }
        // Always update memory backup
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
        console.log('Ending session...');
        if (Setting) {
            await Setting.upsert({ key: 'auction_session_active', value: 'false' });
            console.log('Session ended. DB updated.');
        }

        // Always update memory backup
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

        const isSessionActive = await getSessionState();
        if (!isSessionActive) {
            return res.status(400).json({ success: false, message: 'Auction session not active' });
        }

        // Check if there's already an active auction - only one player can be bid on at a time
        const existingActiveAuction = await Auction.findOne({
            where: { status: 'active' },
            include: [{ model: Player, as: 'currentPlayer' }]
        });

        if (existingActiveAuction) {
            const currentPlayerName = existingActiveAuction.currentPlayer ? existingActiveAuction.currentPlayer.name : 'Unknown Player';
            return res.status(400).json({
                success: false,
                message: `Cannot call a new player. "${currentPlayerName}" is currently being auctioned. Please mark them as Sold or Unsold first.`
            });
        }

        const player = await Player.findByPk(playerId);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (player.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Player not available for auction' });
        }

        // Create new auction for this player
        const auction = await Auction.create({
            playerId: player.id,
            currentBid: player.basePrice,
            lastBidTeamId: null,
            status: 'active'
        });

        // Update player status
        await player.update({ status: 'bidding' });

        // Trigger Pusher Event
        pusher.trigger('auction-channel', 'new-player', {
            playerId: player.id,
            name: player.name,
            image: player.playerImage,
            basePrice: player.basePrice,
            category: player.category,

        });
        console.log("controllers", player.campus)

        res.json({
            success: true,
            message: `${player.name} called to auction block`,
            auction: {
                playerId: player.id,
                playerName: player.name,
                basePrice: player.basePrice,
                currentBid: player.basePrice,

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

        const isSessionActive = await getSessionState();
        if (!isSessionActive) {
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

        // Trigger Pusher Event
        pusher.trigger('auction-channel', 'bid-placed', {
            amount: bidAmount,
            teamName: team.name,
            time: new Date()
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

        // Trigger Pusher Event
        pusher.trigger('auction-channel', 'player-sold', {
            playerId: player.id,
            name: player.name,
            playerImage: player.playerImage,
            teamName: team.name,
            teamLogo: team.teamLogo,
            amount: auction.currentBid
        });

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

        // Trigger Pusher Event
        pusher.trigger('auction-channel', 'player-unsold', {
            playerId: player.id,
            name: player.name
        });

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

auctionApiController.renderAuctionPage = async (req, res) => {
    try {
        res.render("audienceAuction", { title: "Audience Auciton" });
    } catch (error) {
        console.error("Error in GET /audeince auction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export default auctionApiController;
