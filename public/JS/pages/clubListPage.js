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

    if (!container) return;

    if (!clubs || clubs.length === 0) {
        container.innerHTML = "<p>No clubs found</p>";
        return;
    }

    container.innerHTML = clubs.map(club => {
        const isMine =
            role === "club_owner" &&
            myClubId &&
            String(club.id) === myClubId;

        return `
        <div class="club-card" data-id="${club.id}"
             style="${club.color ? `border-left: 5px solid ${club.color};` : ""}">
            <h3>
                ${club.name}
                ${isMine ? '<span class="my-club-badge">My Club</span>' : ""}
            </h3>
            ${club.image ? `<img src="${club.image}" class="club-img" />` : ""}
        </div>`;
    }).join("");
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
