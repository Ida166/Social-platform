// Hent knapperne. Finder knapperne i HTML ud fra deres id
const btnStudent = document.getElementById("goDashboardStudent");
const btnClubOwner = document.getElementById("goDashboardClubOwner");
const btnAdmin = document.getElementById("goDashboardAdmin");

// Redirect til dashboard og gem rolle i sessionStorage
btnStudent.addEventListener("click", () => {
    sessionStorage.setItem("role", "student"); //Gemmer rollen "student" i browserens sessionStorage
    window.location.href = "dashboard.html";
});

btnClubOwner.addEventListener("click", () => {
    sessionStorage.setItem("role", "club_owner"); // match auth.js naming
    window.location.href = "dashboard.html";
});

btnAdmin.addEventListener("click", () => {
    sessionStorage.setItem("role", "admin");
    window.location.href = "dashboard.html";
});