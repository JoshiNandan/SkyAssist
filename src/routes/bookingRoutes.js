const express = require("express");
const router = express.Router();

const { lookupBooking } = require("../controllers/bookingController");

router.get("/test", (req, res) => {
  res.json({ message: "Booking route working" });
});

router.post("/lookup", lookupBooking);

module.exports = router;
