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

    container.innerHTML = clubs.map(club => {
        const isMine = role === "club_owner" && myClubId && String(club.id) === myClubId;
        return `
        <div class="club-card" data-id="${club.id}"
             style="${club.color ? `border-left: 5px solid ${club.color};` : ""}">
            <h3>${club.name}${isMine ? ' <span class="my-club-badge">My Club</span>' : ""}</h3>
            ${club.image ? `<img src="${club.image}" alt="${club.name}" class="club-img" />` : ""}
        </div>`;
    }).join("");

    container.addEventListener("click", (e) => {
        const card = e.target.closest(".club-card");
        if (!card) return;
        window.location.href = `/club.html?id=${card.dataset.id}`;
    });
}

loadClubs();

window.addEventListener("pageshow", (e) => {
    if (e.persisted) loadClubs();
});
