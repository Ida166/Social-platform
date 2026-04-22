export async function getClubs() {
    const res = await fetch("/clubs");
    return await res.json();
}

export async function getEvents() {
    const res = await fetch("/events");
    return await res.json();
}