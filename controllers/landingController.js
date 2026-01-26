import db from '../models/index.js';
const { Player, Team } = db;

const landingController = {
    renderLanding: async (req, res) => {
        try {
            // Fetch basic stats for the landing page
            const totalPlayers = await Player.count();
            const totalTeams = await Team.count();

            // Check if auction is active (using global state or DB if implemented)
            const isAuctionLive = global.auctionActive || false;

            // Get current player on bid if auction is live (mock logic for now or DB fetch)
            let currentPlayer = null;
            if (isAuctionLive) {
                currentPlayer = await Player.findOne({
                    where: { status: 'bidding' },
                    attributes: ['name', 'category', 'basePrice', 'playerImage']
                });
            }

            res.render('landing', {
                title: 'Welcome | AuctionPro',
                stats: { totalPlayers, totalTeams },
                isAuctionLive,
                currentPlayer,
                user: req.user // in case we want to show "Go to Dashboard" if logged in
            });
        } catch (error) {
            console.error("Error rendering landing page:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

export default landingController;
