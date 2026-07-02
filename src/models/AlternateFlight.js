const mongoose = require("mongoose");

const alternateFlightSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },

    options: [
      {
        flightId: { type: String, required: true },
        flightNumber: { type: String, required: true },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        departureTime: { type: String, required: true },
        arrivalTime: { type: String, required: true },
        label: { type: String, default: "" },
        fare: {
          currency: { type: String, default: "INR" },
          amount: { type: Number, default: 0 }
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlternateFlight", alternateFlightSchema);
