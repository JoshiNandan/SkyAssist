const mongoose = require("mongoose");

const recoveryRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    type: {
      type: String,
      enum: ["REBOOK", "REFUND", "SUPPORT"],
      required: true
    },
    status: { type: String, required: true },
    details: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecoveryRequest", recoveryRequestSchema);
