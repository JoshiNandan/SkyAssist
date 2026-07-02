const express = require("express");
const cors = require("cors");

const bookingRoutes = require("./routes/bookingRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "SkyAssist API is running" });
});

app.use("/api/bookings", bookingRoutes);
app.use("/api/recovery", recoveryRoutes);

module.exports = app;
