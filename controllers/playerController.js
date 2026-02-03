import db from "../models/index.js";
const { Player } = db;
import bcrypt from "bcrypt";
import RefreshToken from "../models/refreshTokenModel.js";
import tokenHash from "../utils/tokenHasher.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { encodeId, decodeId } from "../utils/idHasher.js";

import fs from "fs";
import csv from "csv-parser";
import { cloudinary } from '../config/cloudinary.js';


const playerController = {};

const getDriveDirectLink = (driveLink) => {
    try {
        if (!driveLink) return null;

        let fileId = null;

        // Pattern 1: Standard URL (.../d/FILE_ID/...)
        const pathMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (pathMatch && pathMatch[1]) {
            fileId = pathMatch[1];
        }

        // Pattern 2: Query Parameter (...open?id=FILE_ID)
        if (!fileId) {
            const queryMatch = driveLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (queryMatch && queryMatch[1]) {
                fileId = queryMatch[1];
            }
        }

        if (fileId) {
            // Log the ID found to ensure regex is working
            // console.log(`      > ID Extracted: ${fileId}`);
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }

        // console.log(`      > ❌ No valid ID pattern found in: ${driveLink}`);
        return null;

    } catch (error) {
        // console.error('      > ❌ Error extracting link:', error.message);
        return null;
    }
};

// --- Main Controller Function ---
playerController.handleBulkUpload = async (req, res) => {
    
    if (!req.file) {
        req.flash("error", "No file uploaded.");
        return res.redirect("back");
    }

    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            try {
                // console.log(`\n========== STARTED BULK IMPORT: ${results.length} ROWS ==========`);
                
                const cleanedResults = [];

                for (const [index, row] of results.entries()) {
                    
                    // Add spacing for readability
                    // console.log(`\n--- [Row ${index + 1}] Processing: ${row.name} ---`);

                    let playerImageUrl = '/default-player.png'; 
                    const driveUrl = row['Players Image URL']; 

                    if (driveUrl) {
                        // console.log(`   1. Drive Link Found: ${driveUrl}`);

                        try {
                            const directLink = getDriveDirectLink(driveUrl);

                            if (directLink) {
                                // console.log(`   2. Generated Direct Link: ${directLink}`);
                                // console.log(`   3. Uploading to Cloudinary...`);

                                // Upload to Cloudinary
                                const uploadResult = await cloudinary.uploader.upload(directLink, {
                                    folder: "auction_players", 
                                    resource_type: "image"
                                });
                                
                                playerImageUrl = uploadResult.secure_url;
                                // console.log(`   ✅ Upload Success! URL: ${playerImageUrl}`);
                            } else {
                                // console.log(`   ⚠️ Skipped Upload: Could not generate direct link.`);
                            }

                        } catch (imgError) {
                            // console.error(`   ❌ Upload Failed: ${imgError.message}`);
                        }
                    } else {
                        // console.log(`   ℹ️ No Image Link provided. Using default.`);
                    }

                    // Build the Player Object
                    cleanedResults.push({
                        name: row.name,
                        email: row.email,
                        phoneNumber: row.phoneNumber,
                        playerImage: playerImageUrl,
                        playingStyle: row.playingStyle || 'right-handed',
                        category: row.category || 'Batsman',
                        battingOrder: row.battingOrder || 'Top-order',
                        bowlingType: row.bowlingType || null,
                        auctionCategory: row.auctionCategory || 'Silver',
                        basePrice: parseInt(row.basePrice) || 0,
                        campus: row.campus,
                        status: "available",
                        isSold: false,
                        soldPrice: 0
                    });
                }

                console.log(`\n========== SAVING TO DATABASE ==========`);
                
                const data = await Player.bulkCreate(cleanedResults, {
                    ignoreDuplicates: true,
                });

                console.log(`✅ Database Update Complete. Inserted/Updated: ${data.length} records.`);
                console.log(`====================================================\n`);

                fs.unlinkSync(req.file.path);
                req.flash("success", `${data.length} Players imported successfully.`);
                res.redirect("/player/playerslist");

            } catch (error) {
                console.error("\n❌ CRITICAL IMPORT ERROR:", error);
                
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                
                req.flash("error", "Import failed: " + error.message);
                res.redirect("back");
            }
        });
};

playerController.downloadTemplate = (req, res) => {
  const headers = "name,email,phoneNumber,playingStyle,category,battingOrder,bowlingType,auctionCategory,basePrice,campus\n";
  const sampleData = "John Doe,john@example.com,1234567890,right-handed,Batsman,Top-order,,Platinum,50000,Bahadurabad";

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=player_import_template.csv');
  res.status(200).send(headers + sampleData);
};

playerController.renderBulkUpload = (req, res) => {
  res.render("bulkUpload", {
    csrfToken: req.csrfToken(), // MUST generate the token here
    userType: req.user.role, // or however you identify admin
  });
};

