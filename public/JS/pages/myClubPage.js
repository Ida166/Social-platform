import { getClubs, getEvents, getJoinCount, joinClub } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#6f8a6d", "#5f8f9b", "#795548", "#607d8b", "#34495e"
];

function buildSwatchesHTML(selectedColor) {
    return PRESET_COLORS.map(c => `
        <div class="color-swatch${c === selectedColor ? " selected" : ""}"
             data-color="${c}" style="background:${c};" title="${c}"></div>
    `).join("");
}

async function init() {
    const container = document.getElementById("myclub-content");

    const [clubs, events] = await Promise.all([getClubs(), getEvents()]);

    // Find owner's club: prefer the one stored from the dashboard, else first with owner_id, else first club
    const storedId = sessionStorage.getItem("myClubId");
    const club = (storedId && clubs.find(c => String(c.id) === storedId))
        || clubs.find(c => c.owner_id)
        || clubs[0];

    if (!club) {
        container.innerHTML = "<p>No club found.</p>";
        return;
    }

    // Store so other pages know which club this owner manages
    sessionStorage.setItem("myClubId", String(club.id));

    const members = await getJoinCount(club.id);

    const clubEvents = events.filter(
        e => String(e.clubId) === String(club.id) && e.isPublished === true
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
        : "<p>No events yet</p>";

    const timeParts = (club.regularTime || "").split(" - ");

    container.innerHTML = `
        <div class="myclub-shell">
            <div class="myclub-header">
                ${club.image ? `<img src="${club.image}" alt="${club.name}" class="myclub-hero-img" />` : ""}
                <div>
                    <h2>${club.name}</h2>
                    <p>${club.category || ""} · ${members.joined} members</p>
                </div>
            </div>

            <div class="myclub-form">
                <div class="myclub-section">
                    <h3>Schedule</h3>
                    <label>Meeting day
                        <input type="text" id="edit-regularDate" value="${club.regularDate || ""}" placeholder="e.g. Every Tuesday" />
                    </label>
                    <label>Start time
                        <input type="time" id="edit-timeStart" value="${timeParts[0] || ""}" />
                    </label>
                    <label>End time
                        <input type="time" id="edit-timeEnd" value="${timeParts[1] || ""}" />
                    </label>
                    <label>Place
                        <input type="text" id="edit-regularPlace" value="${club.regularPlace || ""}" placeholder="e.g. Room A2.15" />
                    </label>
                </div>

                <div class="myclub-section">
                    <h3>Contact Info</h3>
                    <label>Email
                        <input type="email" id="edit-contactEmail" value="${club.contactEmail || ""}" placeholder="Contact email" />
                    </label>
                    <label>Phone
                        <input type="tel" id="edit-phone" value="${club.phone || ""}" placeholder="Phone number" />
                    </label>
                </div>

                <div class="myclub-section">
                    <h3>Description</h3>
                    <textarea id="edit-description" style="padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;min-height:80px;resize:vertical;">${club.description || ""}</textarea>
                </div>

                <div class="myclub-section">
                    <h3>Club Image</h3>
                    <input type="file" id="edit-image" accept="image/*" />
                </div>

                <div class="myclub-section">
                    <h3>Club Colour</h3>
                    <div class="color-swatches" id="color-swatches">
                        ${buildSwatchesHTML(club.color || "")}
                    </div>
                    <div class="color-warning hidden" id="color-warning"></div>
                </div>

                <p id="myclub-status" aria-live="polite"></p>

                <div class="myclub-actions">
                    <button type="button" class="role-button primary-button" id="save-btn">Save changes</button>
                </div>
            </div>

            <div style="margin-top:30px;">
                <h3>Events</h3>
                ${eventsHTML}
            </div>
        </div>
    `;

    // Colour swatch selection + uniqueness check
    let selectedColor = club.color || "";
    const swatchContainer = document.getElementById("color-swatches");
    const colorWarning = document.getElementById("color-warning");

    swatchContainer.addEventListener("click", async (e) => {
        const swatch = e.target.closest(".color-swatch");
        if (!swatch) return;
        const color = swatch.dataset.color;

        const allClubs = await getClubs();
        const takenBy = allClubs.find(c => c.color === color && String(c.id) !== String(club.id));

        swatchContainer.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));

        if (takenBy) {
            colorWarning.classList.remove("hidden");
            colorWarning.textContent = `Colour already used by "${takenBy.name}".`;
            selectedColor = "";
        } else {
            colorWarning.classList.add("hidden");
            swatch.classList.add("selected");
            selectedColor = color;
        }
    });

    // Save
    const status = document.getElementById("myclub-status");
    document.getElementById("save-btn").addEventListener("click", async () => {
        status.textContent = "Saving...";
        try {
            const timeStart = document.getElementById("edit-timeStart")?.value || "";
            const timeEnd = document.getElementById("edit-timeEnd")?.value || "";

            const payload = {
                regularDate: document.getElementById("edit-regularDate")?.value || "",
                regularTime: [timeStart, timeEnd].filter(Boolean).join(" - "),
                regularPlace: document.getElementById("edit-regularPlace")?.value || "",
                description: document.getElementById("edit-description")?.value || "",
                contactEmail: document.getElementById("edit-contactEmail")?.value || "",
                phone: document.getElementById("edit-phone")?.value || "",
                color: selectedColor
            };

            const res = await fetch(`/clubs/${club.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.message || "Failed to save.");
            }

            // Image upload
            const imageFile = document.getElementById("edit-image")?.files?.[0];
            if (imageFile) {
                const fd = new FormData();
                fd.append("image", imageFile);
                const imgRes = await fetch(`/clubs/${club.id}/image`, { method: "POST", body: fd });
                if (!imgRes.ok) throw new Error("Image upload failed.");
            }

            status.textContent = "Saved!";
            setTimeout(() => window.location.reload(), 800);
        } catch (err) {
            status.textContent = err.message;
        }
    });
}

init();
