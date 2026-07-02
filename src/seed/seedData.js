require("dotenv").config();

const connectDB = require("../config/db");
const Booking = require("../models/Booking");
const AlternateFlight = require("../models/AlternateFlight");

const bookings = [
  // Booking A — Cancelled flight (DEL → BOM)
  {
    bookingId: "BK1001",
    pnr: "SJ784P",
    passenger: {
      firstName: "Nandan",
      lastName: "Joshi",
      email: "nandan@example.com",
      phone: "+919876543210"
    },
    trip: {
      origin: "DEL",
      destination: "BOM",
      travelDate: "2026-07-03"
    },
    segments: [
      {
        flightNumber: "SJ201",
        origin: "DEL",
        destination: "BOM",
        scheduledDepartureTime: "2026-07-03T10:00:00+05:30",
        scheduledArrivalTime: "2026-07-03T12:10:00+05:30",
        updatedDepartureTime: null,
        updatedArrivalTime: null,
        delayMinutes: 0,
        status: "CANCELLED"
      }
    ],
    disruption: {
      type: "CANCELLED",
      statusLabel: "Flight Cancelled",
      reason: "Bad weather",
      message: "Your flight has been cancelled due to bad weather.",
      impactSummary: "You may choose rebooking, refund, or assisted support."
    },
    eligibleActions: ["REBOOK", "REFUND", "SUPPORT"],
    policy: {
      refundEligible: true,
      rebookEligible: true,
      supportEligible: true,
      eligibilityNote: "Eligible for refund or rebooking due to cancellation."
    },
    fare: { currency: "INR", totalPaid: 5000 },
    fareAdjustmentRequest: null,
    verification: { otpCode: null, otpVerified: false, otpGeneratedAt: null },
    recoveryStatus: "PENDING"
  },

  // Booking B — Delayed flight (BLR → DEL)
  {
    bookingId: "BK1002",
    pnr: "SJ555D",
    passenger: {
      firstName: "Riya",
      lastName: "Sharma",
      email: "riya@example.com",
      phone: "+919812345678"
    },
    trip: {
      origin: "BLR",
      destination: "DEL",
      travelDate: "2026-07-04"
    },
    segments: [
      {
        flightNumber: "SJ450",
        origin: "BLR",
        destination: "DEL",
        scheduledDepartureTime: "2026-07-04T15:00:00+05:30",
        scheduledArrivalTime: "2026-07-04T17:45:00+05:30",
        updatedDepartureTime: "2026-07-04T18:30:00+05:30",
        updatedArrivalTime: "2026-07-04T21:15:00+05:30",
        delayMinutes: 210,
        status: "DELAYED"
      }
    ],
    disruption: {
      type: "DELAYED",
      statusLabel: "Flight Delayed",
      reason: "Operational issue",
      message: "Your flight is delayed by 3 hours 30 minutes.",
      impactSummary: "You may review alternate recovery options if the delay no longer suits your travel plan."
    },
    eligibleActions: ["REBOOK", "REFUND", "SUPPORT"],
    policy: {
      refundEligible: true,
      rebookEligible: true,
      supportEligible: true,
      eligibilityNote: "Eligible for alternate recovery options due to significant delay."
    },
    fare: { currency: "INR", totalPaid: 6200 },
    fareAdjustmentRequest: null,
    verification: { otpCode: null, otpVerified: false, otpGeneratedAt: null },
    recoveryStatus: "PENDING"
  },

  // Booking C — On-time booking (BOM → AMD)
  // Note: segment status uses "SCHEDULED" as the schema enum does not include ON_TIME
  {
    bookingId: "BK1003",
    pnr: "SJ111N",
    passenger: {
      firstName: "Amit",
      lastName: "Patel",
      email: "amit@example.com",
      phone: "+919900112233"
    },
    trip: {
      origin: "BOM",
      destination: "AMD",
      travelDate: "2026-07-05"
    },
    segments: [
      {
        flightNumber: "SJ110",
        origin: "BOM",
        destination: "AMD",
        scheduledDepartureTime: "2026-07-05T09:00:00+05:30",
        scheduledArrivalTime: "2026-07-05T10:20:00+05:30",
        updatedDepartureTime: "2026-07-05T09:00:00+05:30",
        updatedArrivalTime: "2026-07-05T10:20:00+05:30",
        delayMinutes: 0,
        status: "SCHEDULED"
      }
    ],
    disruption: {
      type: "NONE",
      statusLabel: "On Time",
      reason: "",
      message: "",
      impactSummary: ""
    },
    eligibleActions: [],
    policy: {
      refundEligible: false,
      rebookEligible: false,
      supportEligible: false,
      eligibilityNote: "No disruption detected for this booking."
    },
    fare: { currency: "INR", totalPaid: 3200 },
    fareAdjustmentRequest: null,
    verification: { otpCode: null, otpVerified: false, otpGeneratedAt: null },
    recoveryStatus: "PENDING"
  }
];

