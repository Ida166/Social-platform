/*Import functions */
    import { getClubs } from "./clubServices.js";
    import { getEvents } from "./clubServices.js";
    import { createEvent } from "./clubServices.js";
    import { getJoinCount } from "./clubServices.js";
    import { joinClub } from "./clubServices.js";

// Club owner buttton & Student button - Button to change between roles  
const btnClubOwner = document.getElementById("goDashboardClubOwner");  
const btnStudent = document.getElementById("goDashboardStudent");

function initDashboard() {

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
        });
    }

    if (createEventButton && eventPageBox) {
        createEventButton.addEventListener("click", async () => {

            const response = await fetch("/owner/event_template");
            const html = await response.text();

            eventPageBox.innerHTML = html;
            eventPageBox.classList.remove("hidden");
            dashboardHome?.classList.add("hidden");

            const closeEventBtn = eventPageBox.querySelector("#close-event-template");
            const eventForm = eventPageBox.querySelector("#event-template-form");
            const statusMessage = eventPageBox.querySelector("#event-form-status");

            if (closeEventBtn) {
                closeEventBtn.addEventListener("click", () => {
                    eventPageBox.classList.add("hidden");
                    eventPageBox.innerHTML = "";
                    dashboardHome?.classList.remove("hidden");
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

    /*Import the club list */
    let clubsLoaded = false; //makes sure we do not load double

    /*Load clubs */
    window.loadClubs = async function loadClubs(){
        if(clubsLoaded) return;

        const clubs = await getClubs();

        const container = document.getElementById("club-list");
        if (!container) {
            console.error("club-list not found in DOM");
            return;
        }

        //Converts the JS data from the database into HTML cards
        container.innerHTML = clubs.map(clubs => `
            <div class="club-card" data-id="${clubs.id}">
                <h3>${clubs.name}</h3>
                <img src="${clubs.image}" alt="${clubs.name}" class="club-img"/>
            </div>
        `).join("");

        /*Opens club page when user clicks on a club */
        container.addEventListener("click", async (e) => {
            const card = e.target.closest(".club-card"); //closest -> find the nearest club-card when cliked
            if (!card) return;

            const clubId = card.dataset.id; 

            if (!clubId) {
                console.error("Missing clubId");
                return;
            }

            openClubPage(clubId);     
        }); 
    }

    /*Import the event data*/
    async function openClubPage(clubId){
        const clubs = await getClubs();
        const events = await getEvents();
        const members = await getJoinCount(clubId)

        const club = clubs.find(c => String(c.id) === String(clubId));

        const container = document.getElementById("club-list-box");

        if (!club) {
            container.innerHTML = "<p>Club not found</p>";
            return;
        }

        const clubEvents = events.filter(
            e =>  String(e.clubId) === String(clubId) && e.isPublished === true
        );

        //event HTML - 161
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


        //Henter club details filen
        const response = await fetch("/components/club_details.html");
        const template = await response.text();
        container.innerHTML = eval('`' + template + '`');

        //function to import club member count and join a club
        const count = await getJoinCount(clubId);

        const joinBtn = document.querySelector(".join-btn");
        joinBtn.textContent = `Join us!`;

        joinBtn.addEventListener("click", async () => {
            const result = await joinClub(clubId);

            //if alredy joined or failed
            if(!result){
                return; 
            }
            joinBtn.textContent = `You joined the club!`;
        });
       

        // close the club page
        const closeClubPage = container.querySelector("#close-event-page");

        if (closeClubPage) {
            closeClubPage.addEventListener("click", async () => {
                const response = await fetch("/components/club_list.html");
                const html = await response.text();

                container.innerHTML = html;
                await loadClubs();
            });
        }
    }
}

    /*opening and closing of the club list */
    const clubListLink = document.getElementById("clubListLink");
    
    if(clubListLink){
        clubListLink.addEventListener("click", async () => {
        
        const clubListBox = document.getElementById("club-list-box"); // The box where the clubs will be shown

            // Hent HTML fra seperat fil
            const response = await fetch("/components/club_list.html");
            const html = await response.text();

            //Indsæt HTML i container
            clubListBox.innerHTML = html;
            
            //Function from clubServucSes.js that loads the clubs in 
            await loadClubs();

            //Vis box
            clubListBox.classList.remove("hidden");

            /*Close box when span is clicked */
            document.addEventListener("click", (e) => {
                if (e.target.closest("#close-club-list")) { 
                    const clubListBox = document.getElementById("club-list-box");

                    const clubContent = document.getElementById("club-content");

                    if (clubListBox) { //Hides the box 
                        clubListBox.classList.add("hidden");
                    }

                    if (clubContent) { //removes all html inside the container 
                        clubContent.innerHTML = "";
                    }
                }
            });
        });

    }

document.addEventListener("DOMContentLoaded", initDashboard); //DOMContentLoaded betyder: “Kør først, når hele HTML’en er indlæst.”

