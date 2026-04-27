

/*Load in the clubs */
export async function getClubs(){
    const response = await fetch("data/club_card.json");
    const data = await response.json();
    return data;
}

export async function getEvent(){
    const response = await fetch("data/event_card.json");
    const data = await response.json();
    return data;
}