import db from "../models/index.js";
const { Auction, Player } = db;
import { Op } from "sequelize"; // Make sure to import Op at the top of your file!

const adminController = {};

adminController.renderDashboard = async (req, res) => {
  const currentAdmin = req.user;
  res.render("adminDashboard", {
    admin: currentAdmin,
  });
};

// adminController.renderAuction = async (req, res) => {
//     try {
//         const currentSession = await Auction.findOne({
//             where: { status: 'active' },
//             include: [{ model: Player, as: 'currentPlayer' }]
//         });

//         // 2. Fetch all players who are still 'available'
//         const availablePlayers = await Player.findAll({ where: { status: 'available' } });

//         res.render('adminAuction', {
//             players: availablePlayers,
//             isSessionActive: global.auctionActive, // Use the global toggle we discussed
//             activeAuction: currentSession, // Will be null if no player is called
//             title: 'Admin Auction',
//             query: req.query
//         });
//     } catch (error) {
//         console.error('Error loading auction page:', error);
//         req.flash('error', 'Failed to load auction page');
//         res.redirect('/admin/dashboard');
//     }
// }

adminController.renderAuction = async (req, res) => {
  try {
    const { search, category, role } = req.query;

    // 1. Build the Dynamic Filter Object
    // We use 'status: available' as the base condition
    let playerFilters = { status: "available" };

    // Search by Name
    if (search) {
      playerFilters.name = { [Op.like]: `%${search}%` };
    }

    // Tier Filter (Gold, Platinum, etc.) -> Maps to auctionCategory in DB
    if (category && category !== "all") {
      playerFilters.auctionCategory = category;
    }

    // Role Filter (Batsman, Bowler, etc.) -> Maps to category in DB
    if (role && role !== "all") {
      playerFilters.category = role;
    }

    // 2. Fetch Data
    const currentSession = await Auction.findOne({
      where: { status: "active" },
      include: [{ model: Player, as: "currentPlayer" }],
    });

    const filteredPlayers = await Player.findAll({
      where: playerFilters,
      order: [
        ["auctionCategory", "ASC"],
        ["name", "ASC"],
      ],
    });

    // 3. Render
    res.render("adminAuction", {
      players: filteredPlayers,
      isSessionActive: global.auctionActive,
      activeAuction: currentSession,
      title: "Admin Auction",
      query: req.query, // Crucial: passes URL params back to the page
    });
  } catch (error) {
    console.error("Error loading auction page:", error);
    req.flash("error", "Failed to load auction page");
    res.redirect("/admin/dashboard");
  }
};

export default adminController;
