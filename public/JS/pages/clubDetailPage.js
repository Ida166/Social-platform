import { getClubs, getEvents, getJoinCount, joinClub } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#6f8a6d", "#5f8f9b", "#795548", "#607d8b", "#34495e"
];

const role = sessionStorage.getItem("role");
const isOwner = role === "club_owner";
const myClubId = sessionStorage.getItem("myClubId");
const dashboardUrl = isOwner ? "/owner/index" : "/student/index";

document.getElementById("dashboardLink").addEventListener("click", () => {
    window.location.href = dashboardUrl;
});

function buildSwatchesHTML(selectedColor) {
    return PRESET_COLORS.map(c => `
        <div class="color-swatch${c === selectedColor ? " selected" : ""}"
             data-color="${c}" style="background:${c};" title="${c}"></div>
    `).join("");
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
            <div class="event-card" ${club.color ? `style="border-left:4px solid ${club.color};"` : ""}>
                <h3>${event.title || "Event"}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Place:</strong> ${event.location}</p>
            </div>
        `).join("")
        : "<p>No events available yet</p>";

    const timeParts = (club.regularTime || "").split(" - ");
    const isMyClub = isOwner && String(club.id) === myClubId;

    container.innerHTML = `
        <div class="content-area">
            <div class="club-page-topbar">
                <button id="back-btn" class="back-btn">← Back to clubs</button>
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

            ${isMyClub ? `
            <div class="edit-club-form" id="edit-club-form">
                <h3>Edit Club Info</h3>

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
                    ${buildSwatchesHTML(club.color || "")}
                </div>
                <div class="color-warning hidden" id="color-warning"></div>

                <button class="edit-save-btn" id="edit-save-btn">Save changes</button>
                <div class="edit-status" id="edit-status"></div>
            </div>
            ` : ""}
        </div>
    `;

    // Back button
    document.getElementById("back-btn").addEventListener("click", () => {
        window.history.length > 1 ? window.history.back() : window.location.href = "/clubs.html";
    });

    // Join button
    document.getElementById("join-btn").addEventListener("click", async () => {
        const result = await joinClub(clubId);
        if (!result) return;
        document.getElementById("join-btn").textContent = "You joined the club!";
    });

    if (!isMyClub) return;

    // Colour swatch selection + live uniqueness check
    let selectedColor = club.color || "";
    const swatchContainer = document.getElementById("color-swatches");
    const colorWarning = document.getElementById("color-warning");

    swatchContainer.addEventListener("click", async (e) => {
        const swatch = e.target.closest(".color-swatch");
        if (!swatch) return;
        const color = swatch.dataset.color;

        const allClubs = await getClubs();
        const takenBy = allClubs.find(c => c.color === color && String(c.id) !== String(clubId));

        swatchContainer.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));

        if (takenBy) {
            colorWarning.classList.remove("hidden");
            colorWarning.textContent = `This colour is already used by "${takenBy.name}".`;
            selectedColor = "";
        } else {
            colorWarning.classList.add("hidden");
            swatch.classList.add("selected");
            selectedColor = color;
        }
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

            statusEl.textContent = "Saved! Reloading...";
            setTimeout(() => window.location.reload(), 800);
        } catch (err) {
            statusEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    });
}

init();
