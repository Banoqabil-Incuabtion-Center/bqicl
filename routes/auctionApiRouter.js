import express from 'express';
import auctionApiController from '../controllers/auctionApiController.js';
import { requireAdminAuth, requireOwnerAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get current auction state (for polling)
router.get('/state', auctionApiController.getState);

// Session control (Admin only)
router.post('/session/start', requireAdminAuth, auctionApiController.startSession);
router.post('/session/end', requireAdminAuth, auctionApiController.endSession);

// Player auction control (Admin only)
router.post('/player/call', requireAdminAuth, auctionApiController.callPlayer);
router.post('/sold', requireAdminAuth, auctionApiController.markSold);
router.post('/unsold', requireAdminAuth, auctionApiController.markUnsold);

// Bidding (Owner only)
router.post('/bid', requireOwnerAuth, auctionApiController.placeBid);

// Bid history
router.get('/bid-history/:playerId', auctionApiController.getBidHistory);

export default router;
