#include <stdio.h>
#include <string.h>

struct user
{
    char username[20];
    char password[20];
    char pref_days[20][20];
    char assigned_shifts[20][20];
};
typedef struct user user;

int main(void) {

    user User_1 = {
        "VikRas22",
        "asdkasd",
        {"Mandag", "Tirsdag", "Onsdag", "Torsdag"},
        {"Mandag", "Tirsdag", "Onsdag", "Torsdag"}
    };

    printf("%s\n", User_1.username);
    printf("%s\n", User_1.pref_days[0]);   // prints "Mandag"
    printf("%s\n", User_1.assigned_shifts[2]); // prints "Onsdag"

    return 0;
}





