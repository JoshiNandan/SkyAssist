const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    pnr: { type: String, required: true, unique: true },

    passenger: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String },
      phone: { type: String }
    },

    trip: {
      origin: { type: String, required: true },
      destination: { type: String, required: true },
      travelDate: { type: String, required: true }
    },

    segments: [
      {
        flightNumber: { type: String, required: true },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        scheduledDepartureTime: { type: String, required: true },
        scheduledArrivalTime: { type: String, required: true },
        updatedDepartureTime: { type: String, default: null },
        updatedArrivalTime: { type: String, default: null },
        delayMinutes: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["SCHEDULED", "DELAYED", "CANCELLED"],
          default: "SCHEDULED"
        }
      }
    ],

    disruption: {
      type: {
        type: String,
        enum: ["CANCELLED", "DELAYED", "NONE"],
        default: "NONE"
      },
      statusLabel: { type: String, default: "" },
      reason: { type: String, default: "" },
      message: { type: String, default: "" },
      impactSummary: { type: String, default: "" }
    },

    eligibleActions: {
      type: [String],
      default: []
    },

    policy: {
      refundEligible: { type: Boolean, default: false },
      rebookEligible: { type: Boolean, default: false },
      supportEligible: { type: Boolean, default: true },
      eligibilityNote: { type: String, default: "" }
    },

    fare: {
      currency: { type: String, default: "INR" },
      totalPaid: { type: Number, default: 0 }
    },

    fareAdjustmentRequest: {
      requestId: { type: String, default: null },
      selectedFlightId: { type: String, default: null },
      originalFare: { type: Number, default: null },
      newFare: { type: Number, default: null },
      fareDifference: { type: Number, default: null },
      status: { type: String, default: null },
      generatedAt: { type: String, default: null }
    },

    verification: {
      otpCode: { type: String, default: null },
      otpVerified: { type: Boolean, default: false },
      otpGeneratedAt: { type: Date, default: null }
    },

    recoveryStatus: {
      type: String,
      enum: ["PENDING", "REBOOKED", "REFUND_REQUESTED", "SUPPORT_REQUESTED", "PENDING_FARE_ADJUSTMENT"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
