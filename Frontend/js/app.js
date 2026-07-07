console.log("app.js loaded");

const API_BASE = "https://nexmeet-backend-2hqz.onrender.com//api";

// ======================
// AMBIENT BACKGROUND (soft glow layer, injected on every page)
// ======================
(function injectBgEffects() {
    const grid = document.createElement("div");
    grid.id = "bgGrid";
    document.body.prepend(grid);

    const scan = document.createElement("div");
    scan.id = "scanlines";
    document.body.appendChild(scan);
})();

// ======================
// TOASTS (replaces alert())
// ======================
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity .3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ======================
// PASSWORD TOGGLE
// ======================
const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const passwordInput = document.getElementById("password");
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.textContent = isHidden ? "🙈" : "👁";
    });
}

// ======================
// SIGNUP
// ======================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorBox = document.getElementById("signupError");

        try {
            const response = await fetch(`${API_BASE}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || "Account created!", "success");
                window.location.href = "login.html";
            } else {
                showFormError(errorBox, data.message || "Signup failed.");
            }
        } catch (error) {
            console.error(error);
            showFormError(errorBox, "Could not reach the server.");
        }
    });
}

// ======================
// LOGIN
// ======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorBox = document.getElementById("loginError");

        try {
            const response = await fetch(`${API_BASE}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                showToast("Login successful!", "success");
                window.location.href = "events.html";
            } else {
                showFormError(errorBox, data.message || "Login failed.");
            }

        } catch (error) {
            console.error(error);
            showFormError(errorBox, "Could not reach the server.");
        }
    });
}

function showFormError(errorBox, message) {
    if (!errorBox) {
        showToast(message, "error");
        return;
    }
    errorBox.textContent = message;
    errorBox.hidden = false;
}

// ======================
// DISPLAY EVENTS
// ======================
const eventsContainer = document.getElementById("eventsContainer");
const eventsLoader = document.getElementById("eventsLoader");
const eventSearch = document.getElementById("eventSearch");

let allEvents = [];

if (eventsContainer) {
    loadEvents();
}

async function loadEvents() {
    if (eventsLoader) eventsLoader.style.display = "flex";

    try {
        console.log("Loading events...");

        const response = await fetch(`${API_BASE}/events`);
        console.log("Response Status:", response.status);

        const events = await response.json();
        allEvents = events;
        console.log(allEvents);
        renderEvents(allEvents);

    } catch (error) {
        console.error("Error:", error);
        showToast("Could not load events.", "error");
    } finally {
        if (eventsLoader) eventsLoader.style.display = "none";
    }
}

function renderEvents(events) {
    eventsContainer.innerHTML = "";

    if (events.length === 0) {
        eventsContainer.innerHTML = `<p style="color:var(--text-dim);grid-column:1/-1;text-align:center;">No events match your search.</p>`;
        return;
    }

    events.forEach((event, index) => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.style.animationDelay = `${index * 80}ms`;

        card.innerHTML = `
            <h2>${event.title}</h2>
            <p>${event.description}</p>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Seats:</strong> ${event.seats}</p>
            <button data-event-id="${event._id}">Register</button>
        `;

        card.querySelector("button").addEventListener("click", () => {
            registerEvent(event._id);
        });

        attachTilt(card);

        eventsContainer.appendChild(card);
    });
}

// ======================
// SEARCH EVENTS
// ======================

if (eventSearch) {
    eventSearch.addEventListener("input", function () {

        const query = this.value.trim().toLowerCase();

        if (query === "") {
            renderEvents(allEvents);
            return;
        }

        const filteredEvents = allEvents.filter(event =>
            event.title.toLowerCase().includes(query) ||
            event.venue.toLowerCase().includes(query)
        );

        renderEvents(filteredEvents);
    });
}

// Subtle 3D tilt effect on hover
function attachTilt(card) {
    // Subtle lift on hover only (no 3D tilt) to keep animation minimal
    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-4px)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
    });
}

// ======================
// REGISTER EVENT
// ======================
async function registerEvent(eventId) {

    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first.", "error");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/events/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                eventId
            })
        });

        const data = await response.json();
        showToast(data.message, response.ok ? "success" : "error");

    } catch (error) {
        console.error(error);
        showToast("Registration failed.", "error");
    }
}

// ======================
// DASHBOARD
// ======================
const dashboardContainer = document.getElementById("dashboardContainer");
const dashboardLoader = document.getElementById("dashboardLoader");
const emptyState = document.getElementById("emptyState");

if (dashboardContainer) {
    loadMyRegistrations();
}

async function loadMyRegistrations() {
    if (dashboardLoader) dashboardLoader.style.display = "flex";

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}/events/my-registrations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const events = await response.json();

        dashboardContainer.innerHTML = "";

        if (!events || events.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        events.forEach((event, index) => {
            const card = document.createElement("div");
            card.className = "event-card";
            card.style.animationDelay = `${index * 80}ms`;

           card.innerHTML = `
            <h2>${event.title}</h2>
            <p>${event.description}</p>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>

            <button onclick="cancelRegistration('${event._id}')">
             Cancel Registration
            </button>
    `;
            attachTilt(card);
            dashboardContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        showToast("Could not load your registrations.", "error");
    } finally {
        if (dashboardLoader) dashboardLoader.style.display = "none";
    }
}

// ======================
// LOGOUT
// ======================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

function logout() {
    localStorage.removeItem("token");
    showToast("Logged out successfully", "success");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 600);
}

