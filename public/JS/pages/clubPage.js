import { getClubs } from "./clubServices.js";
import { getEvents } from "./clubServices.js";
import { getJoinCount } from "./clubServices.js";
import { joinClub } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#6f8a6d", "#5f8f9b", "#795548", "#607d8b", "#34495e"
];

function buildSwatchesHTML(selectedColor) {
    return PRESET_COLORS.map(c => `
        <div class="color-swatch${c === selectedColor ? " selected" : ""}"
             data-color="${c}"
             style="background:${c};"
             title="${c}"></div>
    `).join("");
}

export async function openClubPage(clubId, container) {
    const [clubs, events, members] = await Promise.all([
        getClubs(),
        getEvents(),
        getJoinCount(clubId)
    ]);

    const club = clubs.find(c => String(c.id) === String(clubId));

    if (!club) {
        container.innerHTML = "<p>Club not found</p>";
        return;
    }

    const clubEvents = events.filter(
        e => String(e.clubId) === String(clubId) && e.isPublished === true
    );

    const eventsHTML = clubEvents.length > 0
        ? clubEvents.map(event => `
            <div class="event-card">
                <h3>${event.title || "Event"}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Place:</strong> ${event.location}</p>
            </div>
        `).join("")
        : "<p>No events available yet</p>";

    const isOwner = sessionStorage.getItem("role") === "club_owner";

    container.innerHTML = `
        <div class="content-area">
            <div class="club-page-topbar">
                <button id="close-event-page" class="back-btn">Go Back</button>
                ${isOwner ? `<button class="edit-club-btn" id="edit-club-btn">Edit Club</button>` : ""}
            </div>

            <h1>Events & clubs - ${club.name}</h1>

            <div class="white-box">
                <div class="hero">
                    <img src="${club.image || ""}" alt="${club.name}" />
                </div>

                <div class="description">
                    <p><strong>Join us!</strong><br />${club.description || ""}</p>
                </div>

                <div class="info-section">
                    <div class="info-card">
                        <h3>Date:</h3>
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
                        <p>${club.phone || "No phone number provided"}</p>
                    </div>

                    <button class="join-btn">Join us</button>
                </div>

                <div class="event-section">
                    <h2>Events</h2>
                    ${eventsHTML}
                </div>
            </div>

            ${isOwner ? `
            <div class="edit-club-form hidden" id="edit-club-form">
                <h3>Edit Club Info</h3>

                <label>Meeting day</label>
                <input type="text" id="edit-regularDate" value="${club.regularDate || ""}" placeholder="e.g. Every Tuesday" />

                <label>Meeting time</label>
                <div class="edit-time-row">
                    <input type="time" id="edit-timeStart" value="${club.regularTime ? club.regularTime.split(" - ")[0] : ""}" />
                    <input type="time" id="edit-timeEnd" value="${club.regularTime ? club.regularTime.split(" - ")[1] : ""}" />
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
                    ${buildSwatchesHTML(club.Color || "")}
                </div>
                <div class="color-warning hidden" id="color-warning">This colour is already taken by another club.</div>

                <button class="edit-save-btn" id="edit-save-btn">Save changes</button>
                <div class="edit-status" id="edit-status"></div>
            </div>
            ` : ""}
        </div>
    `;

    // Join button
    const joinBtn = container.querySelector(".join-btn");
    if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
            const result = await joinClub(clubId);
            if (!result) return;
            joinBtn.textContent = "You joined the club!";
        });
    }

    // Close button
    const closeBtn = container.querySelector("#close-event-page");
    if (closeBtn) {
        closeBtn.addEventListener("click", async () => {
            const response = await fetch("/components/club_list.html");
            const html = await response.text();
            container.innerHTML = html;
            if (typeof window.reloadClubs === "function") await window.reloadClubs();
        });
    }

    if (!isOwner) return;

    // Toggle edit form
    const editBtn = container.querySelector("#edit-club-btn");
    const editForm = container.querySelector("#edit-club-form");
    if (editBtn && editForm) {
        editBtn.addEventListener("click", () => {
            editForm.classList.toggle("hidden");
        });
    }

    // Colour swatch selection + live uniqueness check
    let selectedColor = club.Color || "";
    const swatchContainer = container.querySelector("#color-swatches");
    const colorWarning = container.querySelector("#color-warning");

    if (swatchContainer) {
        swatchContainer.addEventListener("click", async (e) => {
            const swatch = e.target.closest(".color-swatch");
            if (!swatch) return;

            const color = swatch.dataset.color;

            // Check uniqueness
            const allClubs = await getClubs();
            const takenBy = allClubs.find(c => c.Color === color && String(c.id) !== String(clubId));

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
    }

    // Save button
    const saveBtn = container.querySelector("#edit-save-btn");
    const statusEl = container.querySelector("#edit-status");

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            saveBtn.disabled = true;
            if (statusEl) statusEl.textContent = "Saving...";

            try {
                const timeStart = container.querySelector("#edit-timeStart")?.value || "";
                const timeEnd = container.querySelector("#edit-timeEnd")?.value || "";
                const regularTime = [timeStart, timeEnd].filter(Boolean).join(" - ");

                const payload = {
                    regularDate: container.querySelector("#edit-regularDate")?.value || "",
                    regularTime,
                    regularPlace: container.querySelector("#edit-regularPlace")?.value || "",
                    description: container.querySelector("#edit-description")?.value || "",
                    contactEmail: container.querySelector("#edit-contactEmail")?.value || "",
                    phone: container.querySelector("#edit-phone")?.value || "",
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

                // Upload image if selected
                const imageFile = container.querySelector("#edit-image")?.files?.[0];
                if (imageFile) {
                    const fd = new FormData();
                    fd.append("image", imageFile);
                    const imgRes = await fetch(`/clubs/${clubId}/image`, {
                        method: "POST",
                        body: fd
                    });
                    if (!imgRes.ok) {
                        const imgErr = await imgRes.json();
                        throw new Error(imgErr.error || "Image upload failed.");
                    }
                }

                if (statusEl) statusEl.textContent = "Saved!";
            } catch (err) {
                if (statusEl) statusEl.textContent = err.message;
            } finally {
                saveBtn.disabled = false;
            }
        });
    }
}
