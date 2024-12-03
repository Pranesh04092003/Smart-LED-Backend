const moment = require("moment");

// LED state and schedule
let ledState = { state: false, brightness: 0 };

// Default schedule times set to null (no schedule by default)
let ledSchedule = {
  startTime: null,  // Default start time (null)
  endTime: null,    // Default end time (null)
};

// Helper function to check if current time is within the scheduled range
function isWithinSchedule(startTime, endTime) {
  if (!startTime || !endTime) {
    return false; // If no schedule is set, return false
  }

  const currentTime = moment();
  const start = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");

  // If the end time is earlier than the start time, it means the schedule crosses midnight
  if (end.isBefore(start)) {
    end.add(1, 'days'); // Add one day to the end time to handle the crossing midnight scenario

    // Check if current time is within the range of start to midnight, or from midnight to end
    if (currentTime.isBetween(start, moment("23:59", "HH:mm"))) {
      return true;
    }
    if (currentTime.isBetween(moment("00:00", "HH:mm"), end)) {
      return true;
    }
    return false;
  }

  // Otherwise, the schedule is within the same day
  return currentTime.isBetween(start, end);
}

// GET the current LED state
exports.getLedState = (req, res) => {
  try {
    if (!ledState.state) {
      ledState.brightness = 0; // If the LED is off, set brightness to 0
    }
    res.json(ledState);
    console.log(`LED state fetched: State - ${ledState.state}, Brightness - ${ledState.brightness}`);
  } catch (error) {
    console.error("Error fetching LED state:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// POST to update the LED state
// exports.updateLedState = (req, res) => {
//   try {
//     const { state, brightness } = req.body;

//     if (typeof state !== "boolean" || (brightness && typeof brightness !== "number")) {
//       return res.status(400).json({ message: "Invalid input data." });
//     }

//     // Update LED state based on the input
//     if (typeof state !== "undefined") {
//       ledState.state = state;
//       if (!state) ledState.brightness = 0; // If turned off, set brightness to 0
//     }
//     if (typeof brightness !== "undefined" && ledState.state) {
//       ledState.brightness = brightness; // Only set brightness if LED is on
//     }

//     res.json({ message: "LED state updated", ledState });
//   } catch (error) {
//     console.error("Error updating LED state:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

exports.updateLedState = (req, res) => {
  try {
    const { state, brightness } = req.body;

    if (typeof state !== "boolean" || (brightness && typeof brightness !== "number")) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    // If manually turning on, override schedule for the time being
    if (state === true) {
      ledState.manualOverride = true;  // Manual override flag set to true
    } else if (state === false) {
      ledState.manualOverride = false; // Manual override flag set to false
    }

    // Update LED state based on the input
    if (typeof state !== "undefined") {
      ledState.state = state;
      if (!state) ledState.brightness = 0; // If turned off, set brightness to 0
    }
    if (typeof brightness !== "undefined" && ledState.state) {
      ledState.brightness = brightness; // Only set brightness if LED is on
    }

    res.json({ message: "LED state updated", ledState });
  } catch (error) {
    console.error("Error updating LED state:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// GET the current LED schedule
exports.getSchedule = (req, res) => {
  try {
    res.json(ledSchedule);
  } catch (error) {
    console.error("Error fetching LED schedule:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// POST to update the LED schedule
exports.setSchedule = (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    // Validate the time format (HH:mm) only if times are provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
      return res.status(400).json({ message: "Invalid time format. Use HH:mm." });
    }

    // Update the schedule only if times are provided
    if (startTime) ledSchedule.startTime = startTime;
    if (endTime) ledSchedule.endTime = endTime;

    // Check if the LED should be on or off immediately based on the new schedule
    if (isWithinSchedule(ledSchedule.startTime, ledSchedule.endTime)) {
      if (!ledState.state) {
        ledState.state = true;
        ledState.brightness = 255; // Set to full brightness by default
        console.log("LED turned ON based on updated schedule.");
      }
    } else {
      if (ledState.state) {
        ledState.state = false;
        ledState.brightness = 0; // Turn off the LED if not in schedule
        console.log("LED turned OFF based on updated schedule.");
      }
    }

    res.json({ message: "LED schedule updated", schedule: ledSchedule });
  } catch (error) {
    console.error("Error setting LED schedule:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Periodically check if the LED should be on or off based on the schedule
// setInterval(() => {
//   try {
//     const schedule = ledSchedule;
//     if (isWithinSchedule(schedule.startTime, schedule.endTime)) {
//       if (!ledState.state) {
//         ledState.state = true;  // Turn on the LED
//         ledState.brightness = 255; // Set to full brightness
//         console.log("LED turned ON based on schedule");
//       }
//     } else {
//       if (ledState.state) {
//         ledState.state = false;  // Turn off the LED
//         ledState.brightness = 0; // Set brightness to 0
//         console.log("LED turned OFF based on schedule");
//       }
//     }
//   } catch (error) {
//     console.error("Error checking LED schedule:", error);
//   }
// }, 3000);


// Periodically check if the LED should be on or off based on the schedule
// setInterval(() => {
//   try {
//     const schedule = ledSchedule;

//     // Check if current time is within the schedule to turn LED on or off
//     if (isWithinSchedule(schedule.startTime, schedule.endTime)) {
//       // If current time is within the schedule, turn on the LED if it's not already on
//       if (!ledState.state) {
//         ledState.state = true;  // Turn on the LED
//         ledState.brightness = 255; // Set to full brightness
//         console.log("LED turned ON based on schedule");
//       }
//     } else {
//       // If current time is outside the schedule, turn off the LED if it's on
//       if (ledState.state) {
//         ledState.state = false;  // Turn off the LED
//         ledState.brightness = 0; // Set brightness to 0
//         console.log("LED turned OFF based on schedule");
//       }
//     }
//   } catch (error) {
//     console.error("Error checking LED schedule:", error);
//   }
// }, 3000);


// Periodically check if the LED should be on or off based on the schedule
setInterval(() => {
  try {
    const schedule = ledSchedule;

    // Check if the current time is within the schedule to turn LED on
    if (isWithinSchedule(schedule.startTime, schedule.endTime)) {
      // If current time is within the schedule, turn on the LED if it's not already on
      if (!ledState.state) {
        ledState.state = true;  // Turn on the LED
        ledState.brightness = 255; // Set to full brightness
        console.log("LED turned ON based on schedule");
      }
    } else {
      // If current time is outside the schedule and manual override is not active, turn off the LED
      if (ledState.state && ledState.manualOverride !== true) {
        ledState.state = false;  // Turn off the LED
        ledState.brightness = 0; // Set brightness to 0
        console.log("LED turned OFF based on schedule");
      }
    }
  } catch (error) {
    console.error("Error checking LED schedule:", error);
  }
}, 3000);
