const express = require("express");
const router = express.Router();

const { getAlternateFlights, rebookFlight, requestRefund, requestOtp, verifyOtp, requestSupport } = require("../controllers/recoveryController");

router.get("/test", (req, res) => {
  res.json({ message: "Recovery route working" });
});

router.get("/:bookingId/alternatives", getAlternateFlights);
router.post("/rebook", rebookFlight);
router.post("/refund", requestRefund);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/support", requestSupport);

module.exports = router;
