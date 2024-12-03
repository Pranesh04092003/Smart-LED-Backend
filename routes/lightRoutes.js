const express = require("express");
const { getLedState, updateLedState, getSchedule, setSchedule } = require("../controllers/lightController");

const router = express.Router();

// Route to get the current LED state
router.get("/", getLedState);

// Route to update the LED state
router.post("/", updateLedState);

// Route to get the current LED schedule
router.get("/schedule", getSchedule);

// Route to set a new LED schedule
router.post("/schedule", setSchedule);

module.exports = router;
