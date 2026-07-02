require("dotenv").config();

const connectDB = require("../config/db");
const Booking = require("../models/Booking");
const AlternateFlight = require("../models/AlternateFlight");

const bookings = [
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
    verification: {
      otpCode: null,
      otpVerified: false,
      otpGeneratedAt: null
    },
    recoveryStatus: "PENDING"
  },
  {
    bookingId: "BK1002",
    pnr: "SJ555D",
    passenger: {
      firstName: "Riya",
      lastName: "Shah",
      email: "riya@example.com",
      phone: "+919123456789"
    },
    trip: {
      origin: "BLR",
      destination: "HYD",
      travelDate: "2026-07-03"
    },
    segments: [
      {
        flightNumber: "SJ330",
        origin: "BLR",
        destination: "HYD",
        scheduledDepartureTime: "2026-07-03T16:00:00+05:30",
        scheduledArrivalTime: "2026-07-03T17:15:00+05:30",
        updatedDepartureTime: "2026-07-03T19:00:00+05:30",
        updatedArrivalTime: "2026-07-03T20:15:00+05:30",
        delayMinutes: 180,
        status: "DELAYED"
      }
    ],
    disruption: {
      type: "DELAYED",
      statusLabel: "Delayed by 3 hours",
      reason: "Operational delay",
      message: "Your flight is delayed by 3 hours.",
      impactSummary: "You may be eligible for refund or assisted support depending on airline policy."
    },
    eligibleActions: ["REFUND", "SUPPORT"],
    policy: {
      refundEligible: true,
      rebookEligible: false,
      supportEligible: true,
      eligibilityNote: "Refund eligible due to major delay."
    },
    verification: {
      otpCode: null,
      otpVerified: false,
      otpGeneratedAt: null
    },
    recoveryStatus: "PENDING"
  }
];

const alternateFlights = [
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
        label: "Recommended"
      },
      {
        flightId: "ALT102",
        flightNumber: "SJ301",
        origin: "DEL",
        destination: "BOM",
        departureTime: "18:30",
        arrivalTime: "20:40",
        label: "Same Day"
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

    console.log("Seed data inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
