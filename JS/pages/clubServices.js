export async function getClubs() {
    const res = await fetch("/clubs");
    return await res.json();
}

export async function getEvents() {
    const res = await fetch("/events");
    return await res.json();
}

/*Sends request to backend to get the joined count of the given club */
export async function getJoinCount(clubId) {
    const res = await fetch(`/clubs/${clubId}`);
    return await res.json();
        
}

/*Sends request to backend to update the joined count of the given club */
export async function joinClub(clubId) {
    const res = await fetch(`/clubs/${clubId}/joined`, {
        method: "POST"
    });
    return await res.json();
};
