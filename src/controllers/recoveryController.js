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

    const booking = await Booking.findOne({ bookingId });
    const originalFare = booking && booking.fare && booking.fare.totalPaid != null
      ? booking.fare.totalPaid
      : null;

    const alternatives = record.options.map((opt) => {
      const alternateFare = opt.fare && opt.fare.amount != null ? opt.fare.amount : null;

      let fareDifference = null;
      let fareAction = "UNKNOWN";

      if (originalFare !== null && alternateFare !== null) {
        fareDifference = alternateFare - originalFare;
        if (fareDifference > 0) fareAction = "FARE_DIFFERENCE_REQUIRED";
        else if (fareDifference === 0) fareAction = "NO_ADDITIONAL_FARE";
        else fareAction = "LOWER_FARE_AVAILABLE";
      }

      return {
        flightId: opt.flightId,
        flightNumber: opt.flightNumber,
        origin: opt.origin,
        destination: opt.destination,
        departureTime: opt.departureTime,
        arrivalTime: opt.arrivalTime,
        label: opt.label,
        fare: opt.fare,
        fareDifference,
        fareAction
      };
    });

    res.status(200).json({
      success: true,
      bookingId,
      alternatives
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

    const originalFare = booking.fare && booking.fare.totalPaid != null ? booking.fare.totalPaid : null;
    const alternateFare = selectedFlight.fare && selectedFlight.fare.amount != null ? selectedFlight.fare.amount : null;
    const fareDifference = originalFare !== null && alternateFare !== null ? alternateFare - originalFare : null;

    // Reset OTP state regardless of fare path
    booking.verification.otpVerified = false;
    booking.verification.otpCode = null;
    booking.verification.otpGeneratedAt = null;

    // Case 1 — no extra fare or lower fare: direct rebook
    if (fareDifference === null || alternateFare <= originalFare) {
      const requestId = `RBK-${Date.now()}-${bookingId}`;
      const generatedAt = new Date().toISOString();

      await RecoveryRequest.create({
        requestId,
        bookingId,
        type: "REBOOK",
        status: "CONFIRMED",
        details: { selectedFlight }
      });

      booking.recoveryStatus = "REBOOKED";
      booking.fareAdjustmentRequest = null;
      await booking.save();

      const slip = {
        requestId,
        bookingId,
        type: "REBOOK",
        status: "CONFIRMED",
        generatedAt,
        selectedFlight,
        instruction: "Your flight has been rebooked successfully. Please keep this reference for your records."
      };

      return res.status(200).json({
        success: true,
        message: "Flight rebooked successfully",
        recoveryStatus: "REBOOKED",
        selectedFlight,
        slip
      });
    }

    // Case 2 — alternate fare is higher: fare adjustment required
    const requestId = `RBK-${Date.now()}-${bookingId}`;
    const generatedAt = new Date().toISOString();

    booking.recoveryStatus = "PENDING_FARE_ADJUSTMENT";
    booking.fareAdjustmentRequest = {
      requestId,
      selectedFlightId,
      originalFare,
      newFare: alternateFare,
      fareDifference,
      status: "PENDING_FARE_ADJUSTMENT",
      generatedAt
    };
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Rebooking request created. Additional fare adjustment is required at the airport support desk.",
      recoveryStatus: "PENDING_FARE_ADJUSTMENT",
      requestType: "REBOOK_WITH_FARE_DIFFERENCE",
      fareDifference,
      originalFare,
      newFare: alternateFare,
      selectedFlight,
      slip: {
        requestId,
        generatedAt,
        instruction: "Please present this rebooking fare adjustment slip at the airport support desk for fare collection and final ticket reissue."
      }
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

    const requestId = `REF-${Date.now()}-${bookingId}`;
    const generatedAt = new Date().toISOString();

    const recoveryRequest = await RecoveryRequest.create({
      requestId,
      bookingId,
      type: "REFUND",
      status: "REQUESTED",
      details: { generatedAt }
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
      requestType: "REFUND",
      slip: {
        requestId,
        bookingId,
        type: "REFUND",
        generatedAt,
        instruction: "Your refund request has been submitted successfully. Please keep this reference for further communication."
      }
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

    const supportRequestId = `SUP-${Date.now()}-${bookingId}`;
    const supportGeneratedAt = new Date().toISOString();

    await RecoveryRequest.create({
      requestId: supportRequestId,
      bookingId,
      type: "SUPPORT",
      status: "OPEN",
      details: { reason: reason || "", generatedAt: supportGeneratedAt }
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
      requestType: "SUPPORT",
      slip: {
        requestId: supportRequestId,
        bookingId,
        type: "SUPPORT",
        generatedAt: supportGeneratedAt,
        instruction: "Your support request has been submitted. Our team will contact you shortly. Please keep this reference number handy."
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAlternateFlights, rebookFlight, requestRefund, requestOtp, verifyOtp, requestSupport };
