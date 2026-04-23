export async function getClubs() {
    return [
        { id: 1, name: "Board Games Club", image: "assets/images/AAUBoardGames.png", description: "Vi spiller brætspil!" },
        { id: 2, name: "Bouldering Club", image: "assets/images/AUUBoulders.png", description: "Vi klatrer!" }
    ];
}

export async function getEvents() {
    return [];
}

export function joinClub(clubId) {
    const key = `joins_${clubId}`;
    const current = parseInt(localStorage.getItem(key) || "0");
    const newCount = current + 1;
    localStorage.setItem(key, newCount);
    return newCount;
}

export function getJoinCount(clubId) {
    return parseInt(localStorage.getItem(`joins_${clubId}`) || "0");
}