console.log("app.js loaded");

const API_BASE = "https://nexmeet-backend-2hqz.onrender.com/api";

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
// ROLE-AWARE AUTH PAGE SETUP (login.html / signup.html)
// ======================
function getRoleFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    return role === "host" ? "host" : "user";
}

function initAuthPage(pageType) {
    const role = getRoleFromQuery();
    const heading = document.getElementById("authHeading");
    const subtext = document.getElementById("roleSubtext");

    const roleLabel = role === "host" ? "Host" : "User";

    if (heading) {
        heading.textContent =
            (pageType === "login" ? "Login" : "Signup") + " — " + roleLabel + " Portal";
    }

    if (subtext) {
        subtext.textContent =
            role === "host"
                ? "Create and manage your own events."
                : "Browse and register for events.";
    }

    // Preserve role when hopping between login <-> signup
    const signupLink = document.getElementById("signupLink");
    if (signupLink) signupLink.href = `signup.html?role=${role}`;

    const loginLink = document.getElementById("loginLink");
    if (loginLink) loginLink.href = `login.html?role=${role}`;
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
        const role = getRoleFromQuery();
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
                    password,
                    role
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || "Account created!", "success");
                window.location.href = `login.html?role=${role}`;
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
        const selectedRole = getRoleFromQuery();

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
                const actualRole = data.user?.role || "user";

                if (actualRole !== selectedRole) {
                    showFormError(
                        errorBox,
                        `This account is registered as a ${actualRole}. Please use the ${actualRole} portal.`
                    );
                    return;
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("role", actualRole);
                localStorage.setItem("userName", data.user?.name || "");

                showToast("Login successful!", "success");

                setTimeout(() => {
                    window.location.href =
                        actualRole === "host" ? "hostDashboard.html" : "events.html";
                }, 500);
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
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
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
                "https://nexmeet-backend-2hqz.onrender.com/api/events/create",
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

const myEventsRootCheck = document.getElementById("upcomingEventsContainer");

if (myEventsRootCheck) {
    loadHostedEvents();
}

async function loadHostedEvents() {

    const token = localStorage.getItem("token");

    const upcomingContainer = document.getElementById("upcomingEventsContainer");
    const completedContainer = document.getElementById("completedEventsContainer");
    const pastContainer = document.getElementById("pastEventsContainer");

    try {
        const response = await fetch(
            `${API_BASE}/events/my-events`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const events = await response.json();

        if (!Array.isArray(events)) {
            showToast(events.message || "Could not load your events.", "error");
            return;
        }

        const upcoming = events.filter(e => e.status !== "completed");
        const completedUnpublished = events.filter(
            e => e.status === "completed" && !e.pastEvent?.published
        );
        const publishedPast = events.filter(
            e => e.status === "completed" && e.pastEvent?.published
        );

        renderUpcomingHostEvents(upcoming, upcomingContainer);
        renderCompletedHostEvents(completedUnpublished, completedContainer);
        renderPublishedHostEvents(publishedPast, pastContainer);

        toggleEmptyMsg("upcomingEmptyMsg", upcoming.length === 0);
        toggleEmptyMsg("completedEmptyMsg", completedUnpublished.length === 0);
        toggleEmptyMsg("pastEmptyMsg", publishedPast.length === 0);

    } catch (error) {
        console.error(error);
        showToast("Could not load your events.", "error");
    }
}

function toggleEmptyMsg(id, show) {
    const el = document.getElementById(id);
    if (el) el.hidden = !show;
}

function renderUpcomingHostEvents(events, container) {
    if (!container) return;
    container.innerHTML = "";

    events.forEach(event => {
        container.innerHTML += `
            <div class="event-card">
                <h2>${event.title}</h2>
                <p>${event.description}</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p><strong>Seats:</strong> ${event.seats}</p>

                <button onclick="editEvent('${event._id}')">Edit</button>
                <button onclick="deleteEvent('${event._id}')">Delete</button>
                <button onclick="viewRegistrations('${event._id}')">View Registrations</button>
                <button onclick="markCompleted('${event._id}')">Mark Completed</button>
            </div>
        `;
    });
}

function renderCompletedHostEvents(events, container) {
    if (!container) return;
    container.innerHTML = "";

    events.forEach(event => {
        const hasSummary = !!event.pastEvent?.summary;

        container.innerHTML += `
            <div class="event-card">
                <h2>${event.title}</h2>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p class="status-badge">${hasSummary ? "Draft saved" : "No memories yet"}</p>

                <button onclick='openMemoriesModal(${JSON.stringify(event)})'>
                    ${hasSummary ? "Edit Memories" : "Add Event Memories"}
                </button>
                <button onclick="viewRegistrations('${event._id}')">View Registrations</button>
                <button onclick="deleteEvent('${event._id}')">Delete</button>
            </div>
        `;
    });
}

function renderPublishedHostEvents(events, container) {
    if (!container) return;
    container.innerHTML = "";

    events.forEach(event => {
        const photoCount = event.pastEvent?.photos?.length || 0;

        container.innerHTML += `
            <div class="event-card">
                <h2>${event.title}</h2>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p>📸 ${photoCount} Photos · 📝 Summary Added</p>

                <button onclick="viewPastEvent('${event._id}')">View Memories</button>
                <button onclick='openMemoriesModal(${JSON.stringify(event)})'>Edit Memories</button>
                <button onclick="viewRegistrations('${event._id}')">View Registrations</button>
                <button onclick="deleteEvent('${event._id}')">Delete</button>
            </div>
        `;
    });
}

// ======================
// MARK EVENT COMPLETED
// ======================
async function markCompleted(eventId) {

    const confirmComplete = confirm("Mark this event as completed?");
    if (!confirmComplete) return;

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `${API_BASE}/events/${eventId}/complete`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        showToast(data.message, response.ok ? "success" : "error");

        if (response.ok) {
            loadHostedEvents();
        }
    } catch (error) {
        console.error(error);
        showToast("Could not mark event as completed.", "error");
    }
}

// ======================
// PAST EVENT MEMORIES MODAL (host side)
// ======================
let currentMemoryEventId = null;

const memoriesModal = document.getElementById("memoriesModal");
const closeMemoriesModalBtn = document.getElementById("closeMemoriesModal");

function openMemoriesModal(event) {
    currentMemoryEventId = event._id;

    document.getElementById("memorySummary").value = event.pastEvent?.summary || "";
    document.getElementById("memoryHighlights").value =
        (event.pastEvent?.highlights || []).join("\n");
    document.getElementById("memoryPhotos").value =
        (event.pastEvent?.photos || []).join("\n");

    if (memoriesModal) memoriesModal.hidden = false;
}

if (closeMemoriesModalBtn) {
    closeMemoriesModalBtn.addEventListener("click", () => {
        if (memoriesModal) memoriesModal.hidden = true;
        currentMemoryEventId = null;
    });
}

function collectMemoryPayload() {
    const summary = document.getElementById("memorySummary").value.trim();

    const highlights = document.getElementById("memoryHighlights").value
        .split("\n")
        .map(h => h.trim())
        .filter(Boolean);

    const photos = document.getElementById("memoryPhotos").value
        .split("\n")
        .map(p => p.trim())
        .filter(Boolean);

    return { summary, highlights, photos };
}

async function saveMemoryDetails() {
    const token = localStorage.getItem("token");
    const payload = collectMemoryPayload();

    const response = await fetch(
        `${API_BASE}/events/${currentMemoryEventId}/past-details`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        }
    );

    return response.json().then(data => ({ ok: response.ok, data }));
}

