// Hent rolle fra sessionStorage

// Import RBAC
import { hasPermission } from "../core/rbac.js";
import { getRole } from "../core/auth.js";

// import { supabase } from '../../Supabase.js'

import { getClubs } from "./clubServices.js";
import { getEvents } from "./clubServices.js";
import { joinClub, getJoinCount } from "./clubServices.js";

console.log("API JS loaded");

const btnClubOwner = document.getElementById("goDashboardClubOwner");
btnClubOwner.addEventListener("click", () => {
    sessionStorage.setItem("role", "club_owner");
    window.location.href = "index.html";
});

const btnStudent = document.getElementById("goDashboardStudent");
btnStudent.addEventListener("click", () => {
    sessionStorage.setItem("role", "student");
    window.location.href = "index.html";
});

function applyPermissions() {
    const elements = document.querySelectorAll("[data-permission]");
    elements.forEach(element => {
        const permission = element.dataset.permission;
        if (!hasPermission(permission)) {
            element.remove();
        }
    });
}

function initDashboard() {
    applyPermissions();

    const apply_create_club_or_event = document.getElementById("createClubOrEvent");
    const apply_create_club_or_event_box = document.getElementById("create-club-or-event_box");

    if (apply_create_club_or_event) {
        apply_create_club_or_event.addEventListener("click", async () => {
            const response = await fetch("components/application_club-event_form.html");
            const html = await response.text();
            apply_create_club_or_event_box.innerHTML = html;
            apply_create_club_or_event_box.classList.remove("hidden");

            const closeBtn = document.getElementById("close-page");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    apply_create_club_or_event_box.classList.add("hidden");
                    apply_create_club_or_event_box.innerHTML = "";
                });
            }
        });
    }

    let clubsLoaded = false;

    window.loadClubs = async function loadClubs() {
        if (clubsLoaded) return;

        const clubs = await getClubs();

        const container = document.getElementById("club-list");
        if (!container) {
            console.error("club-list not found in DOM");
            return;
        }

        container.innerHTML = clubs.map(club => `
            <div class="club-card" data-id="${club.id}">
                <h3>${club.name}</h3>
                <img src="${club.image}" alt="${club.name}" class="club-img"/>
            </div>
        `).join("");

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

    async function openClubPage(clubId) {
        const clubs = await getClubs();
        const events = await getEvents();

        const club = clubs.find(c => String(c.id) === String(clubId));
        const container = document.getElementById("club-list-box");

        if (!club) {
            container.innerHTML = "<p>Club not found</p>";
            return;
        }

        const clubEvents = events.filter(
            e => String(e.clubId) === String(clubId) && e.isPublished === true
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
                        <button class="join-btn" id="join-btn">Join us (${getJoinCount(clubId)} joined)</button>
                    </div>
                    <button id="close-event-page" class="back-btn">Go Back</button>
                </div>
            </div>
        `;

        const joinBtn = container.querySelector("#join-btn");
        if (joinBtn) {
            joinBtn.addEventListener("click", () => {
                const newCount = joinClub(clubId);
                joinBtn.textContent = `Join us (${newCount} joined)`;
            });
        }

        const closeClubPage = container.querySelector("#close-event-page");
        if (closeClubPage) {
            closeClubPage.addEventListener("click", async () => {
                const response = await fetch("components/club_list.html");
                const html = await response.text();
                container.innerHTML = html;
                clubsLoaded = false;
                await loadClubs();
            });
        }
    }

    const clubListLink = document.getElementById("clubListLink");

    if (clubListLink) {
        clubListLink.addEventListener("click", async () => {
            const clubListBox = document.getElementById("club-list-box");

            const response = await fetch("components/club_list.html");
            const html = await response.text();

            clubListBox.innerHTML = html;
            await loadClubs();
            clubListBox.classList.remove("hidden");

            document.addEventListener("click", (e) => {
                if (e.target.closest("#close-club-list")) {
                    const clubListBox = document.getElementById("club-list-box");
                    const clubContent = document.getElementById("club-content");

                    if (clubListBox) {
                        clubListBox.classList.add("hidden");
                    }
                    if (clubContent) {
                        clubContent.innerHTML = "";
                    }
                }
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", initDashboard);