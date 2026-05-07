import { getClubs, getEvents, getJoinCount, joinClub, getUserRole } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#6f8a6d", "#5f8f9b", "#795548", "#607d8b", "#34495e"
];

const role = sessionStorage.getItem("role");
const isOwner = role === "club_owner";
const dashboardUrl = isOwner ? "/owner/index" : "/student/index";

document.getElementById("eventsAndClubsLink")?.addEventListener("click", () => {
    window.location.href = dashboardUrl;
});

function setupColorSwatches(selectedColor, takenColors = []) {
    const swatchContainer = document.getElementById("color-swatches");
    if (!swatchContainer) return;

    swatchContainer.innerHTML = PRESET_COLORS.map(c => {
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

    document.getElementById("club-name-header").textContent = club.name;
    document.getElementById("club-description-text").textContent = club.description || "";
    document.getElementById("club-date").textContent = club.regularDate || "Information follows";
    document.getElementById("club-time").textContent = club.regularTime || "Information follows";
    document.getElementById("club-place").textContent = club.regularPlace || "Information follows";
    document.getElementById("club-members-count").textContent = `${members.joined} members`;
    document.getElementById("club-email").textContent = club.contactEmail || "No email provided";
    document.getElementById("club-phone").textContent = club.phone || "No phone provided";

   if (club.image) {
    const heroContainer = document.getElementById("club-hero-image");
    const img = document.createElement("img");
    img.src = club.image;
    img.alt = club.name;
    heroContainer.innerHTML = ""; // Tøm containeren
    heroContainer.appendChild(img);
}

    // Render events
    const eventList = document.getElementById("event-list");
    const eventTemplate = document.getElementById("event-card-template");
    eventList.innerHTML = ""; 

    if (clubEvents.length === 0) {
        eventList.innerHTML = "<p>No events available yet</p>";
    } else {
        clubEvents.forEach(event => {
            const clone = eventTemplate.content.cloneNode(true);
            const card = clone.querySelector(".event-card");
            
            // Event ID på kortet så vi kan finde det igen ved Edit
            card.setAttribute("data-event-id", event.id);
            
            if (club.color) card.style.borderLeft = `4px solid ${club.color}`;
            
            clone.querySelector(".event-title").textContent = event.title || "Event";
            clone.querySelector(".event-date").textContent = event.date;
            clone.querySelector(".event-time").textContent = event.time;
            clone.querySelector(".event-location").textContent = event.location;

            if (isOwner) {
                clone.querySelector(".event-actions").innerHTML = `<button class="button edit-event-button blue-btn">Edit</button>`;
            }
            eventList.appendChild(clone);
        });
    }
    
    // Back button
    document.getElementById("back-btn").addEventListener("click", () => {
        window.history.length > 1 ? window.history.back() : window.location.href = "/components/clubs.html";
    });

    const userRole = await getUserRole();
    if(userRole === "student"){
        const joinbtn = document.getElementById("join-btn");
        joinbtn.classList.remove("hidden");
        joinbtn.addEventListener("click", async () => {
            const result = await joinClub(clubId);
            if (!result) return;
            joinbtn.textContent = "You joined the club!";
        });
    }

    if (!isOwner) return;

    const timeParts = (club.regularTime || "").split(" - ");

    //OWNER LOGIK (Edit Club)
    document.getElementById("edit-club-btn").style.display = "block"; 
    document.getElementById("edit-regularDate").value = club.regularDate || "";
    document.getElementById("edit-timeStart").value = timeParts[0]?.trim() || "";
    document.getElementById("edit-timeEnd").value = timeParts[1]?.trim() || "";
    document.getElementById("edit-regularPlace").value = club.regularPlace || "";
    document.getElementById("edit-description").value = club.description || "";
    document.getElementById("edit-contactEmail").value = club.contactEmail || "";
    document.getElementById("edit-phone").value = club.phone || "";

    // Farve swatches
    const takenColors = clubs.map(c => c.color).filter(c => c && c !== club.color);
    setupColorSwatches(club.color, takenColors);

    //EDIT EVENT LOGIK
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("edit-event-button")) return;

        const card = e.target.closest(".event-card");
        const eventId = card.getAttribute("data-event-id");
        const event = clubEvents.find(ev => String(ev.id) === String(eventId));
        if (!event) return;

        const [eStart, eEnd] = (event.time || "").split(" - ");

        // Brug template til Edit Event Modal
        const temp = document.getElementById("edit-event-modal-template");
        const clone = temp.content.cloneNode(true);
        const modalOverlay = clone.querySelector(".edit-modal-overlay");

        // Fyld felterne i templaten
        clone.getElementById("edit-event-title").value = event.title || "";
        clone.getElementById("edit-event-date").value = event.date || "";
        clone.getElementById("edit-event-timeStart").value = eStart?.trim() || "";
        clone.getElementById("edit-event-timeEnd").value = eEnd?.trim() || "";
        clone.getElementById("edit-event-location").value = event.location || "";
        clone.getElementById("edit-event-description").value = event.description || "";
        clone.getElementById("edit-event-practicalInfo").value = event.practicalInfo || "";

        document.body.appendChild(clone);
        
        // Find den aktive modal 
        const activeModal = document.getElementById("edit-event-modal");
        activeModal.classList.add("open");

        // Luk modal
        activeModal.querySelector("#close-edit-event").addEventListener("click", () => activeModal.remove());

        // Gem event ændringer
        activeModal.querySelector("#save-edit-event").addEventListener("click", async () => {
            const saveBtn = activeModal.querySelector("#save-edit-event");
            saveBtn.disabled = true;
            
            const payload = {
                title: activeModal.querySelector("#edit-event-title").value,
                date: activeModal.querySelector("#edit-event-date").value,
                timeStart: activeModal.querySelector("#edit-event-timeStart").value,
                timeEnd: activeModal.querySelector("#edit-event-timeEnd").value,
                location: activeModal.querySelector("#edit-event-location").value,
                description: activeModal.querySelector("#edit-event-description").value,
                practicalInfo: activeModal.querySelector("#edit-event-practicalInfo").value
            };

            try {
                const res = await fetch(`/events/${eventId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) window.location.reload();
            } catch (err) {
                console.error(err);
                saveBtn.disabled = false;
            }
        });
    });

    //MODAL OVERLAY LOGIK (Club Edit)
    const overlay = document.getElementById("edit-modal-overlay");
    document.getElementById("edit-club-btn").addEventListener("click", () => overlay.classList.add("open"));
    document.getElementById("edit-modal-close").addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });

    let selectedColor = club.color || "";
    document.getElementById("color-swatches").addEventListener("click", (e) => {
        const swatch = e.target.closest(".color-swatch");
        if (!swatch || swatch.classList.contains("taken")) return;
        document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        selectedColor = swatch.dataset.color;
    });

    // Save Club Changes
    document.getElementById("edit-save-btn").addEventListener("click", async () => {
        const statusEl = document.getElementById("edit-status");
        statusEl.textContent = "Saving...";

        const timeStart = document.getElementById("edit-timeStart").value;
        const timeEnd = document.getElementById("edit-timeEnd").value;
        
        const payload = {
            regularDate: document.getElementById("edit-regularDate").value,
            regularTime: `${timeStart} - ${timeEnd}`,
            regularPlace: document.getElementById("edit-regularPlace").value,
            description: document.getElementById("edit-description").value,
            contactEmail: document.getElementById("edit-contactEmail").value,
            phone: document.getElementById("edit-phone").value,
            color: selectedColor
        };

        try {
            const res = await fetch(`/clubs/${clubId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                const imageFile = document.getElementById("edit-image").files[0];
                if (imageFile) {
                    const fd = new FormData();
                    fd.append("image", imageFile);
                    await fetch(`/clubs/${clubId}/image`, { method: "POST", body: fd });
                }
                window.location.reload();
            }
        } catch (err) {
            statusEl.textContent = "Error saving changes.";
        }
    });
}

init();