const alternateFlights = [
  // Alternate flights for BK1001 (DEL → BOM, original fare ₹5000)
  {
    bookingId: "BK1001",
    options: [
      {
        flightId: "ALT101",
        flightNumber: "SJ245",
        origin: "DEL",
        destination: "BOM",
        departureTime: "14:00",
        arrivalTime: "16:15",
        label: "Recommended",
        fare: { currency: "INR", amount: 4800 }   // cheaper → LOWER_FARE_AVAILABLE
      },
      {
        flightId: "ALT102",
        flightNumber: "SJ301",
        origin: "DEL",
        destination: "BOM",
        departureTime: "18:30",
        arrivalTime: "20:40",
        label: "Same Fare",
        fare: { currency: "INR", amount: 5000 }   // equal → NO_ADDITIONAL_FARE
      },
      {
        flightId: "ALT103",
        flightNumber: "SJ401",
        origin: "DEL",
        destination: "BOM",
        departureTime: "21:15",
        arrivalTime: "23:20",
        label: "Flexible",
        fare: { currency: "INR", amount: 6200 }   // higher → FARE_DIFFERENCE_REQUIRED
      }
    ]
  },

  // Alternate flights for BK1002 (BLR → DEL, original fare ₹6200)
  {
    bookingId: "BK1002",
    options: [
      {
        flightId: "ALT201",
        flightNumber: "SJ455",
        origin: "BLR",
        destination: "DEL",
        departureTime: "16:30",
        arrivalTime: "19:10",
        label: "Earlier Option",
        fare: { currency: "INR", amount: 5900 }   // cheaper → LOWER_FARE_AVAILABLE
      },
      {
        flightId: "ALT202",
        flightNumber: "SJ470",
        origin: "BLR",
        destination: "DEL",
        departureTime: "19:15",
        arrivalTime: "21:55",
        label: "Same Fare",
        fare: { currency: "INR", amount: 6200 }   // equal → NO_ADDITIONAL_FARE
      },
      {
        flightId: "ALT203",
        flightNumber: "SJ490",
        origin: "BLR",
        destination: "DEL",
        departureTime: "20:45",
        arrivalTime: "23:15",
        label: "Premium Option",
        fare: { currency: "INR", amount: 7100 }   // higher → FARE_DIFFERENCE_REQUIRED
      }
    ]
  }
];

const seed = async () => {
  try {
    await connectDB();

    await Booking.deleteMany({});
    await AlternateFlight.deleteMany({});

    await Booking.insertMany(bookings);
    await AlternateFlight.insertMany(alternateFlights);

    console.log("\nSkyAssist seed completed successfully");
    console.log("Bookings inserted: 3");
    console.log("Alternate flights inserted: 6");
    console.log("\nTest lookup data:");
    console.log("SJ784P / Joshi   -> Cancelled booking  (BK1001)");
    console.log("SJ555D / Sharma  -> Delayed booking    (BK1002)");
    console.log("SJ111N / Patel   -> On-time booking    (BK1003)");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
