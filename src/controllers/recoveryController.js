const AlternateFlight = require("../models/AlternateFlight");
const Booking = require("../models/Booking");
const RecoveryRequest = require("../models/RecoveryRequest");

const getAlternateFlights = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const record = await AlternateFlight.findOne({ bookingId });

    if (!record) {
      return res.status(404).json({ message: "No alternate flights found" });
    }

    res.status(200).json({
      success: true,
      bookingId,
      alternatives: record.options
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const rebookFlight = async (req, res) => {
  const { bookingId, selectedFlightId } = req.body;

  if (!bookingId || !selectedFlightId) {
    return res.status(400).json({ message: "bookingId and selectedFlightId are required" });
  }

  try {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.verification || booking.verification.otpVerified !== true) {
      return res.status(403).json({ message: "OTP verification required before rebooking" });
    }

    const alternateRecord = await AlternateFlight.findOne({ bookingId });
    if (!alternateRecord) {
      return res.status(404).json({ message: "No alternate flights found for this booking" });
    }

    const selectedFlight = alternateRecord.options.find(
      (opt) => opt.flightId === selectedFlightId
    );
    if (!selectedFlight) {
      return res.status(404).json({ message: "Selected alternate flight not found" });
    }

    await RecoveryRequest.create({
      requestId: `RR${Date.now()}`,
      bookingId,
      type: "REBOOK",
      status: "CONFIRMED",
      details: { selectedFlight }
    });

    booking.recoveryStatus = "REBOOKED";
    booking.verification.otpVerified = false;
    booking.verification.otpCode = null;
    booking.verification.otpGeneratedAt = null;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Flight rebooked successfully",
      recoveryStatus: "REBOOKED",
      selectedFlight
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const requestRefund = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }

  try {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.verification || booking.verification.otpVerified !== true) {
      return res.status(403).json({ message: "OTP verification required before requesting refund" });
    }

    if (booking.policy && booking.policy.refundEligible === false) {
      return res.status(400).json({ message: "Refund is not available for this booking" });
    }

    await RecoveryRequest.create({
      requestId: `RR${Date.now()}`,
      bookingId,
      type: "REFUND",
      status: "REQUESTED",
      details: {}
    });

    booking.recoveryStatus = "REFUND_REQUESTED";
    booking.verification.otpVerified = false;
    booking.verification.otpCode = null;
    booking.verification.otpGeneratedAt = null;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Refund request submitted successfully",
      recoveryStatus: "REFUND_REQUESTED",
      requestType: "REFUND"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const requestOtp = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }

  try {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    booking.verification.otpCode = otpCode;
    booking.verification.otpVerified = false;
    booking.verification.otpGeneratedAt = new Date();
    await booking.save();

    const phone = booking.passenger.phone || "";
    const maskedDestination = "******" + phone.slice(-4);

    res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      channel: "PHONE",
      maskedDestination,
      otp: otpCode // temporary: for MVP testing only
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { bookingId, otp } = req.body;

  if (!bookingId || !otp) {
    return res.status(400).json({ message: "bookingId and otp are required" });
  }

  try {
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.verification) {
      return res.status(400).json({ message: "Verification data not found for this booking" });
    }

    // If OTP already verified earlier
    if (booking.verification.otpVerified === true) {
      return res.status(400).json({ message: "OTP already verified for this booking" });
    }

    // No OTP currently generated
    if (!booking.verification.otpCode) {
      return res.status(400).json({ message: "No OTP has been generated for this booking" });
    }

    // Wrong OTP entered
    if (booking.verification.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    booking.verification.otpVerified = true;
    booking.verification.otpCode = null;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      otpVerified: true
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const requestSupport = async (req, res) => {
  const { bookingId, reason } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }

  try {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.verification || booking.verification.otpVerified !== true) {
      return res.status(403).json({ message: "OTP verification required before creating support request" });
    }

    if (booking.policy && booking.policy.supportEligible === false) {
      return res.status(400).json({ message: "Support request is not available for this booking" });
    }

    await RecoveryRequest.create({
      requestId: `RR${Date.now()}`,
      bookingId,
      type: "SUPPORT",
      status: "OPEN",
      details: { reason: reason || "" }
    });

    booking.recoveryStatus = "SUPPORT_REQUESTED";
    booking.verification.otpVerified = false;
    booking.verification.otpCode = null;
    booking.verification.otpGeneratedAt = null;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Support request created successfully",
      recoveryStatus: "SUPPORT_REQUESTED",
      requestType: "SUPPORT"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAlternateFlights, rebookFlight, requestRefund, requestOtp, verifyOtp, requestSupport };
