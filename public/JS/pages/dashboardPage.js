/*Import functions */
    import { getClubs } from "./clubServices.js";
    import { getEvents } from "./clubServices.js";
    import { createEvent } from "./clubServices.js";
    import { getEventJoinCount } from "./clubServices.js";
    import { joinEvent } from "./clubServices.js";

// Club owner buttton & Student button - Button to change between roles  
const btnClubOwner = document.getElementById("goDashboardClubOwner");  
const btnStudent = document.getElementById("goDashboardStudent");

function hideCalendarUI() {
    document.querySelector(".calendarcontainer")?.classList.add("hidden");
    document.querySelector(".filter")?.classList.add("hidden");
    document.getElementById("date-filter-row")?.classList.add("hidden");
}

function showCalendarUI() {
    document.querySelector(".calendarcontainer")?.classList.remove("hidden");
    document.querySelector(".filter")?.classList.remove("hidden");
    document.getElementById("date-filter-row")?.classList.remove("hidden");
}

function initDashboard() {

    // Show My Club section for club owners
    const isOwner = sessionStorage.getItem("role") === "club_owner";
    if (isOwner) {
        const myClubSection = document.getElementById("my-club-section");
        const myClubCardContainer = document.getElementById("my-club-card-container");

        if (myClubSection && myClubCardContainer) {
            getClubs().then(clubs => {
                const myClub = clubs.find(c => c.owner_id) || clubs[0];
                if (!myClub) return;

                sessionStorage.setItem("myClubId", String(myClub.id));
                myClubSection.classList.remove("hidden");

                myClubCardContainer.innerHTML = `
                    <div class="club-card" data-id="${myClub.id}"
                         style="${myClub.color ? `border-left: 5px solid ${myClub.color};` : ""}cursor:pointer">
                        <h3>${myClub.name}</h3>
                        <img src="${myClub.image}" alt="${myClub.name}" class="club-img"/>
                    </div>
                `;

                myClubCardContainer.querySelector(".club-card").addEventListener("click", () => {
                    window.location.href = `/club.html?id=${myClub.id}`;
                });
            });
        }
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
    const dashboardHome = document.getElementById("dashboard-home");

    if (apply_create_club_or_event) {
        apply_create_club_or_event.addEventListener("click", async () => {

            // Hent HTML fra separat fil
            const response = await fetch("/student/application_club-event_form.html");
            const html = await response.text();

            // Indsæt HTML i container
            apply_create_club_or_event_box.innerHTML = html;

            // Vis popup
            apply_create_club_or_event_box.classList.remove("hidden");
            const eventCheckbox = document.getElementById('checkBoxEvent');
            const filterBox = document.getElementById('event-filter-box');
            if (eventCheckbox && filterBox) {
                eventCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    filterBox.style.display = 'block'; // Vis boksen hvis der er flueben
                } else {
                    filterBox.style.display = 'none';  // Skjul den hvis fluebenet fjernes
                }
            });
        }
            // Luk-knap (skal bindes EFTER HTML er indsat)
            const closeBtn = document.getElementById("close-page");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    apply_create_club_or_event_box.classList.add("hidden");
                    apply_create_club_or_event_box.innerHTML = "";
                });
            }

            // Club creation submit
            const clubForm = document.getElementById("application_for_club_or_event_form");
            if (clubForm) {
                clubForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(clubForm);
                    const submitBtn = clubForm.querySelector('button[type="submit"]');

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

                    try {
                        if (submitBtn) submitBtn.disabled = true;
                        const res = await fetch("/clubs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.error || err.message || "Failed to create club.");
                        }

                        alert("Club created successfully!");
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
            eventPageBox.classList.remove("hidden");
            dashboardHome?.classList.add("hidden");
            hideCalendarUI();

            const closeEventBtn = eventPageBox.querySelector("#close-event-template");
            const eventForm = eventPageBox.querySelector("#event-template-form");
            const statusMessage = eventPageBox.querySelector("#event-form-status");

            if (closeEventBtn) {
                closeEventBtn.addEventListener("click", () => {
                    eventPageBox.classList.add("hidden");
                    eventPageBox.innerHTML = "";
                    dashboardHome?.classList.remove("hidden");
                    showCalendarUI();
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

    /*Club list now lives on /clubs.html - just navigate there */

    /* Full eventlist*/
        async function loadFullEventList() {    //kører når data er hentet
        const events = await getEvents();       //sikrer al data hentet før vi går videre 

            const now = new Date();             //laver ny dato

            const filteredAndSorted = events
            .filter(event => {                  //fjerner gamle datoer
                const eventDateTime = new Date(`${event.date} ${event.time.split("-")[0]}`); //splitter 10:00-12:00 til array
                return eventDateTime >= now;    //hvis det er efter i dag, så beholder vi det
             })
            .sort((a, b) => {                   //laver nye datoer igen
                const dateA = new Date(`${a.date} ${a.time.split("-")[0]}`);
                const dateB = new Date(`${b.date} ${b.time.split("-")[0]}`);
                return dateA - dateB;           //med sort, returnes a ved negative værdier først, og ved positive værdier returnes b først.
                                                // mindre tal - større tal = negativt
            });

        const container = document.querySelector(".full-eventlist-container"); // element hvor data skal ind

        if (!container) {
            console.error("full-eventlist-container not found in DOM"); //fejlkode i konsol, hvis container ikke findes i html
            return;
        }

        container.innerHTML = filteredAndSorted.map(event => `
            <div class="event-card" data-event-id="${event.id}">                       
                <h3>${event.title || "Event"}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Place:</strong> ${event.location}</p>
                <p>${event.description || ""}</p>

                <div class="event-actions">
                <button class="button join-event-button">Join event</button>
                </div>
                 </div>
        `).join("");
    
        

        //opretter event kort for hvert event
        //ved manglende title står der bare "Event"
        //med map laves nye html elementer, under event-card, som samles af joing.

        const joinButtons = container.querySelectorAll(".join-event-button");

            joinButtons.forEach(async (button) => {
                const card = button.closest(".event-card");
                const eventId = card.dataset.eventId;

                const countData = await getEventJoinCount(eventId);
                button.textContent = `Join event (${countData.joined} joined)`;

                button.addEventListener("click", async () => {
                    const result = await joinEvent(eventId);

                    if (!result) return;

                    button.textContent = `Joined (${result.joined})`;
                });
            });
    
    }

        async function openFullEventList() {
            const box = document.getElementById("eventlist-page-box");

            const response = await fetch("/components/event_list.html");
            const html = await response.text();

            box.innerHTML = html;
            box.classList.remove("hidden");

            await loadFullEventList();
        }

        const eventListLink = document.getElementById("eventListLink");

        if (eventListLink) {
            eventListLink.addEventListener("click", openFullEventList);
        }

        document.addEventListener("click", (e) => {
            if (e.target.closest("#close-event-list")) {
            const box = document.getElementById("eventlist-page-box");
            box.classList.add("hidden");
            box.innerHTML = ""; // ryd (valgfri men god)
            }
        });


    /*Club list link navigates to the full clubs page */
    const clubListLink = document.getElementById("clubListLink");
    if (clubListLink) {
        clubListLink.addEventListener("click", () => {
            window.location.href = "/clubs.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", initDashboard); //DOMContentLoaded betyder: “Kør først, når hele HTML’en er indlæst.”

