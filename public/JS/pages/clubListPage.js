import { getClubs } from "./clubServices.js";

const role = sessionStorage.getItem("role");
const dashboardUrl = role === "club_owner" ? "/owner/index" : "/student/index";

document.getElementById("dashboardLink").addEventListener("click", () => {
    window.location.href = dashboardUrl;
});

document.getElementById("backBtn").addEventListener("click", () => {
    window.history.length > 1 ? window.history.back() : window.location.href = dashboardUrl;
});

async function loadClubs() {
    const clubs = await getClubs();
    const container = document.getElementById("club-list");

    const myClubId = sessionStorage.getItem("myClubId");
    const visibleClubs = (role === "club_owner" && myClubId)
        ? clubs.filter(c => String(c.id) !== myClubId)
        : clubs;

    container.innerHTML = visibleClubs.map(club => `
        <div class="club-card" data-id="${club.id}"
             style="${club.color ? `border-left: 5px solid ${club.color};` : ""}">
            <h3>${club.name}</h3>
            <img src="${club.image}" alt="${club.name}" class="club-img" />
        </div>
    `).join("");

    container.addEventListener("click", (e) => {
        const card = e.target.closest(".club-card");
        if (!card) return;
        window.location.href = `/club.html?id=${card.dataset.id}`;
    });
}

loadClubs();
