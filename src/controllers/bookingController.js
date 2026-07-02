const Booking = require("../models/Booking");

const lookupBooking = async (req, res) => {
  const { pnr, lastName } = req.body;

  if (!pnr || !lastName) {
    return res.status(400).json({ message: "PNR and last name are required" });
  }

  try {
    const booking = await Booking.findOne({
      pnr,
      "passenger.lastName": { $regex: new RegExp(`^${lastName}$`, "i") }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { lookupBooking };
