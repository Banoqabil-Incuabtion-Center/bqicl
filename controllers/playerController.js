import db from "../models/index.js";
const { Player } = db;
import bcrypt from "bcrypt";
import RefreshToken from "../models/refreshTokenModel.js";
import tokenHash from "../utils/tokenHasher.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { encodeId, decodeId } from "../utils/idHasher.js";

const playerController = {};

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

      let { playingStyle, category, battingOrder, bowlingType, auctionCategory, basePrice, campus } = req.body;
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
      req.flash('error', 'Registration failed: ' + error.message);

      return res.redirect('/auth/player/register');
   }
}

playerController.renderAllPlayers = async (req, res) => {
   try {
      // Pagination Setup
      const page = parseInt(req.query.page) || 1;
      const limit = 8; // Number of players per page
      const offset = (page - 1) * limit;

      // Use findAndCountAll to get total count for pagination logic
      const { count, rows: players } = await Player.findAndCountAll({
         limit: limit,
         offset: offset,
         order: [['createdAt', 'DESC']]
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
         hasPlayers: count > 0
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
         where: { Id: playerId }, // or hashedId if you store it in db
      });

      req.flash("success", "Player deleted successfully!");
      return res.redirect("/player/playerslist");
   } catch (error) {
      console.error("Error deleting player:", error);
      req.flash("error", "Failed to delete player");
      return res.redirect(`/player/playerslist/${req.params.id}`);
   }
};

export default playerController;