const saveDraftBtn = document.getElementById("saveDraftBtn");
if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", async () => {
        try {
            const { ok, data } = await saveMemoryDetails();
            showToast(data.message, ok ? "success" : "error");

            if (ok) {
                memoriesModal.hidden = true;
                loadHostedEvents();
            }
        } catch (error) {
            console.error(error);
            showToast("Could not save draft.", "error");
        }
    });
}

const publishBtn = document.getElementById("publishBtn");
if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
        try {
            const { ok, data } = await saveMemoryDetails();

            if (!ok) {
                showToast(data.message, "error");
                return;
            }

            const token = localStorage.getItem("token");

            const publishResponse = await fetch(
                `${API_BASE}/events/${currentMemoryEventId}/publish-past`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const publishData = await publishResponse.json();
            showToast(publishData.message, publishResponse.ok ? "success" : "error");

            if (publishResponse.ok) {
                memoriesModal.hidden = true;
                loadHostedEvents();
            }
        } catch (error) {
            console.error(error);
            showToast("Could not publish memories.", "error");
        }
    });
}

function viewPastEvent(eventId) {
    localStorage.setItem("viewPastEventId", eventId);
    window.location.href = "pastEventDetails.html";
}

// ======================
// PAST EVENTS GALLERY (user-facing)
// ======================
const pastEventsGrid = document.getElementById("pastEventsGrid");

