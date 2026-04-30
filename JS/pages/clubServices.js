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

/*Sends request to backend to get the joined count of the given event */
export async function getEventJoinCount(eventId) {
    const res = await fetch(`/events/${eventId}/joined`);
    return await res.json();
}

/*Sends request to backend to update the joined count of the given event */
export async function joinEvent(eventId) {
    const res = await fetch(`/events/${eventId}/joined`, {
        method: "POST"
    });
    return await res.json();
}
export async function createEvent(eventData) {
    const res = await fetch("/events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || data.details || "Event could not be saved");
    }

    return data;
}