playerController.renderRegister = async (req, res) => {
  try {
    res.render("createPlayer", { title: "Register New Player" });
  } catch (error) {
    console.error("Error in GET /register:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

playerController.handleRegister = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.validatedData;
    console.log(req.validationData);

    let {
      playingStyle,
      category,
      battingOrder,
      bowlingType,
      auctionCategory,
      basePrice,
      campus,
    } = req.body;
    console.log(req.body);
    console.log(req.file);

    if (bowlingType === "") {
      bowlingType = null;
    }

    const imageUrl = req.file ? req.file.path : null;
    const existingPlayer = await Player.findOne({
      where: { email },
      paranoid: false,
    });

    if (existingPlayer) {
      if (!existingPlayer.deletedAt) {
        req.flash("error", "Email already exists!");
        return res.status(400).render("createPlayer", {
          title: "Create New Player",
          oldInput: { name, email },
          error_msg: "Email already exists!",
          csrfToken: req.csrfToken ? req.csrfToken() : "",
        });
      }
    }
    await Player.create({
      name,
      email,
      phoneNumber,
      playingStyle,
      category,
      battingOrder,
      bowlingType,
      auctionCategory,
      playerImage: imageUrl,
      basePrice,
      campus,
    });

    req.flash("success", "Player registered successfully.");
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Registration Error:", error);
    req.flash("error", "Registration failed: " + error.message);

    return res.redirect("/auth/player/register");
  }
};

playerController.renderAllPlayers = async (req, res) => {
  try {
    const { Sequelize } = db;
    const { Op } = Sequelize;

    // Pagination and Search Setup
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 8;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.substring]: search } },
        { campus: { [Op.substring]: search } },
        { category: { [Op.substring]: search } }
      ];
    }

    // Use findAndCountAll to get total count for pagination logic
    const { count, rows: players } = await Player.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    const securePlayers = players.map((player) => {
      const p = player.get({ plain: true });
      p.hashedId = encodeId(p.id);
      return p;
    });

    res.render("players", {
      title: "All Players",
      players: securePlayers,
      currentPage: page,
      totalPages: totalPages,
      hasPlayers: count > 0,
      search: search
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

playerController.renderPlayerProfile = async (req, res) => {
  try {
    const Id = req.params.id;

    const playerId = decodeId(Id);
    // console.log(playerId)
    if (!playerId) {
      return res.status(400).json({ message: "invalid id" });
    }
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const playerData = player.get({ plain: true });
    playerData.id = playerId;
    playerData.hashedId = Id;

    // res.render("playerProfile", { player: playerData , user: req.session.user});
    res.render("playerProfile", { player: playerData });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

playerController.renderEdit = async (req, res) => {
  try {
    const Id = req.params.id;

    const playerId = decodeId(Id);

    if (!playerId) {
      return res.status(400).json({ message: "invalid id" });
    }
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const playerData = player.get({ plain: true });
    playerData.id = playerId;
    playerData.hashedId = Id;
    res.render("editPlayer", { player: playerData, title: "edit  Player" });
  } catch (error) {
    console.error("Error in GET /edit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

playerController.handleEdit = async (req, res) => {
  try {
    const Id = req.params.id;
    const playerId = decodeId(Id);

    if (!playerId) {
      req.flash("error", "Invalid ID");
      return res.redirect("/admin/players");
    }

    // 1. Find the Player Instance
    const player = await Player.findByPk(playerId);
    if (!player) {
      req.flash("error", "Player not found");
      return res.redirect("/admin/players");
    }

    const { name, email, phoneNumber } = req.validatedData;
    console.log(req.validationData);

    let {
      playingStyle,
      category,
      battingOrder,
      bowlingType,
      auctionCategory,
      campus,
      basePrice,
    } = req.body;
    console.log(req.body);
    console.log(req.file);

    if (bowlingType === "") {
      bowlingType = null;
    }

    const imageUrl = req.file ? req.file.path : player.playerImage;

    await player.update({
      name,
      email,
      phoneNumber,
      campus,
      playingStyle,
      category,
      battingOrder,
      bowlingType,
      auctionCategory,
      basePrice,
      playerImage: imageUrl,
    });

    req.flash("success", "Player updated successfully!");
    return res.redirect(`/player/profile/${req.params.id}`);
  } catch (error) {
    console.error("Error updating player:", error);
    req.flash("error", "Failed to update player");
    return res.redirect(`/player/profile/edit/${req.params.id}`);
  }
};
playerController.handleDelete = async (req, res) => {
  try {
    const Id = req.params.id;
    const playerId = decodeId(Id);

    if (!playerId) {
      req.flash("error", "Invalid ID");
      return res.redirect("/player/playerslist");
    }

    // Delete player
    await Player.destroy({
      where: { id: playerId }, // fixed Id to id
    });

    req.flash("success", "Player deleted successfully!");
    return res.redirect("/player/playerslist");
  } catch (error) {
    console.error("Error deleting player:", error);
    req.flash("error", "Failed to delete player");
    return res.redirect(`/player/playerslist/${req.params.id}`);
  }
};

playerController.renderPublicPlayers = async (req, res) => {
  try {
    const { Sequelize } = db;
    const { Op } = Sequelize;

    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 12;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.substring]: search } },
        { campus: { [Op.substring]: search } },
        { category: { [Op.substring]: search } }
      ];
    }

    const { count, rows: players } = await Player.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    const securePlayers = players.map((p) => {
      const plain = p.get({ plain: true });
      plain.hashedId = encodeId(plain.id);
      return plain;
    });

    res.render("publicPlayers", {
      title: "ICL Season 2026 - Players",
      players: securePlayers,
      currentPage: page,
      totalPages: totalPages,
      search: search
    });
  } catch (error) {
    console.error("Public players error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Error loading players" });
  }
};

playerController.renderPublicPlayerProfile = async (req, res) => {
  try {
    const Id = req.params.id;
    const playerId = decodeId(Id);

    if (!playerId) {
      return res
        .status(400)
        .render("error", { title: "Error", message: "Invalid Player ID" });
    }

    const player = await Player.findByPk(playerId);
    if (!player) {
      return res
        .status(404)
        .render("error", { title: "Error", message: "Player not found" });
    }

    const playerData = player.get({ plain: true });
    playerData.hashedId = Id;

    res.render("publicPlayerProfile", {
      title: `${playerData.name} - Player Profile`,
      player: playerData,
    });
  } catch (error) {
    console.error("Public player profile error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Error loading player profile",
    });
  }
};

export default playerController;
