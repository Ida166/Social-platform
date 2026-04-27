
/* permissions-system Her er roller og premissions defineret
Vi angiver hvad de forskellige bruger mÃ¥ se af fx knapper

sÃ¥ kan vi senere i koden tjekke om brugeren har rettighed til at tilgÃ¥ en knap ved:
if (hasPermission(role, "create_event")) {
    // vis create event knap
}
*/

export const roles = {
    student: [ /*dette er eksempler pÃ¥ rettigheder student skal have sÃ¥ hvad de mÃ¥ se*/
        "view_events",
        "signup_event",
        "view_clubs",
        "apply_create_club",
        "apply_create_event",
        "view_calendar",
        "filter_clubs",
        "create-club-or-event"
    ],
    club_owner: [
       "view_events",
        "signup_event",
        "view_clubs",
        "view_calendar",
        "create_event",
        "edit_own_event",
        "send_notifications",
        "create-club-or-event"
    ],
    admin: [
        "view_events",
        "signup_event",
        "view_clubs",
        "view_calendar",
        "create_event",
        "edit_any_event",
        "manage_clubs",
        "publish_event",
        "delete_event"
    ]
};

import { getRole } from "./auth.js"; //returnerer brugerens rolle fra sessionStorage

export function hasPermission(permission) { //permission = fx "create_event"
    const role = getRole();
    return roles[role]?.includes(permission); //roles[role] henter arrayâ€™en med alle permissions for den nuvÃ¦rende bruger. includes(permission) returnerer true/false til om grugeren mÃ¥ udfÃ¸re handningen
}
