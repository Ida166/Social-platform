import { getClubs, getEvents, getJoinCount, joinClub } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#6f8a6d", "#5f8f9b", "#795548", "#607d8b", "#34495e"
];

const role = sessionStorage.getItem("role");
const isOwner = role === "club_owner";
const dashboardUrl = isOwner ? "/owner/index" : "/student/index";

document.getElementById("dashboardLink").addEventListener("click", () => {
    window.location.href = dashboardUrl;
});

function buildSwatchesHTML(selectedColor, takenColors = []) {
    return PRESET_COLORS.map(c => {
        const isTaken = takenColors.includes(c);
        const isSelected = c === selectedColor;
        const classes = ["color-swatch", isSelected ? "selected" : "", isTaken ? "taken" : ""].filter(Boolean).join(" ");
        return `<div class="${classes}" data-color="${c}" style="background:${c};" title="${isTaken ? "Already taken" : c}"></div>`;
    }).join("");
}

async function init() {
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get("id");
    const container = document.getElementById("club-page-content");

    if (!clubId) {
        container.innerHTML = "<p>No club specified.</p>";
        return;
    }

    const [clubs, events, members] = await Promise.all([
        getClubs(),
        getEvents(),
        getJoinCount(clubId)
    ]);

    const club = clubs.find(c => String(c.id) === String(clubId));
    if (!club) {
        container.innerHTML = "<p>Club not found.</p>";
        return;
    }

    const clubEvents = events.filter(
        e => String(e.clubId) === String(clubId) && e.isPublished === true
    );

    const eventsHTML = clubEvents.length > 0
        ? clubEvents.map(event => `
            <div class="event-card" data-event-id="${event.id}" ${club.color ? `style="border-left:4px solid ${club.color};"` : ""}>
                <h3>${event.title || "Event"}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Place:</strong> ${event.location}</p>
                ${isOwner ? `<div class="event-actions"><button class="button edit-event-button blue-btn">Edit</button></div>` : ""}
            </div>
        `).join("")
        : "<p>No events available yet</p>";

    const timeParts = (club.regularTime || "").split(" - ");
    container.innerHTML = `
        <div class="content-area">
            <div class="club-page-topbar">
                <button id="back-btn" class="back-btn">Go Back</button>
                ${isOwner ? `<button id="edit-club-btn" class="edit-club-btn">Edit Club</button>` : ""}
            </div>

            <h1>${club.name}</h1>

            <div class="white-box">
                <div class="hero">
                    ${club.image ? `<img src="${club.image}" alt="${club.name}" />` : ""}
                </div>

                <div class="description">
                    <p><strong>Join us!</strong><br />${club.description || ""}</p>
                </div>

                <div class="info-section">
                    <div class="info-card">
                        <h3>Meeting day:</h3>
                        <p>${club.regularDate || "Information follows"}</p>
                        <h3>Time:</h3>
                        <p>${club.regularTime || "Information follows"}</p>
                        <h3>Place:</h3>
                        <p>${club.regularPlace || "Information follows"}</p>
                    </div>
                    <div class="info-card">
                        <h3>Current members:</h3>
                        <p>${members.joined} members</p>
                        <h3>Contact info:</h3>
                        <p>${club.contactEmail || "No email provided"}</p>
                        <p>${club.phone || "No phone provided"}</p>
                    </div>
                    <button class="join-btn" id="join-btn">Join us</button>
                </div>

                <div class="event-section">
                    <h2>Events</h2>
                    ${eventsHTML}
                </div>
            </div>
        </div>

        ${isOwner ? `
        <div class="edit-modal-overlay" id="edit-modal-overlay">
            <div class="edit-modal">
                <div class="edit-modal-header">
                    <h3>Edit Club Info</h3>
                    <button class="edit-modal-close" id="edit-modal-close">✕</button>
                </div>

                <label>Meeting day</label>
                <input type="text" id="edit-regularDate" value="${club.regularDate || ""}" placeholder="e.g. Every Tuesday" />

                <label>Meeting time</label>
                <div class="edit-time-row">
                    <input type="time" id="edit-timeStart" value="${timeParts[0] || ""}" />
                    <input type="time" id="edit-timeEnd" value="${timeParts[1] || ""}" />
                </div>

                <label>Meeting place</label>
                <input type="text" id="edit-regularPlace" value="${club.regularPlace || ""}" placeholder="e.g. Room A2.15" />

                <label>Description</label>
                <textarea id="edit-description">${club.description || ""}</textarea>

                <label>Contact email</label>
                <input type="email" id="edit-contactEmail" value="${club.contactEmail || ""}" />

                <label>Phone</label>
                <input type="tel" id="edit-phone" value="${club.phone || ""}" />

                <label>Club image</label>
                <input type="file" id="edit-image" accept="image/*" />

                <label>Club colour</label>
                <div class="color-swatches" id="color-swatches">
                    ${buildSwatchesHTML(club.color || "", clubs.filter(c => String(c.id) !== String(clubId)).map(c => c.color).filter(Boolean))}
                </div>
                <div class="color-warning hidden" id="color-warning"></div>

                <button class="edit-save-btn" id="edit-save-btn">Save changes</button>
                <div class="edit-status" id="edit-status"></div>
            </div>
        </div>
        ` : ""}
    `;

    // Back button
    document.getElementById("back-btn").addEventListener("click", () => {
        window.history.length > 1 ? window.history.back() : window.location.href = "/components/clubs.html";
    });

    // Join button
    document.getElementById("join-btn").addEventListener("click", async () => {
        const result = await joinClub(clubId);
        if (!result) return;
        document.getElementById("join-btn").textContent = "You joined the club!";
    });

    if (!isOwner) return;

    // Edit event buttons
    document.querySelectorAll(".edit-event-button").forEach(button => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            const card = button.closest(".event-card");
            const eventId = card.dataset.eventId;
            const event = clubEvents.find(ev => String(ev.id) === String(eventId));
            if (!event) return;

            const [timeStart, timeEnd] = (event.time || "").split(" - ");

            const existing = document.getElementById("edit-event-modal");
            if (existing) existing.remove();

            const modal = document.createElement("div");
            modal.id = "edit-event-modal";
            modal.className = "edit-modal-overlay";
            modal.innerHTML = `
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <h3>Edit Event</h3>
                        <button class="edit-modal-close" id="close-edit-event">✕</button>
                    </div>
                    <label>Title</label>
                    <input type="text" id="edit-event-title" value="${event.title || ""}" />
                    <label>Date</label>
                    <input type="date" id="edit-event-date" value="${event.date || ""}" />
                    <label>Time</label>
                    <div class="edit-time-row">
                        <input type="time" id="edit-event-timeStart" value="${timeStart?.trim() || ""}" />
                        <input type="time" id="edit-event-timeEnd" value="${timeEnd?.trim() || ""}" />
                    </div>
                    <label>Location</label>
                    <input type="text" id="edit-event-location" value="${event.location || ""}" />
                    <label>Description</label>
                    <textarea id="edit-event-description">${event.description || ""}</textarea>
                    <label>Practical Information</label>
                    <input type="text" id="edit-event-practicalInfo" value="${event.practicalInfo || ""}" />
                    <button class="edit-save-btn" id="save-edit-event">Save changes</button>
                    <div class="edit-status" id="edit-event-status"></div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.classList.add("open");

            document.getElementById("close-edit-event").addEventListener("click", () => modal.remove());
            modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });

            document.getElementById("save-edit-event").addEventListener("click", async () => {
                const saveBtn = document.getElementById("save-edit-event");
                const statusEl = document.getElementById("edit-event-status");
                saveBtn.disabled = true;
                statusEl.textContent = "Saving...";

                try {
                    const res = await fetch(`/events/${eventId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: document.getElementById("edit-event-title").value,
                            date: document.getElementById("edit-event-date").value,
                            timeStart: document.getElementById("edit-event-timeStart").value,
                            timeEnd: document.getElementById("edit-event-timeEnd").value,
                            location: document.getElementById("edit-event-location").value,
                            description: document.getElementById("edit-event-description").value,
                            practicalInfo: document.getElementById("edit-event-practicalInfo").value
                        })
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || "Failed to save.");
                    }

                    modal.remove();
                    window.location.reload();
                } catch (err) {
                    statusEl.textContent = err.message;
                } finally {
                    saveBtn.disabled = false;
                }
            });
        });
    });

    const overlay = document.getElementById("edit-modal-overlay");

    document.getElementById("edit-club-btn").addEventListener("click", () => {
        overlay.classList.add("open");
    });

    document.getElementById("edit-modal-close").addEventListener("click", () => {
        overlay.classList.remove("open");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("open");
    });

    // Colour swatch selection + live uniqueness check
    let selectedColor = club.color || "";
    const swatchContainer = document.getElementById("color-swatches");
    const colorWarning = document.getElementById("color-warning");

    swatchContainer.addEventListener("click", (e) => {
        const swatch = e.target.closest(".color-swatch");
        if (!swatch || swatch.classList.contains("taken")) return;

        swatchContainer.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
        colorWarning.classList.add("hidden");
        swatch.classList.add("selected");
        selectedColor = swatch.dataset.color;
    });

    // Save button
    document.getElementById("edit-save-btn").addEventListener("click", async () => {
        const saveBtn = document.getElementById("edit-save-btn");
        const statusEl = document.getElementById("edit-status");
        saveBtn.disabled = true;
        statusEl.textContent = "Saving...";

        try {
            const timeStart = document.getElementById("edit-timeStart")?.value || "";
            const timeEnd = document.getElementById("edit-timeEnd")?.value || "";
            const regularTime = [timeStart, timeEnd].filter(Boolean).join(" - ");

            const payload = {
                regularDate: document.getElementById("edit-regularDate")?.value || "",
                regularTime,
                regularPlace: document.getElementById("edit-regularPlace")?.value || "",
                description: document.getElementById("edit-description")?.value || "",
                contactEmail: document.getElementById("edit-contactEmail")?.value || "",
                phone: document.getElementById("edit-phone")?.value || "",
                color: selectedColor
            };
            const res = await fetch(`/clubs/${clubId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.message || "Failed to save.");
            }
            const saved = await res.json();

            const imageFile = document.getElementById("edit-image")?.files?.[0];
            if (imageFile) {
                const fd = new FormData();
                fd.append("image", imageFile);
                const imgRes = await fetch(`/clubs/${clubId}/image`, { method: "POST", body: fd });
                if (!imgRes.ok) {
                    const imgErr = await imgRes.json();
                    throw new Error(imgErr.error || "Image upload failed.");
                }
            }

            overlay.classList.remove("open");
            setTimeout(() => window.location.reload(), 800);
        } catch (err) {
            statusEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    });
}

init();
