import { getEvents, getEventJoinCount, joinEvent, unjoinEvent, hasJoinedEvent, getUserRole } from "../pages/clubServices.js";

let events = [];

/*Function that loads the events into the array events  */
async function loadEventsFromDB() {
    try {
        events = await getEvents();
        renderWeek(); //this rerenders calender after loading
    } catch (err){
        console.error("Failed to load events:", err);
    }
}

/*Function that takes the time fx 16:00-18:00 and split it into start and end */
function splitTimeRange(timeRange = "") {
    const [start = "00:00", end = "00:00"] = timeRange.split("-");
    return { start, end };
}

/* Default timeslots */
let calendarStartHour = 8;
let calendarEndHour = 18;

function updateCalendarTimeRange(monday){

    let earliestHour = 8;
    let latestHour = 18;

    events.forEach(event=> {
        const eventDate = new Date(event.date)
        
        const diffFromMonday = Math.floor((eventDate - monday)/ (1000*60*60*24));

        if (diffFromMonday >=0 && diffFromMonday<7){

            const { start, end } = splitTimeRange(event.time);

            const [startHour] = start.split(":").map(Number);
            let [endHour] = end.split(":").map(Number); 
            if (end === "00:00") { //Changes end to 24:00 if it ends at 00:00 because gets translated to 0 so the beginning of the day
                endHour = 24;
            }

            if (startHour < earliestHour){
                earliestHour = startHour;
            }
            
            if (endHour > latestHour){
                latestHour = endHour;
            }
        }
    });
    calendarStartHour = Math.max(0, earliestHour - 1)
    calendarEndHour = Math.min(24, latestHour + 1)
    }

/* Tider i kalender */
 
function renderTimeslots(){
    const timeslots = document.querySelector(".timeslots");
    timeslots.innerHTML = "";
    for (let hour = calendarStartHour; hour<=calendarEndHour; hour++){
        const timeList = document.createElement("li");
        timeList.textContent = hour + ":00";
        timeslots.appendChild(timeList);
    }

    const rowCount = (calendarEndHour - calendarStartHour) * 4;

    document.querySelector(".eventcontainer").style.gridTemplateRows = "repeat("+ rowCount +", 10px)";
    
}

/* Event placering i kalenderen*/

    function timeToRow(timeString) {
        const [hour, minute] = timeString.split(":").map(Number);
        return (hour - calendarStartHour) * 4 + Math.floor(minute / 15) + 1;
    }

    function getRandomColor(seed){
        let hash = 0;
        const str = String(seed);

        for ( let i = 0; i < str.length; i++){
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = Math.abs(hash) % 360;
        const saturation = 60;
        const lightness = 55;

         return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function renderEvents(monday){

        const container = document.querySelector(".eventcontainer");
        container.innerHTML = "";

        events.forEach(event => {
            const eventDate = new Date(event.date + "T00:00:00");

            const diffFromMonday = Math.floor((eventDate - monday)/(1000*60*60*24));

            if (diffFromMonday>= 0 && diffFromMonday < 7){
                const element = document.createElement("div");
                element.classList.add("slot");
                element.style.background = event.clubs?.color || getRandomColor(event.id);
                element.textContent = event.title;

                element.addEventListener("click", () => {
                    openEventPage(event);
                });

                element.style.gridColumn = diffFromMonday + 1;
                let {start, end } = splitTimeRange(event.time);
                if (end === "00:00") {
                    end = "24:00";
                }
                element.style.gridRow = timeToRow(start) + " / " + timeToRow(end);
                container.appendChild(element);
            }
        });
}

/* Dags dato over kalenderen*/ 

    function updateDate(){

        const date = new Date();

        const today = {
            year: date.getFullYear(),
            month: date.getMonth()+1,
            day: date.getDate()
        }

    document.getElementById("currentDate").textContent = today.day + "." + today.month + "." + today.year;
    }

    setInterval(updateDate, 100);

/* Dynamiske datoer i selve kalenderen */

    let weekOffset = 0;

    function renderWeek(){
        const today = new Date();

        let currentDay = today.getDay();
            if (currentDay === 0){ 
                currentDay = 7
            }

        const monday = new Date(today);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(today.getDate() - (currentDay - 1) + weekOffset * 7);

        for(let i=0; i < 7; i++){
            const dayInWeek = new Date (monday);
            dayInWeek.setDate(monday.getDate() + i);

            document.getElementById("day" + (i+1)).textContent = dayInWeek.getDate() + "/" + (dayInWeek.getMonth() + 1);
        }

    updateCalendarTimeRange(monday);
    renderTimeslots();
    renderEvents(monday);

    }

function nextWeek() {
    weekOffset++;
    renderWeek();
}

function previousWeek() {
    weekOffset--;
    renderWeek();
}

loadEventsFromDB();

document.getElementById("previousWeek").addEventListener("click", previousWeek);
document.getElementById("nextWeek").addEventListener("click", nextWeek);

async function openEventPage(event) {

    const response = await fetch("/components/event_details.html");
    const html = await response.text();

    const container = document.getElementById("event-details-popup");
    container.innerHTML = `<div id="event-modal">${html}</div>`;

    container.style.display = "flex";
    
    const modal = container.querySelector("#event-modal");

    container.querySelector("#event-title").textContent = event.title;
    container.querySelector("#event-date-time").textContent = `${event.date} at ${event.time}`;
    container.querySelector("#event-location").textContent = event.location;
    container.querySelector("#event-description").textContent = event.description;

    const practicalList = container.querySelector("#event-practical");
    practicalList.innerHTML = "";

    if (event.practicalInfo) {
        const li = document.createElement("li");
        li.textContent = event.practicalInfo;
        practicalList.appendChild(li);
    }

    const joinButton = container.querySelector("#join-event-btn");
    const role = await getUserRole();

    // Hent join count og om brugeren allerede har tilmeldt sig
    const [countData, alreadyJoined] = await Promise.all([
        getEventJoinCount(event.id),
        hasJoinedEvent(event.id)
    ]);

    if (role === "student") {
        // Student: vis Fortryd-knap med fuldt join/unjoin flow
        joinButton.classList.remove("hidden");

        function renderJoinButton(joined, hasJoined) {
            if (hasJoined) {
                joinButton.textContent = `You are joined (${joined}) Undo`;
                joinButton.classList.add("joined");
            } else {
                joinButton.textContent = `Join event (${joined} joined)`;
                joinButton.classList.remove("joined");
            }
        }

        renderJoinButton(countData.joined, alreadyJoined);

        joinButton.addEventListener("click", async () => {
            const isJoined = joinButton.classList.contains("joined");
            if (isJoined) {
                const result = await unjoinEvent(event.id);
                if (!result || result.error) return;
                renderJoinButton(result.joined, false);
            } else {
                const result = await joinEvent(event.id);
                if (!result || result.error) return;
                renderJoinButton(result.joined, true);
            }
        });
    } else {
        // Club owner: vis kun antal tilmeldte, ingen join-knap
        joinButton.classList.remove("hidden");
        joinButton.textContent = `${countData.joined} joined`;
        joinButton.style.pointerEvents = "none";
        joinButton.style.opacity = "0.7";
    }
}

document.addEventListener("click", (e) => {
    if (e.target.id === "close-event-details") {
        document.getElementById("event-details-popup").style.display = "none";
    }
});
