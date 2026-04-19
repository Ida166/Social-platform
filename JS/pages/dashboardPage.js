// Hent rolle fra sessionStorage


// Import RBAC
import { hasPermission } from "../core/rbac.js"; //Henter funktionen hasPermission fra rbac.js
import { getRole } from "../core/auth.js";

/*Import the club list */
    import { getClubs } from "./clubServices.js";
    import { getEvent } from "./clubServices.js";

 
// Styling baseret på role
function applyRoleClass() { //tilføjer body.classList.add("club_owner") eller body.classList.add("admin")
    const role = getRole();
    document.body.classList.remove("user", "club_owner", "admin"); //Sikrer at der ikke ligger gemte roller tilbage
    if (role){
        document.body.classList.add(role); //Tilføj den nuværende brugers rolle som en CSS-klasse på hele siden
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
    applyRoleClass();       // Visuelle ændringer baseret på rolle. <body>'s class sættes til at være en af rollerne
    applyPermissions();     // Fjern knapper som brugeren ikke må se

    const role = getRole(); // læser fra sessionStorage
    const roleText = document.getElementById("roleText");
    roleText.textContent = role
    ? `You are logged in as ${role}`
    : `No role selected`

    /* Redirect til index.html(login page) og logger brugeren ud */
    const logOut = document.getElementById("logOut"); //hent tilbagekanppen
        logOut.addEventListener("click", () => { //lyt efter om der bliver klikket
            window.location.href = "index.html";
        });

   
    /*oppening and closing of the application for club or events box */
    const apply_create_club_or_event = document.getElementById("createClubOrEvent");
    const apply_create_club_or_event_box = document.getElementById("create-club-or-event_box");

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


    /*Import the club list */
    let clubsLoaded = false; //makes sure we do not load double

    window.loadClubs = async function loadClubs(){
        if(clubsLoaded) return;

        const clubs = await getClubs();
        const container = document.getElementById("club-list");

        container.innerHTML = clubs.map(club => `
            <div class="club-card" data-id="${club.clubid}">
                <h3>${club.name}</h3>
                <img src="${club.image}" alt="${club.name}" class="club-img"/>
            </div>
        `).join("");

        /*Opens club page when user clicks on a club */
        container.addEventListener("click", async (e) => {
            const card = e.target.closest(".club-card");
            if (!card) return;

            const clubId = Number(card.dataset.id);

            openClubPage(clubId);
        });
    }

    /*Import the event data*/
    async function openClubPage(clubId){
        const clubs = await getClubs();
        const events = await getEvent();

        const club = clubs.find(c => c.clubid === clubId);

        const container = document.getElementById("club-list-box");

        if (!club) {
            container.innerHTML = "<p>Club not found</p>";
            return;
        }

        const clubEvents = events.filter(
            e => e.clubId === clubId && e.isPublished
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
                            <p>${clubEvents.length > 0 ? clubEvents[0].date : 'TBA'}</p>
                            <h3>Time:</h3>
                            <p>${clubEvents.length > 0 ? clubEvents[0].time : 'TBA'}</p>
                        </div>

                        <div class="info-card">
                            <h3>Current members:</h3>
                            <p>25</p>
                            <h3>Contact info:</h3>
                            <p>Kontakt@aau.dk</p>
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
            const closeClubList = clubListBox.querySelector("#close-club-list");
            if(closeClubList){
                closeClubList.addEventListener("click", () => {
                    clubListBox.classList.add("hidden");
                    clubListBox.innerHTML = "";
                    clubsLoaded = false; //only loads clubs when modal is opened.
                });
            }
        });

    }

document.addEventListener("DOMContentLoaded", initDashboard); //DOMContentLoaded betyder: “Kør først, når hele HTML’en er indlæst.”
