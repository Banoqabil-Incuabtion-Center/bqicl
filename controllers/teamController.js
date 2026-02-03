import db from "../models/index.js";
const { Team, Owner } = db;
import bcrypt from "bcrypt";
import RefreshToken from "../models/refreshTokenModel.js";
import tokenHash from "../utils/tokenHasher.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { encodeId, decodeId } from "../utils/idHasher.js";
import { Op } from "sequelize";

const teamController = {};

teamController.renderRegister = async (req, res) => {
  try {
    const assignedTeams = await Team.findAll({
      attributes: ["ownerId"],
      where: {
        ownerId: { [Op.ne]: null },
      },
    });

    const assignedOwnerIds = assignedTeams.map((team) => team.ownerId);

    const availableOwners = await Owner.findAll({
      where: {
        id: {
          [Op.notIn]: assignedOwnerIds,
        },
      },
    });
    res.render("createTeam", {
      owners: availableOwners,
      title: "Register New Team",
    });
  } catch (error) {
    console.error("Error rendering create team page:", error);
    req.flash("error", error);
    res.redirect("/admin/dashboard");
  }
};

teamController.handleRegister = async (req, res) => {
  try {
    const { Name, email } = req.validatedData;


    let { ownerId } = req.body;


    const imageUrl = req.file ? req.file.path : null;
    await Team.create({
      name: Name,
      email,
      ownerId,
      teamLogo: imageUrl,
    });

    req.flash("success", "working successfully successfully.");
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in creating team /POST:", error);
    req.flash("error", error.message || "Unable to load owner list");
    res.redirect("/auth/team/register");
  }
};

teamController.renderAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: Owner, as: "owner" }],
    });
    const secureTeams = teams.map((team) => {
      const t = team.get({ plain: true });
      t.hashedId = encodeId(t.id);
      // console.log(p.hashedId)
      return t;
    });
    res.render("teams", { title: "All team", teams: secureTeams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

teamController.renderTeamProfile = async (req, res) => {
  try {
    const Id = req.params.id;

    const teamId = decodeId(Id);
    // console.log(playerId)
    if (!teamId) {
      return res.status(400).json({ message: "invalid id" });
    }
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: Owner,
          as: "owner",
        },
        {
          model: db.Player,
          as: "players"
        }
      ],
    });
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    const teamData = team.get({ plain: true });
    teamData.id = teamId;
    teamData.hashedId = Id;

    // Ensure compatibility with template casing
    teamData.Name = teamData.name;
    teamData.Players = (teamData.players || []).map(player => ({
      ...player,
      hashedId: encodeId(player.id)
    }));

    if (team.owner) {
      teamData.ownerId = encodeId(team.owner.id);
    } else {
      teamData.ownerId = null;
    }

    res.render("teamProfile", { team: teamData });
  } catch (error) {
    console.error("Error fetching Teams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

teamController.renderEdit = async (req, res) => {
  try {
    const Id = req.params.id;
    const teamId = decodeId(Id);

    if (!teamId) {
      return res.status(400).json({ message: "invalid id" });
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    const teamData = team.get({ plain: true });
    teamData.id = teamId;
    teamData.hashedId = Id;

    // MATCHING KEY: Ensure Name (Capital N) exists for the template
    teamData.Name = teamData.name;

    // Fetch all assigned owner IDs
    const assignedTeams = await Team.findAll({
      attributes: ["ownerId"],
      where: {
        ownerId: { [Op.ne]: null },
      },
    });

    const assignedOwnerIds = assignedTeams.map((t) => t.ownerId);

    // Find owners NOT in the assigned list, BUT include the current team's owner
    const availableOwners = await Owner.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.notIn]: assignedOwnerIds } },
          { id: teamData.ownerId }, // Explicitly include the current owner
        ],
      },
    });

    res.render("editTeam", {
      team: teamData,
      owners: availableOwners,
      title: "Edit Team",
    });
  } catch (error) {
    console.error("Error in GET /edit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

teamController.handleEdit = async (req, res) => {
  try {
    const Id = req.params.id;
    const teamId = decodeId(Id);

    if (!teamId) {
      req.flash("error", "Invalid ID");
      return res.redirect("/team/teamlist");
    }

    // 1. Find the Player Instance
    const team = await Team.findByPk(teamId);
    if (!team) {
      req.flash("error", "team not found");
      return res.redirect("/team/teamslist");
    }

    const { Name } = req.validatedData;

    let { ownerId } = req.body;

    const imageUrl = req.file ? req.file.path : team.teamLogo;

    await team.update({
      name: Name,
      ownerId,
      teamLogo: imageUrl,
    });

    req.flash("success", "Team updated successfully!");
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error updating team:", error);
    req.flash("error", "Failed to update team");
    return res.redirect(`/admin/team/edit/${req.params.id}`);
  }
};

teamController.handleDelete = async (req, res) => {
  try {
    const Id = req.params.id;
    const teamId = decodeId(Id);

    if (!teamId) {
      req.flash("error", "Invalid ID");
      return res.redirect("/team/teamslist");
    }

    // Delete player
    await Team.destroy({
      where: { Id: teamId }, // or hashedId if you store it in db
    });

    req.flash("success", "Team deleted successfully!");
    return res.redirect("/team/teamslist");
  } catch (error) {
    console.error("Error deleting Team:", error);
    req.flash("error", "Failed to delete Team");
    return res.redirect(`/team/teamslist/${req.params.id}`);
  }
};
teamController.renderPublicTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: Owner, as: "owner" }],
      order: [['name', 'ASC']]
    });

    const secureTeams = teams.map(t => {
      const plain = t.get({ plain: true });
      plain.hashedId = encodeId(plain.id);
      return plain;
    });

    res.render("publicTeams", {
      title: "ICL Season 2026 - Teams",
      teams: secureTeams
    });
  } catch (error) {
    console.error("Public teams error:", error);
    res.status(500).render("error", { title: "Error", message: "Error loading teams" });
  }
};

teamController.renderPublicTeamProfile = async (req, res) => {
  try {
    const Id = req.params.id;
    const teamId = decodeId(Id);

    if (!teamId) {
      return res.status(400).render("error", { title: "Error", message: "Invalid Team ID" });
    }

    const team = await Team.findByPk(teamId, {
      include: [
        { model: Owner, as: "owner" },
        { model: db.Player, as: "players" }
      ],
    });

    if (!team) {
      return res.status(404).render("error", { title: "Error", message: "Team not found" });
    }

    const teamData = team.get({ plain: true });
    teamData.hashedId = Id;
    teamData.Players = (teamData.players || []).map(p => ({
      ...p,
      hashedId: encodeId(p.id)
    }));

    res.render("publicTeamProfile", {
      title: `${teamData.name} - Team Profile`,
      team: teamData
    });
  } catch (error) {
    console.error("Public team profile error:", error);
    res.status(500).render("error", { title: "Error", message: "Error loading team profile" });
  }
};

export default teamController;
