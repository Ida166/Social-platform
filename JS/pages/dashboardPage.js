import { hasPermission } from "../core/rbac.js";
import { getRole, setRole } from "../core/auth.js";
import { getClubs, getEvent } from "./clubServices.js";
import { supabase } from "../../Supabase.js";

function applyRoleClass() {
    const role = getRole();
    document.body.classList.remove("student", "club_owner", "admin");

    if (role) {
        document.body.classList.add(role);
    }
}

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
    if (!getRole()) {
        setRole("student");
    }

    applyRoleClass();
    applyPermissions();

    const role = getRole();
    const roleToggleButton = document.getElementById("roleToggleButton");
    const createClubButton = document.getElementById("createClubOrEvent");
    const createEventButton = document.getElementById("createEventButton");
    const applyToCreateEventButton = document.getElementById("applyToCreateEventButton");
    const clubListLink = document.getElementById("clubListLink");

    const dashboardHome = document.getElementById("dashboard-home");
    const dashboardWorkspace = document.getElementById("dashboard-workspace");
    const clubListBox = document.getElementById("club-list-box");
    const eventPageBox = document.getElementById("event-page-box");
    const createClubBox = document.getElementById("create-club-or-event_box");

    let clubsLoaded = false;

    if (roleToggleButton) {
        roleToggleButton.textContent = "Log Out";
    }

    function closePanel(panel, { clear = true } = {}) {
        if (!panel) return;

        panel.classList.add("hidden");

        if (clear) {
            panel.innerHTML = "";
        }
    }

    function closeOtherPanels(activePanel) {
        [clubListBox, eventPageBox, createClubBox].forEach(panel => {
            if (panel !== activePanel) {
                closePanel(panel);
            }
        });
    }

    function updateDashboardVisibility() {
        if (!dashboardHome || !dashboardWorkspace) return;

        const hasOpenPanels = [clubListBox, eventPageBox, createClubBox]
            .some(panel => panel && !panel.classList.contains("hidden"));

        dashboardHome.classList.toggle("hidden", hasOpenPanels);
        dashboardWorkspace.classList.toggle("hidden", !hasOpenPanels);
    }

    async function loadComponent(path, container) {
        closeOtherPanels(container);

        const response = await fetch(path);
        const html = await response.text();

        container.innerHTML = html;
        container.classList.remove("hidden");
        updateDashboardVisibility();
    }

    function setFormStatus(statusElement, message, isError = false) {
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.style.color = isError ? "#b42318" : "#027a48";
    }

    async function handleCreateClubApplicationSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const statusElement = form.querySelector("#application-form-status");
        const submitButton = form.querySelector('button[type="submit"]');

        const formData = new FormData(form);
        const createClub = formData.get("create_club") === "on";
        const createEvent = formData.get("create_event") === "on";

        if (!createClub && !createEvent) {
            setFormStatus(statusElement, "Select at least one option: Create Club or Create Event.", true);
            return;
        }

        const payload = {
            full_name: formData.get("full_name")?.toString().trim(),
            email: formData.get("email")?.toString().trim(),
            education: formData.get("education")?.toString().trim(),
            phone_number: formData.get("phone_number")?.toString().trim(),
            create_club: createClub,
            create_event: createEvent,
            project_name: formData.get("project_name")?.toString().trim(),
            category: formData.get("category")?.toString().trim(),
            idea_description: formData.get("idea_description")?.toString().trim(),
            motivation: formData.get("motivation")?.toString().trim()
        };

        try {
            if (submitButton) {
                submitButton.disabled = true;
            }

            setFormStatus(statusElement, "Sending application...");

            const { error } = await supabase
                .from("club_event_applications")
                .insert([payload]);

            if (error) {
                throw error;
            }

            form.reset();
            setFormStatus(statusElement, "Application sent successfully.");
        } catch (error) {
            console.error("Failed to save application:", error);
            setFormStatus(statusElement, `Could not save application: ${error.message}`, true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    async function openCreateClubApplication() {
        if (!createClubBox) return;

        await loadComponent("components/application_club-event_form.html", createClubBox);

        const applicationForm = createClubBox.querySelector("#application_for_club_or_event_form");
        if (applicationForm) {
            applicationForm.addEventListener("submit", handleCreateClubApplicationSubmit);
        }

        const closeBtn = createClubBox.querySelector("#close-page");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                closePanel(createClubBox);
                updateDashboardVisibility();
            });
        }
    }

    async function openEventTemplate() {
        if (!eventPageBox) return;

        await loadComponent("components/event_template.html", eventPageBox);

        const closeEventBtn = eventPageBox.querySelector("#close-event-template");
        if (closeEventBtn) {
            closeEventBtn.addEventListener("click", () => {
                closePanel(eventPageBox);
                updateDashboardVisibility();
            });
        }
    }

    async function loadClubs() {
        if (clubsLoaded) return;

        const clubs = await getClubs();
        const container = document.getElementById("club-list");

        if (!container) return;

        container.innerHTML = clubs.map(club => `
            <div class="club-card" data-id="${club.clubid}">
                <h3>${club.name}</h3>
                <img src="${club.image}" alt="${club.name}" class="club-img"/>
            </div>
        `).join("");

        clubsLoaded = true;

        container.addEventListener("click", async event => {
            const card = event.target.closest(".club-card");
            if (!card) return;

            const clubId = Number(card.dataset.id);
            await openClubPage(clubId);
        });
    }

    async function openClubPage(clubId) {
        const clubs = await getClubs();
        const events = await getEvent();

        const club = clubs.find(currentClub => currentClub.clubid === clubId);

        if (!club || !clubListBox) {
            if (clubListBox) {
                clubListBox.innerHTML = "<p>Club not found</p>";
            }
            return;
        }

        const clubEvents = events.filter(
            currentEvent => currentEvent.clubId === clubId && currentEvent.isPublished
        );

        clubListBox.innerHTML = `
            <div class="content-area">
                <h1>Events & clubs - Informationssite - ${club.name}</h1>

                <div class="white-box">
                    <div class="hero">
                        <img src="${club.image}" alt="${club.name}">
                    </div>

                    <div class="description">
                        <p><strong>Join us!</strong><br>${club.description}</p>
                    </div>

                    <div class="info-section">
                        <div class="info-card">
                            <h3>Date:</h3>
                            <p>${clubEvents.length > 0 ? clubEvents[0].date : "Information follows"}</p>
                            <h3>Time:</h3>
                            <p>${clubEvents.length > 0 ? clubEvents[0].time : "Information follows"}</p>
                            <h3>Place:</h3>
                            <p>${clubEvents.length > 0 ? clubEvents[0].location : "Information follows"}</p>
                        </div>

                        <div class="info-card">
                            <h3>Current members:</h3>
                            <p>${club.memberCount || "TBA"}</p>
                            <h3>Contact info:</h3>
                            <p>${club.contactEmail || "No email provided"}</p>
                            <p>${club.phone || ""}</p>
                        </div>

                        <button class="join-btn">Join us</button>
                    </div>

                    <button id="close-event-page" class="back-btn">Go Back</button>
                </div>
            </div>
        `;

        const closeClubPage = clubListBox.querySelector("#close-event-page");
        if (closeClubPage) {
            closeClubPage.addEventListener("click", async () => {
                await openClubList();
            });
        }
    }

    async function openClubList() {
        if (!clubListBox) return;

        await loadComponent("components/club_list.html", clubListBox);
        clubsLoaded = false;
        await loadClubs();

        const closeClubList = clubListBox.querySelector("#close-club-list");
        if (closeClubList) {
            closeClubList.addEventListener("click", () => {
                closePanel(clubListBox);
                clubsLoaded = false;
                updateDashboardVisibility();
            });
        }
    }

    if (roleToggleButton) {
        roleToggleButton.addEventListener("click", () => {
            const nextRole = getRole() === "club_owner" ? "student" : "club_owner";
            setRole(nextRole);
            window.location.reload();
        });
    }

    if (createClubButton) {
        createClubButton.addEventListener("click", openCreateClubApplication);
    }

    if (createEventButton) {
        createEventButton.addEventListener("click", openEventTemplate);
    }

    if (applyToCreateEventButton) {
        applyToCreateEventButton.addEventListener("click", openEventTemplate);
    }

    if (clubListLink) {
        clubListLink.addEventListener("click", openClubList);
    }

    updateDashboardVisibility();
}

document.addEventListener("DOMContentLoaded", initDashboard);
