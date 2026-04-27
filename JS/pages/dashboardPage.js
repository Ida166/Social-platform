// Hent rolle fra sessionStorage


// Import RBAC
import { hasPermission } from "../core/rbac.js"; //Henter funktionen hasPermission fra rbac.js
import { getRole } from "../core/auth.js";

/*Importer data fra database */
// import { supabase } from '../../Supabase.js'

/*Import the club list */
    import { getClubs } from "./clubServices.js";
    import { getEvents } from "./clubServices.js";

const LOCAL_EVENTS_KEY = "mapout_local_events";

function readLocalEvents() {
    const savedEvents = localStorage.getItem(LOCAL_EVENTS_KEY);

    if (!savedEvents) {
        return [];
    }

    try {
        return JSON.parse(savedEvents);
    } catch {
        return [];
    }
}

function createLocalEvent(eventData) {
    const existingEvents = readLocalEvents();
    const newEvent = {
        id: Date.now(),
        ...eventData
    };

    existingEvents.push(newEvent);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(existingEvents));

    return newEvent;
}

 
console.log("API JS loaded");
// Club owner buttton - Button to change between roles  
const btnClubOwner = document.getElementById("goDashboardClubOwner");  

// Redirect til dashboard og gem rolle i sessionStorage
btnClubOwner.addEventListener("click", () => {
    sessionStorage.setItem("role", "club_owner"); // match auth.js naming
    window.location.href = "index.html";

});

//Student button - Button to change between roles 
const btnStudent = document.getElementById("goDashboardStudent");

btnStudent.addEventListener("click", () => {
    sessionStorage.setItem("role", "student"); //Gemmer rollen "student" i browserens sessionStorage
    window.location.href = "index.html";
});


//Udkommenteret da vi lige nu ikke ændrer styling baseret på rollen ved at sætte body's class.
// Styling baseret på role
// function applyRoleClass() { //tilføjer body.classList.add("club_owner") eller body.classList.add("admin")
//     const role = getRole();
//     document.body.classList.remove("student", "club_owner", "admin"); //Sikrer at der ikke ligger gemte roller tilbage
//     if (role){
//         document.body.classList.add(role); //Tilføj den nuværende brugers rolle som en CSS-klasse på hele siden
//     } 
// }

function applyRoleClass() {
    const role = getRole();
    document.body.classList.remove("student", "club_owner", "admin");

    if (role) {
        document.body.classList.add(role);
    }
}

// Permission-baseret UI
function applyPermissions() {
    const elements = document.querySelectorAll("[data-permission]"); //finder alle HTML-elementer som har attributten data-permission. (en knap kan have det som attribut: <button data-permission="create_event">Create Event</button>)

    elements.forEach(element => {
        const permission = element.dataset.permission; //permission-værdien hentes(dataset læser data-atributter). I eksemplet med knappen læses der "create_event"

        if (!hasPermission(permission)) { //tager en permission-string det kunne være "create_event" og returnerer true eller false
            element.remove(); //Hvis brugeren ikke har permission → fjernes elementet modsat hvis de har forbliver den synlig
        }
    });
}

function initDashboard() {
    applyRoleClass();
    //applyRoleClass();       // Visuelle ændringer baseret på rolle. <body>'s class sættes til at være en af rollerne
    applyPermissions();     // Fjern knapper som brugeren ikke må se
   
    /*oppening and closing of the application for club or events box */
    const apply_create_club_or_event = document.getElementById("createClubOrEvent");
    const apply_create_club_or_event_box = document.getElementById("create-club-or-event_box");
    const createEventButton = document.getElementById("createEventButton");
    const eventPageBox = document.getElementById("event-page-box");
    const dashboardHome = document.getElementById("dashboard-home");

    if (apply_create_club_or_event) {
        apply_create_club_or_event.addEventListener("click", async () => {

            // Hent HTML fra separat fil
            const response = await fetch("components/application_club-event_form.html");
            const html = await response.text();

            // Indsæt HTML i container
            apply_create_club_or_event_box.innerHTML = html;

            // Vis popup
            apply_create_club_or_event_box.classList.remove("hidden");

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
            if (!hasPermission("create_event")) return;

            const response = await fetch("components/event_template.html");
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
                eventForm.addEventListener("submit", submitEvent => {
                    submitEvent.preventDefault();

                    const formData = new FormData(eventForm);
                    const payload = {
                        name: formData.get("name")?.toString().trim(),
                        date: formData.get("date")?.toString().trim(),
                        time: formData.get("time")?.toString().trim(),
                        clubId: formData.get("clubId") ? Number(formData.get("clubId")) : null,
                        location: formData.get("location")?.toString().trim(),
                        description: formData.get("description")?.toString().trim(),
                        practicalInformation: formData.get("practicalInformation")?.toString().trim(),
                        isPublished: true
                    };

                    createLocalEvent(payload);

                    if (statusMessage) {
                        statusMessage.textContent = "Event saved locally.";
                    }

                    eventForm.reset();
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

        container.innerHTML = clubs.map(clubs => `
            <div class="club-card" data-id="${clubs.id}">
                <h3>${clubs.name}</h3>
                <img src="${clubs.image}" alt="${clubs.name}" class="club-img"/>
            </div>
        `).join("");

        /*Opens club page when user clicks on a club */
        container.addEventListener("click", async (e) => {
            const card = e.target.closest(".club-card");
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

        const club = clubs.find(c => String(c.id) === String(clubId));

        const container = document.getElementById("club-list-box");

        if (!club) {
            container.innerHTML = "<p>Club not found</p>";
            return;
        }

        const clubEvents = events.filter(
            e =>  String(e.clubId) === String(clubId) && e.isPublished === true
        );

      container.innerHTML = `
        <div class="content-area">
            <h1>Events & clubs - Informationssite - ${club.name}</h1>

            <div class="white-box">
                <div class="hero">
                    <img src="${club.image}" alt="${club.name}">
                </div>

                <div class="description">
                    <p><strong>Join us!</strong><br>
                    ${club.description}</p>
                </div>

                <div class="info-section">
                    <div class="info-card">
                        <h3>Date:</h3>
                        <p>${clubEvents.length > 0 ? clubEvents[0].date : 'Information follows'}</p>
                        <h3>Time:</h3>
                        <p>${clubEvents.length > 0 ? clubEvents[0].time : 'Information follows'}</p>
                        <h3>Place:</h3>
                        <p>${clubEvents.length > 0 ? clubEvents[0].location : 'Information follows'}</p>
                    </div>

                    <div class="info-card">
                        <h3>Current members:</h3>
                        <p>${club.memberCount || 'TBA'}</p>
                        <h3>Contact info:</h3>
                        <p>${club.contactEmail || 'No email provided'}</p>
                        <p>${club.phone || ''}</p>
                    </div>

                    <button class="join-btn">Join us</button>
                </div>

                <button id="close-event-page" class="back-btn">Go Back</button>
            </div>
        </div>
    `;
       
        // close the club page
        const closeClubPage = container.querySelector("#close-event-page");

        if (closeClubPage) {
            closeClubPage.addEventListener("click", async () => {
                const response = await fetch("components/club_list.html");
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
        
        const clubListBox = document.getElementById("club-list-box");

            // Hent HTML fra seperat fil
            const response = await fetch("components/club_list.html");
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

