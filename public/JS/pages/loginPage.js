// Hent knapperne. Finder knapperne i HTML ud fra deres id
const btnStudent = document.getElementById("goDashboardStudent");
const btnClubOwner = document.getElementById("goDashboardClubOwner");


async function login(role) {
    //Sends log in request to backend
    const res = await fetch("/login-demo", { 
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
    });

    if (res.ok) {
        window.location.href = role === "student"
            ? "/student/index"
            : "/owner/index";
    } else {
        const errorText = await res.text();
        console.error("Login failed:", errorText);
    }
}

btnStudent.addEventListener("click", () => login("student"));
btnClubOwner.addEventListener("click", () => login("club_owner"));