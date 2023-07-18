import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    buySubscription,
    cancelSubscription,
    getRazorPayKey,
    paymentVerification,
} from "../controllers/paymentController.js";

const router = express.Router();

// Buy Subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);
// Verify payment and save reference in DB
router.route("/paymentverification").post(isAuthenticated, paymentVerification);

// Get RazorPay Key
router.route("/razorpaykey").get(getRazorPayKey);

// Cancel Subscription
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;
