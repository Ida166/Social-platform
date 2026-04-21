/* Her gemmes brugerens rolle når de logger ind */

export function logout() {
    sessionStorage.removeItem("role"); //Fjerner rollen fra sessionStorage → brugeren “er logget ud”
}

export function getRole() {
    return sessionStorage.getItem("role") || "student"; // brug sessionStorage, ikke localStorage
}

export function setRole(role) {
    sessionStorage.setItem("role", role);
}