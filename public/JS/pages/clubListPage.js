import { getClubs } from "./clubServices.js";

let allClubs = [];


const role = sessionStorage.getItem("role");
const dashboardUrl = role === "club_owner" ? "/owner/index" : "/student/index";

document.getElementById("eventsAndClubsLink")?.addEventListener("click", () => {
    window.location.href = dashboardUrl;
});


document.getElementById("backBtn")?.addEventListener("click", () => {
    window.history.length > 1
        ? window.history.back()
        : window.location.href = dashboardUrl;
});


async function loadClubs() {
    try {
        allClubs = await getClubs();

        console.log("CLUBS:", allClubs); // debug

        renderClubs(allClubs);
    } catch (err) {
        console.error("Failed to load clubs:", err);
    }
}

/* RENDER CLUBS */
function renderClubs(clubs) {
    const container = document.getElementById("club-list");
    const myClubId = sessionStorage.getItem("myClubId");
    const template = document.getElementById("club-card-template");

    if (!container || !template) return;

    container.innerHTML = ""; // 

    if (!clubs || clubs.length === 0) {
        container.innerHTML = "<p>No clubs found</p>";
        return;
    }

    clubs.forEach(club => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".club-card");
        
        //Set ID and color 
        card.dataset.id = club.id;
        if (club.color) {
            card.style.borderLeft = `5px solid ${club.color}`;
        }

        //Fill out name 
        clone.querySelector(".club-name-placeholder").textContent = club.name;

        //"My Club" Badge
        const isMine = role === "club_owner" && myClubId && String(club.id) === myClubId;
        const badge = clone.querySelector(".my-club-badge");
        if (isMine) {
            badge.style.display = "inline"; 
        } else {
            badge.remove(); 
        }

        // 4. Håndter Billede
        const img = clone.querySelector(".club-img");
        if (club.image) {
            img.src = club.image;
            img.style.display = "block"; // Vis billedet
        } else {
            img.remove(); 
        }

        container.appendChild(clone);
    });
}

/* CLICK EVENT (ONLY ONCE!) */
document.getElementById("club-list")?.addEventListener("click", (e) => {
    const card = e.target.closest(".club-card");
    if (!card) return;

    window.location.href = `/components/club.html?id=${card.dataset.id}`;
});

/* FILTER */
function filterClubs(category) {
    if (category === "all") {
        renderClubs(allClubs);
    } else {
        const filtered = allClubs.filter(club =>
            (club.category || "").toLowerCase() === category.toLowerCase()
        );
        renderClubs(filtered);
    }

    updateActiveButton(category);
}


function updateActiveButton(category) {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");

        if (btn.dataset.category === category) {
            btn.classList.add("active");
        }
    });
}


window.filterClubs = filterClubs;

/* GO TO TOP */
const toTop = document.getElementById("goToTheTop");

if (toTop) {
    toTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

loadClubs();


window.addEventListener("pageshow", (e) => {
    if (e.persisted) loadClubs();
});

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        filterClubs(btn.dataset.category);
    });
});
