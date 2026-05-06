/*Import functions */
    import { getClubs } from "./clubServices.js";
    import { getEvents } from "./clubServices.js";
    import { createEvent } from "./clubServices.js";
    import { getEventJoinCount } from "./clubServices.js";
    import { joinEvent } from "./clubServices.js";

const PRESET_COLORS = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
    "#3498db", "#2980b9", "#9b59b6", "#e91e63", "#ff5722",
    "#c0392b", "#27ae60", "#16a085", "#1565c0", "#6a1b9a",
    "#795548", "#607d8b", "#f06292", "#aed581", "#4dd0e1"
];

function buildApplySwatchesHTML(takenColors = []) {
    return PRESET_COLORS.map(c => {
        const isTaken = takenColors.includes(c);
        const classes = ["color-swatch", isTaken ? "taken" : ""].filter(Boolean).join(" ");
        return `<div class="${classes}" data-color="${c}" style="background:${c};" title="${isTaken ? "Already taken" : c}"></div>`;
    }).join("");
}

function initDashboard() {

    // Persist myClubId for owner pages (My Club sidebar link)
    if (sessionStorage.getItem("role") === "club_owner") {
        getClubs().then(clubs => {
            if (!clubs.length) return;
            const myClub = clubs.reduce((max, c) => c.id > max.id ? c : max, clubs[0]);
            sessionStorage.setItem("myClubId", String(myClub.id));
        });
    }

    const dashboardLink = document.getElementById("dashboardLink");
    if (dashboardLink) {
        dashboardLink.addEventListener("click", () => {
            window.location.reload();
        });
    }

    //Redirect to log in page
    const logOut = document.getElementById("logOut");
    if (logOut) {
        logOut.addEventListener("click", async () => {
            await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });

            window.location.href = "/";
        });
    }

    /*oppening and closing of the application for club or events box */
    const apply_create_club_or_event = document.getElementById("createClubOrEvent");
    const apply_create_club_or_event_box = document.getElementById("create-club-or-event_box");
    const createEventButton = document.getElementById("createEventButton");
    const eventPageBox = document.getElementById("event-page-box");

    if (apply_create_club_or_event) {
        apply_create_club_or_event.addEventListener("click", async () => {

            // Hent HTML fra separat fil
            const response = await fetch("/student/application_club-event_form.html");
            const html = await response.text();

            // Indsæt HTML i container
            apply_create_club_or_event_box.innerHTML = html;

            apply_create_club_or_event_box.style.display = "flex";

            // Vis popup
            apply_create_club_or_event_box.classList.remove("hidden");
            // Toggle fields based on radio selection
            const clubCheckbox = document.getElementById('checkBoxClub');
            const eventCheckbox = document.getElementById('checkBoxEvent');
            const clubFields = document.getElementById('club-fields');
            const eventFields = document.getElementById('event-fields');

            let applySelectedColor = "";

            if (clubCheckbox) {
                clubCheckbox.addEventListener('change', async function() {
                    if (this.checked) {
                        clubFields.style.display = 'block';
                        eventFields.style.display = 'none';

                        const swatchContainer = document.getElementById('apply-color-swatches');
                        const colorWarning = document.getElementById('apply-color-warning');
                        if (swatchContainer) {
                            const clubs = await getClubs();
                            const takenColors = clubs.map(c => c.color).filter(Boolean);
                            swatchContainer.innerHTML = buildApplySwatchesHTML(takenColors);

                            swatchContainer.addEventListener('click', (e) => {
                                const swatch = e.target.closest('.color-swatch');
                                if (!swatch || swatch.classList.contains('taken')) return;
                                swatchContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                                if (colorWarning) colorWarning.classList.add('hidden');
                                swatch.classList.add('selected');
                                applySelectedColor = swatch.dataset.color;
                            });
                        }
                    }
                });
            }
            if (eventCheckbox) {
                eventCheckbox.addEventListener('change', async function() {
                    if (this.checked) {
                        eventFields.style.display = 'block';
                        clubFields.style.display = 'none';

                        const clubSelect = document.getElementById('apply-club-select');
                        if (clubSelect && clubSelect.options.length === 1) {
                            const clubs = await getClubs();
                            clubs.forEach(c => {
                                const option = document.createElement('option');
                                option.value = c.id;
                                option.textContent = c.name;
                                clubSelect.appendChild(option);
                            });
                        }
                    }
                });
            }

            // Luk-knap (skal bindes EFTER HTML er indsat)
            const closeBtn = document.getElementById("close-page");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    apply_create_club_or_event_box.classList.add("hidden");
                    apply_create_club_or_event_box.style.display = "none";
                    apply_create_club_or_event_box.innerHTML = "";
                });
            }

            const appForm = document.getElementById("application_for_club_or_event_form");
            if (appForm) {
                appForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(appForm);
                    const submitBtn = appForm.querySelector('button[type="submit"]');
                    const projectType = formData.get("projectType");

                    if (!projectType) {
                        alert("Please select Create Club or Create Event.");
                        return;
                    }

                    try {
                        if (submitBtn) submitBtn.disabled = true;

                        if (projectType === "club") {
                            const payload = {
                                name: formData.get("clubName")?.toString().trim(),
                                category: formData.get("category")?.toString().trim(),
                                contactEmail: formData.get("email")?.toString().trim(),
                                phone: formData.get("phone")?.toString().trim()
                            };

                            if (!payload.name || !payload.category) {
                                alert("Club name and category are required.");
                                return;
                            }

                            const res = await fetch("/clubs", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            });

                            if (!res.ok) {
                                const err = await res.json();
                                throw new Error(err.error || err.message || "Failed to create club.");
                            }

                            const newClub = await res.json();
                            const newClubId = newClub.id;

                            const imageInput = document.getElementById("apply-club-image");
                            if (imageInput && imageInput.files.length > 0) {
                                const imgForm = new FormData();
                                imgForm.append("image", imageInput.files[0]);
                                await fetch(`/clubs/${newClubId}/image`, {
                                    method: "POST",
                                    body: imgForm
                                });
                            }

                            if (applySelectedColor) {
                                await fetch(`/clubs/${newClubId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ color: applySelectedColor })
                                });
                            }

                            alert("Club created successfully!");

                        } else {
                            const payload = {
                                name: formData.get("name")?.toString().trim(),
                                date: formData.get("date")?.toString().trim(),
                                timeStart: formData.get("timeStart")?.toString().trim(),
                                timeEnd: formData.get("timeEnd")?.toString().trim(),
                                clubId: formData.get("clubId") ? Number(formData.get("clubId")) : null,
                                location: formData.get("location")?.toString().trim(),
                                description: formData.get("description")?.toString().trim(),
                                practicalInformation: formData.get("practicalInformation")?.toString().trim(),
                                isPublished: true
                            };

                            if (!payload.name || !payload.date || !payload.timeStart || !payload.timeEnd || !payload.clubId || !payload.location || !payload.description) {
                                alert("Please fill in all required event fields.");
                                return;
                            }

                            const res = await fetch("/events", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            });

                            if (!res.ok) {
                                const err = await res.json();
                                throw new Error(err.error || err.message || "Failed to create event.");
                            }

                            alert("Event created successfully!");
                        }

                        apply_create_club_or_event_box.style.display = "none";
                        apply_create_club_or_event_box.classList.add("hidden");
                        apply_create_club_or_event_box.innerHTML = "";
                    } catch (err) {
                        alert(err.message);
                    } finally {
                        if (submitBtn) submitBtn.disabled = false;
                    }
                });
            }
        });
    }

    if (createEventButton && eventPageBox) {
        createEventButton.addEventListener("click", async () => {

            const response = await fetch("/owner/event_template");
            const html = await response.text();

            eventPageBox.innerHTML = html;
            eventPageBox.style.display = "flex";
            eventPageBox.classList.remove("hidden");

            const closeEventBtn = eventPageBox.querySelector("#close-event-template");
            const eventForm = eventPageBox.querySelector("#event-template-form");
            const statusMessage = eventPageBox.querySelector("#event-form-status");

            // Populate club dropdown
            const clubSelectContainer = eventForm?.querySelector("#club-select-container");
            if (clubSelectContainer) {
                const clubs = await getClubs();
                const select = document.createElement("select");
                select.name = "clubId";
                select.required = true;
                select.innerHTML = `<option value="">Select a club</option>` +
                    clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
                clubSelectContainer.appendChild(select);
            }

            if (closeEventBtn) {
                closeEventBtn.addEventListener("click", () => {
                    eventPageBox.style.display = "none";
                    eventPageBox.classList.add("hidden");
                    eventPageBox.innerHTML = "";
                });
            }

            if (eventForm) {
                eventForm.addEventListener("submit", async submitEvent => {
                    submitEvent.preventDefault();

                    const formData = new FormData(eventForm);
                    const submitButton = eventForm.querySelector('button[type="submit"]');
                    const payload = {
                        name: formData.get("name")?.toString().trim(),
                        date: formData.get("date")?.toString().trim(),
                        timeStart: formData.get("timeStart")?.toString().trim(),
                        timeEnd: formData.get("timeEnd")?.toString().trim(),
                        clubId: formData.get("clubId") ? Number(formData.get("clubId")) : null,
                        location: formData.get("location")?.toString().trim(),
                        description: formData.get("description")?.toString().trim(),
                        practicalInformation: formData.get("practicalInformation")?.toString().trim(),
                        isPublished: true
                    };

                    if (statusMessage) {
                        statusMessage.textContent = "Saving event...";
                    }

                    try {
                        if (submitButton) {
                            submitButton.disabled = true;
                        }

                        await createEvent(payload);

                        if (statusMessage) {
                            statusMessage.textContent = "Event saved.";
                            eventPageBox.style.display = "none";
                            eventPageBox.classList.add("hidden");
                            eventPageBox.innerHTML = "";
                            location.reload();
                        }

                        eventForm.reset();
                    } catch (error) {
                        if (statusMessage) {
                            statusMessage.textContent = error.message;
                        }
                    } finally {
                        if (submitButton) {
                            submitButton.disabled = false;
                        }
                    }
                });
            }
        });
    }
    
    /* Full eventlist */
    // Her indsætter du den nye version af funktionen
    async function loadFullEventList() {
        const events = await getEvents();
        const now = new Date();

        const filteredAndSorted = events
            .filter(event => {
                const eventDateTime = new Date(`${event.date} ${event.time.split("-")[0]}`);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time.split("-")[0]}`);
                const dateB = new Date(`${b.date} ${b.time.split("-")[0]}`);
                return dateA - dateB;
            });

        const container = document.querySelector(".full-eventlist-container");
        if (!container) return;

        const isOwner = sessionStorage.getItem("role") === "club_owner";

        const response = await fetch("/components/club_details.html");
        const text = await response.text();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = text;
        
        const cardTemplate = tempDiv.querySelector("#event-card-template");
        const modalTemplate = tempDiv.querySelector("#edit-modal-template");

        container.innerHTML = ""; 

        for (const event of filteredAndSorted) {
            const clone = cardTemplate.content.cloneNode(true);
            const cardDiv = clone.querySelector(".event-card");

            cardDiv.dataset.eventId = event.id;
            if (event.clubs?.color) cardDiv.style.borderLeft = `5px solid ${event.clubs.color}`;
            
            clone.querySelector(".event-title").textContent = event.title || "Event";
            clone.querySelector(".event-date").textContent = event.date;
            clone.querySelector(".event-time").textContent = event.time;
            clone.querySelector(".event-location").textContent = event.location;
            clone.querySelector(".event-description").textContent = event.description || "";

            const joinBtn = clone.querySelector(".join-event-button");
            const countData = await getEventJoinCount(event.id);
            joinBtn.textContent = `Join event (${countData.joined} joined)`;
            
            joinBtn.onclick = async () => {
                const result = await joinEvent(event.id);
                if (result) joinBtn.textContent = `Joined (${result.joined})`;
            };

            if (isOwner) {
                const editBtn = document.createElement("button");
                editBtn.className = "button edit-event-button blue-btn";
                editBtn.textContent = "Edit";
                editBtn.onclick = () => openEditModal(event, modalTemplate);
                clone.querySelector(".event-actions").appendChild(editBtn);
            }

            container.appendChild(clone);
        }

        // To-top knap funktionalitet
        const toTop = document.getElementById("goToTheTopEventList");
        if (toTop) {
            toTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    // Hjælpefunktion (openEditModal kan ligge herinde eller udenfor initDashboard)
    function openEditModal(event, template) {
        const existing = document.getElementById("edit-event-modal");
        if (existing) existing.remove();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "edit-event-modal";
        modalOverlay.className = "edit-modal-overlay";
        modalOverlay.appendChild(template.content.cloneNode(true));
        document.body.appendChild(modalOverlay);

        const [start, end] = (event.time || "").split("-");
        document.getElementById("edit-event-title").value = event.title || "";
        document.getElementById("edit-event-date").value = event.date || "";
        document.getElementById("edit-event-timeStart").value = start?.trim() || "";
        document.getElementById("edit-event-timeEnd").value = end?.trim() || "";
        document.getElementById("edit-event-location").value = event.location || "";
        document.getElementById("edit-event-description").value = event.description || "";
        document.getElementById("edit-event-practicalInfo").value = event.practicalInfo || "";

        modalOverlay.classList.add("open");

        document.getElementById("close-edit-event").onclick = () => modalOverlay.remove();
        document.getElementById("save-edit-event").onclick = async () => {
            const statusEl = document.getElementById("edit-event-status");
            statusEl.textContent = "Saving...";
            const payload = {
                title: document.getElementById("edit-event-title").value,
                date: document.getElementById("edit-event-date").value,
                timeStart: document.getElementById("edit-event-timeStart").value,
                timeEnd: document.getElementById("edit-event-timeEnd").value,
                location: document.getElementById("edit-event-location").value,
                description: document.getElementById("edit-event-description").value,
                practicalInfo: document.getElementById("edit-event-practicalInfo").value
            };
            try {
                const res = await fetch(`/events/${event.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Kunne ikke gemme");
                modalOverlay.remove();
                loadFullEventList(); 
            } catch (err) {
                statusEl.textContent = err.message;
            }
        };
    }

    // Funktion til at åbne selve siden/vinduet med listen
    async function openFullEventList() {
        const box = document.getElementById("eventlist-page-box");
        const response = await fetch("/components/event_list.html");
        const html = await response.text();
        box.innerHTML = html;
        box.classList.remove("hidden");
        await loadFullEventList();
    }

    // Event listener til sidebar-linket
    const eventListLink = document.getElementById("eventListLink");
    if (eventListLink) {
        eventListLink.addEventListener("click", openFullEventList);
    }

    // Lukning af eventlisten
    document.addEventListener("click", (e) => {
        if (e.target.closest("#close-event-list")) {
            const box = document.getElementById("eventlist-page-box");
            box.classList.add("hidden");
            box.innerHTML = "";
        }
    });

    // Club list link
    const clubListLink = document.getElementById("clubListLink");
    if (clubListLink) {
        clubListLink.addEventListener("click", () => {
            window.location.href = "/components/clubs.html";
        });
    }
} // Her slutter initDashboard

document.addEventListener("DOMContentLoaded", initDashboard);
