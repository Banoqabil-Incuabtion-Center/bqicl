import db from '../models/index.js';
const { Auction, Player } = db;

const adminController = {};

adminController.renderDashboard = async (req, res) => {
    const currentAdmin = req.user;
    res.render('adminDashboard', {
        admin: currentAdmin
    });
}

adminController.renderAuction = async (req, res) => {
    try {
        const currentSession = await Auction.findOne({
            where: { status: 'active' },
            include: [{ model: Player, as: 'currentPlayer' }]
        });

        // 2. Fetch all players who are still 'available'
        const availablePlayers = await Player.findAll({ where: { status: 'available' } });

        res.render('adminAuction', {
            players: availablePlayers,
            isSessionActive: global.auctionActive, // Use the global toggle we discussed
            activeAuction: currentSession, // Will be null if no player is called
            title: 'Admin Auction'
        });
    } catch (error) {
        console.error('Error loading auction page:', error);
        req.flash('error', 'Failed to load auction page');
        res.redirect('/admin/dashboard');
    }
}

export default adminController;