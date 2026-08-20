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
    cancelRegistration,
    completeEvent,
    updatePastEvent,
    publishPastEvent,
    getPastEvents
} = require("../controllers/eventController");

const {
    authMiddleware,
    requireRole
} = require("../middleware/authMiddleware");

// Create Event
router.post(
    "/create",
    authMiddleware,
    requireRole("host"),
    createEvent
);

// View All Events
router.get("/", getAllEvents);

// Register for Event
router.post("/register", authMiddleware, registerForEvent);

// Get My Registrations
router.get("/my-registrations", authMiddleware, getMyRegistrations);

router.get(
    "/my-events",
    authMiddleware,
    requireRole("host"),
    getHostedEvents
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("host"),
    deleteEvent
);

router.put(
    "/:id",
    authMiddleware,
    requireRole("host"),
    updateEvent
);

router.get(
    "/:id/registrations",
    authMiddleware,
    requireRole("host"),
    getEventRegistrations
);

router.delete(
    "/cancel/:id",
    authMiddleware,
    cancelRegistration
);

// ===============================
// PAST EVENT ROUTES
// ===============================

// Users can view published past events
router.get("/past", getPastEvents);

// Host marks event as completed
router.patch(
    "/:id/complete",
    authMiddleware,
    requireRole("host"),
    completeEvent
);

// Host adds summary, highlights and photos
router.patch(
    "/:id/past-details",
    authMiddleware,
    requireRole("host"),
    updatePastEvent
);

// Host publishes past event
router.patch(
    "/:id/publish-past",
    authMiddleware,
    requireRole("host"),
    publishPastEvent
);

module.exports = router;