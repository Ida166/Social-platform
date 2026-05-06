/*Returns the current user's role and myClubId from the server session.
  Use this instead of sessionStorage.getItem("role") — the server is authoritative. */
export async function getMe() {
    const res = await fetch("/me", { credentials: "include" });
    return await res.json();
}

export async function getClubs() {
    const res = await fetch("/clubs", { cache: "no-store" });
    return await res.json();
}

export async function getEvents() {
    const res = await fetch("/events", { cache: "no-store" });
    return await res.json();
}

/*Sends request to backend to get the joined count of the given event */
export async function getEventJoinCount(eventId) {
    const res = await fetch(`/events/${eventId}/join-count`);
    return await res.json();
}

/*Sends request to backend to update the joined count of the given event */
export async function joinEvent(eventId) {
    const res = await fetch(`/events/${eventId}/joined`, {
        method: "POST",
        credentials: "include"
    });

    const data = await res.json();

    if(!res.ok){
        return { error: data.message };
    }

    return data;
}

/*Sends request to backend to get the joined count of the given club */
export async function getJoinCount(clubId) {
    const res = await fetch(`/clubs/${clubId}/join-count`);
    return res.json();  
}

/*Sends request to backend to update the joined count of the given club */
export async function joinClub(clubId) {
    const res = await fetch(`/clubs/${clubId}/joined`, {
        method: "POST",
        credentials: "include"
    });

    const data = await res.json();
    if(!res.ok){
        alert(data.message);
        return null;
    }

    return data;
};

/*Sends request to backend to remove the current user from an event */
export async function unjoinEvent(eventId) {
    const res = await fetch(`/events/${eventId}/joined`, {
        method: "DELETE",
        credentials: "include"
    });
    const data = await res.json();
    if (!res.ok) {
        return { error: data.message };
    }
    return data;
}

/*Sends request to backend to remove the current user from a club */
export async function unjoinClub(clubId) {
    const res = await fetch(`/clubs/${clubId}/joined`, {
        method: "DELETE",
        credentials: "include"
    });
    const data = await res.json();
    if (!res.ok) {
        return { error: data.message };
    }
    return data;
}

/*Checks whether the current user has already joined an event */
export async function hasJoinedEvent(eventId) {
    const res = await fetch(`/events/${eventId}/joined/me`, { credentials: "include" });
    const data = await res.json();
    return data.joined;
}

/*Checks whether the current user has already joined a club */
export async function hasJoinedClub(clubId) {
    const res = await fetch(`/clubs/${clubId}/joined/me`, { credentials: "include" });
    const data = await res.json();
    return data.joined;
}

/*Sends request to backend to create a new event */
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