if (pastEventsGrid) {
    loadPastEventsGallery();
}

async function loadPastEventsGallery() {
    const loader = document.getElementById("pastEventsLoader");
    const emptyState = document.getElementById("pastEventsEmpty");

    if (loader) loader.style.display = "flex";

    try {
        const response = await fetch(`${API_BASE}/events/past`);
        const events = await response.json();

        pastEventsGrid.innerHTML = "";

        if (!events || events.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        events.forEach((event, index) => {
            const card = document.createElement("div");
            card.className = "event-card past-event-card";
            card.style.animationDelay = `${index * 80}ms`;

            const coverPhoto = event.pastEvent?.photos?.[0];

            card.innerHTML = `
                ${coverPhoto ? `<img class="past-event-cover" src="${coverPhoto}" alt="${event.title}">` : ""}
                <h2>${event.title}</h2>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p>${(event.pastEvent?.summary || "").slice(0, 120)}${(event.pastEvent?.summary || "").length > 120 ? "…" : ""}</p>
                <button data-event-id="${event._id}">View Memories →</button>
            `;

            card.querySelector("button").addEventListener("click", () => {
                localStorage.setItem("viewPastEventId", event._id);
                window.location.href = "pastEventDetails.html";
            });

            attachTilt(card);
            pastEventsGrid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        showToast("Could not load past events.", "error");
    } finally {
        if (loader) loader.style.display = "none";
    }
}

// ======================
// PAST EVENT DETAILS (user-facing single page)
// ======================
const pastDetailContainer = document.getElementById("pastDetailContainer");

if (pastDetailContainer) {
    loadPastEventDetails();
}

async function loadPastEventDetails() {
    const loader = document.getElementById("pastDetailLoader");
    if (loader) loader.style.display = "flex";

    const eventId = localStorage.getItem("viewPastEventId");

    try {
        const response = await fetch(`${API_BASE}/events/past`);
        const events = await response.json();

        const event = events.find(e => e._id === eventId);

        if (!event) {
            pastDetailContainer.innerHTML = "<p>Event memories not found.</p>";
            return;
        }

        const photos = event.pastEvent?.photos || [];
        const highlights = event.pastEvent?.highlights || [];

        pastDetailContainer.innerHTML = `
            <div class="past-detail-header">
                <h1>${event.title}</h1>
                <p><strong>📅</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>📍</strong> ${event.venue}</p>
                <p><strong>👥 Hosted by</strong> ${event.createdBy?.name || "NexMeet Host"}</p>
            </div>

            <div class="past-detail-summary">
                <h2>Event Summary</h2>
                <p>${event.pastEvent?.summary || ""}</p>
            </div>

            ${highlights.length > 0 ? `
                <div class="past-detail-highlights">
                    <h2>✨ Highlights</h2>
                    <ul>
                        ${highlights.map(h => `<li>${h}</li>`).join("")}
                    </ul>
                </div>
            ` : ""}

            ${photos.length > 0 ? `
                <div class="past-detail-gallery">
                    <h2>📸 Photo Gallery</h2>
                    <div class="gallery-grid">
                        ${photos.map(p => `<img src="${p}" alt="${event.title}">`).join("")}
                    </div>
                </div>
            ` : ""}
        `;

    } catch (error) {
        console.error(error);
        pastDetailContainer.innerHTML = "<p>Could not load event memories.</p>";
    } finally {
        if (loader) loader.style.display = "none";
    }
}

async function deleteEvent(eventId) {

    const confirmDelete = confirm("Are you sure you want to delete this event?");

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
        `https://nexmeet-backend-2hqz.onrender.com/api/events/${eventId}`,
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

    const response = await fetch("https://nexmeet-backend-2hqz.onrender.com/api/events");

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
        `https://nexmeet-backend-2hqz.onrender.com/api/events/${eventId}`,
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
            `https://nexmeet-backend-2hqz.onrender.com/api/events/${eventId}/registrations`,
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