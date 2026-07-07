const Event = require("../models/Event");
const Registration = require("../models/Registration");

const createEvent = async (req, res) => {
    try {
        const { title, description, date, venue, seats } = req.body;

        const event = new Event({
            title,
            description,
            date,
            venue,
            seats,
            createdBy: req.user.id
        });

        await event.save();

        res.status(201).json({
            message: "Event Created Successfully",
            event
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate("createdBy", "name email");

        res.status(200).json(events);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        // Find the event
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check if seats are available
        if (event.seats <= 0) {
            return res.status(400).json({
                message: "Event is Full!"
            });
        }

        // Check if user is already registered
        const existingRegistration = await Registration.findOne({
            user: req.user.id,
            event: eventId
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "Already Registered"
            });
        }

        // Create registration
        const registration = new Registration({
            user: req.user.id,
            event: eventId
        });

        await registration.save();

        // Reduce available seats
        event.seats -= 1;
        await event.save();

        res.status(201).json({
            message: "Event Registered Successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            user: req.user.id
        }).populate("event");

        const events = registrations.map(reg => reg.event);

        res.status(200).json(events);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getHostedEvents = async (req, res) => {
    try {
        const events = await Event.find({
            createdBy: req.user.id
        });

        res.status(200).json(events);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    try {

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check if the logged-in user created the event
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Event deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Update Event
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (event.createdBy.toString() !== req.user.id) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        event.title = req.body.title;
        event.description = req.body.description;
        event.date = req.body.date;
        event.venue = req.body.venue;
        event.seats = req.body.seats;

        await event.save();

        res.status(200).json({
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get registrations for a hosted event
const getEventRegistrations = async (req, res) => {
    try {

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Only the host can view registrations
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        const registrations = await Registration.find({
            event: req.params.id
        }).populate("user", "name email");

        res.status(200).json(registrations);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}
// Cancel Registration
const cancelRegistration = async (req, res) => {
    try {
        const registration = await Registration.findOne({
            event: req.params.id,
            user: req.user.id
        });

        if (!registration) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        // Increase available seats
        await Event.findByIdAndUpdate(req.params.id, {
            $inc: { seats: 1 }
        });

        // Delete registration
        await Registration.findByIdAndDelete(registration._id);

        res.status(200).json({
            message: "Registration cancelled successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    registerForEvent,
    getMyRegistrations,
    getHostedEvents,
    deleteEvent,
    updateEvent,
    getEventRegistrations,
    cancelRegistration
};

