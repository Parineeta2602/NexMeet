const express = require("express");
const router = express.Router();

const {
    createEvent,
    getAllEvents,
    registerForEvent,
    getMyRegistrations,
    getHostedEvents,
    deleteEvent,
    updateEvent,
    getEventRegistrations,
    cancelRegistration
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");

// Create Event
router.post("/create", authMiddleware, createEvent);

// View All Events
router.get("/", getAllEvents);

// Register for Event
router.post("/register", authMiddleware, registerForEvent);

// Get My Registrations
router.get("/my-registrations", authMiddleware, getMyRegistrations);

router.get(
    "/my-events",
    authMiddleware,
    getHostedEvents
);

// Delete Event
router.delete("/:id", authMiddleware, deleteEvent);

// Update Event
router.put("/:id", authMiddleware, updateEvent);

router.get(
    "/:id/registrations",
    authMiddleware,
    getEventRegistrations
);
router.delete(
    "/cancel/:id",
    authMiddleware,
    cancelRegistration
);

module.exports = router;