// ======================
// HOST EVENT
// ======================

const hostEventForm = document.getElementById("hostEventForm");

if (hostEventForm) {

    hostEventForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const token = localStorage.getItem("token");

        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const date = document.getElementById("date").value;
        const venue = document.getElementById("venue").value;
        const seats = document.getElementById("seats").value;

        try {

            const response = await fetch(
                "https://nexmeet-backend-2hqz.onrender.com//api/events/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        title,
                        description,
                        date,
                        venue,
                        seats
                    })
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.ok) {
                hostEventForm.reset();
            }

        } catch (error) {
            console.log(error);
        }

    });

}

const myEventsContainer = document.getElementById("myEventsContainer");

if (myEventsContainer) {
    loadHostedEvents();
}

async function loadHostedEvents() {

    const token = localStorage.getItem("token");

    const response = await fetch(
        "https://nexmeet-backend-2hqz.onrender.com//api/events/my-events",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const events = await response.json();

    myEventsContainer.innerHTML = "";

    events.forEach(event => {

        myEventsContainer.innerHTML += `
            <div class="event-card">
                <h2>${event.title}</h2>

                <p>${event.description}</p>

                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>

                <p><strong>Venue:</strong> ${event.venue}</p>

                <p><strong>Seats:</strong> ${event.seats}</p>

                <button onclick="editEvent('${event._id}')">
                    Edit
                </button>

                <button onclick="deleteEvent('${event._id}')">
                    Delete
                </button>

                <button onclick="viewRegistrations('${event._id}')">
                    View Registrations
                </button>

            </div>
        `;
    });

}

async function deleteEvent(eventId) {

    const confirmDelete = confirm("Are you sure you want to delete this event?");

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
        `https://nexmeet-backend-2hqz.onrender.com//api/events/${eventId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
        loadHostedEvents();
    }
}

function editEvent(eventId) {
    localStorage.setItem("editEventId", eventId);
    window.location.href = "editEvent.html";
}

const editEventForm = document.getElementById("editEventForm");

if (editEventForm) {
    loadEventDetails();
}

async function loadEventDetails() {

    const eventId = localStorage.getItem("editEventId");

    const response = await fetch("https://nexmeet-backend-2hqz.onrender.com//api/events");

    const events = await response.json();

    const event = events.find(e => e._id === eventId);

    if (!event) {
        alert("Event not found!");
        return;
    }

    document.getElementById("title").value = event.title;
    document.getElementById("description").value = event.description;
    document.getElementById("date").value = event.date.split("T")[0];
    document.getElementById("venue").value = event.venue;
    document.getElementById("seats").value = event.seats;
}

if (editEventForm) {
    editEventForm.addEventListener("submit", updateEvent);
}

async function updateEvent(e) {
    e.preventDefault();

    const eventId = localStorage.getItem("editEventId");
    const token = localStorage.getItem("token");

    const response = await fetch(
        `https://nexmeet-backend-2hqz.onrender.com//api/events/${eventId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title: document.getElementById("title").value,
                description: document.getElementById("description").value,
                date: document.getElementById("date").value,
                venue: document.getElementById("venue").value,
                seats: document.getElementById("seats").value
            })
        }
    );

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
        localStorage.removeItem("editEventId");
        window.location.href = "myEvents.html";
    }
}

function viewRegistrations(eventId) {
    localStorage.setItem("viewEventId", eventId);
    window.location.href = "registrations.html";
}

const registrationsContainer = document.getElementById("registrationsContainer");

if (registrationsContainer) {
    loadRegistrations();
}

async function loadRegistrations() {

    const eventId = localStorage.getItem("viewEventId");
    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `https://nexmeet-backend-2hqz.onrender.com//api/events/${eventId}/registrations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const registrations = await response.json();

        registrationsContainer.innerHTML = "";

        if (registrations.length === 0) {
            registrationsContainer.innerHTML = "<p>No registrations yet.</p>";
            return;
        }

        registrations.forEach((registration, index) => {

            registrationsContainer.innerHTML += `
                <div class="event-card">
                    <h3>Participant ${index + 1}</h3>
                    <p><strong>Name:</strong> ${registration.user.name}</p>
                    <p><strong>Email:</strong> ${registration.user.email}</p>
                </div>
            `;

        });

    } catch (error) {
        console.error(error);
        registrationsContainer.innerHTML = "<p>Failed to load registrations.</p>";
    }
}

async function cancelRegistration(eventId) {

    const confirmCancel = confirm("Are you sure you want to cancel your registration?");

    if (!confirmCancel) return;

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `${API_BASE}/events/cancel/${eventId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        showToast(data.message, response.ok ? "success" : "error");

        if (response.ok) {
            loadMyRegistrations();
        }

    } catch (error) {
        console.error(error);
        showToast("Failed to cancel registration.", "error");
    }
}