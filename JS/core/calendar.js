import { getEvents } from "../pages/clubServices.js";

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

/*Function that thakes the time fx 16:00-18:00 and split it into start and end */
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
            const [endHour] = end.split(":").map(Number);

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
        const [hour, minute] = timeString.split(":").map(Number); // vi splitter timer fra minutter
        return (hour - calendarStartHour) * 4 + minute / 15+1; // der går 4 kvarter pr. time, og så er der de løse minutter.
                                //så fordeler vi det hele på kvarter, fordi vores row grid er inddelt efter det.
    }



    function renderEvents(monday){
        const container = document.querySelector(".eventcontainer"); //finder .eventContainer i html
        container.innerHTML = ""; //tømmer indholdet fx hvis brugeren skifter til ny uge, så gamle events ikke fremgår

        events.forEach(event => { //alle events brugeren har angivet køres igennem og får dato ift. kalenderen
            const eventDate = new Date(event.date);

            const diffFromMonday = Math.floor((eventDate - monday)/(1000*60*60*24)); //vi finder differencen fra mandag, fordi Date også tager tiden med, tager vi Math.floor, 
            //så vi får en hel og ikke halve dage. Ikke brugbart til at finde dag i kolonnerne
            //da der med Date objekter regnes i millisekunder, tager vi og dividerer differencen med antal milisekunder der er på et døgn, for at få dage

            if (diffFromMonday>= 0 && diffFromMonday < 7){ //vi opretter kun indenfor den uge der er displayet
                const element = document.createElement("div");  //vi laver et element "div"
                element.classList.add("slot");                  //tilføjer class "slot"
                element.textContent = event.title;              //som får titlen bruger har angivet

                element.style.gridColumn = diffFromMonday + 1;   //diffFromMonday starter fra 0, imen mandag i kolonner starter på 1, så derfor +1
                const {start, end } = splitTimeRange(event.time);
                element.style.gridRow = timeToRow(start) + " / " + timeToRow(end); //starter fra mængde kvarter vi er inde i døgnet, og strækker sig til slut - igen antal kvarter inde i døgnet.
                //i css er syntaks gridrow = start /end.
                container.appendChild(element); //og så tilføjer vi til sidst 
            }
        });
}

// dato som objekt - 

        /*  DATO METHODS:

        new Date() -> dagsdato og tid
        new Date(monday) -> kopier mandag
        setDate(15) -> sæt dag til 15

        getFullYear -> 2026
        getMonth() -> 0-11; jan, feb osv.
        getDate() -> dage i måneden 1-31; 
        getDay() -> dag i ugen 0-7; man, tir, osv.

        */



/* Dags dato over kalenderen*/ 

    function updateDate(){

        const date = new Date();

        const today = {
            year: date.getFullYear(), // Indeværende år 
            month: date.getMonth()+1, // Indeværende måned 0 = januar, 11 = december 
            day: date.getDate() // indeværende dag; 14., 15. 
        }

    document.getElementById("currentDate").textContent = today.day + "." + today.month + "." + today.year;
    }

    setInterval(updateDate, 100);

/* Dynamiske datoer i selve kalenderen */

    let weekOffset = 0;

    function renderWeek(){
        const today = new Date(); //


        let currentDay = today.getDay(); //Finder ud af hvilken dag nuværende dag er
            if (currentDay === 0){ 
                currentDay = 7 //hvis dagen er søndag, sættes søndag til 7
            }

        const monday = new Date(today); //vi laver mandag ud fra dagsdato
        monday.setDate(today.getDate() - (currentDay - 1) + weekOffset * 7);
        //tager dagsdato og trækker differencen fra dagsdato til mandag fra
        //hvis bruger vil frem i kalenderen, tælles weekOffset op, og der lægges 7 dage til alt efter hvor mange uger frem, user vil

        for(let i=0; i < 7; i++){
            const dayInWeek = new Date (monday); //kopierer mandag, og tagerudgangspunkt i den til at genere resten af ugens dage.
            dayInWeek.setDate(monday.getDate() + i); //henter mandags dato, og lægger dage til, som vi er fra mandag, for at få den specifikke ugedags dato
            //så hvis mandag er d. 14. og vi laver tirsdag, så lægges 1 til datoen, som vi tog udgangspunkt i.

            document.getElementById("day" + (i+1)).textContent = dayInWeek.getDate() + "/" + (dayInWeek.getMonth() + 1);
            //Her lægges værdierne/datoeren over til tilsvarende id'er; day1, day2, osv.
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