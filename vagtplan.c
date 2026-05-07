#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#define MAX_USERS 10
#define DAYS 7
#define MIN_WORKERS 3

// ---------------- USER STRUCT ----------------
struct user
{
    char username[20];
    char password[20];
    char pref_days[3][20];
};
typedef struct user user;

// ---------------- GLOBAL DATA ----------------
user all_users[MAX_USERS];
int total_users = 0;

// ---------------- PROTOTYPES ----------------
int introduction();
void CheckOption(int option);
void login(user *u);
void reg();
void usermenu(user *u);
void work_pref(user *u);
void check_user_prefdays(user *u);
int valid_day(char day[]);
int day_to_index(char day[]);
int load_all_preferences(user users[], int max_users);
void compare_users_pref_days(user users[], int numb_of_users);
void admin_menu();
int username_exists(char *username);

// ---------------- MAIN ----------------
int main(void)
{
    total_users = load_all_preferences(all_users, MAX_USERS);

    int option = introduction();
    CheckOption(option);
    return 0;
}

// ---------------- INTRO ----------------
int introduction()
{
    int answer;
    printf("---- Welcome to SmartPlan ----\n");
    printf("0: Exit Program\n1: Login\n2: Register\n--->");

    while (1)
    {
        scanf("%d", &answer);
        if (answer == 0 || answer == 1 || answer == 2 || answer == 19014)
            return answer;
        else
            printf("Invalid input try again!\n");
    }
}

// ---------------- OPTION SWITCH ----------------
void CheckOption(int option)
{
    if (option == 0)
    {
        printf("Thank you for using Smartplan\n");
        return;
    }
    else if (option == 1)
    {
        user logged_in_user;
        login(&logged_in_user);
    }
    else if (option == 2)
    {

        if (total_users >= MAX_USERS)
        {
            printf("There is currently too many users registered on this platform!");
        }
        else
        {
            reg();
        }
    }
    else if (option == 19014)
    {
        admin_menu();
    }
}

// ---------------- LOGIN ----------------
void login(user *u)
{
    char username[20], password[20], file_username[20], file_password[20];

    FILE *f = fopen("Users.txt", "r");
    if (!f)
    {
        printf("No users exist yet.\n");
        return;
    }

    while (1)
    {
        printf("Enter username: ");
        scanf("%19s", username);
        printf("Enter password: ");
        scanf("%19s", password);

        int match = 0;
        rewind(f);

        while (fscanf(f, " %[^:]:%s", file_username, file_password) == 2)
        {
            if (strcmp(username, file_username) == 0 &&
                strcmp(password, file_password) == 0)
            {
                match = 1;
                break;
            }
        }

        if (match)
        {
            strcpy(u->username, username);
            strcpy(u->password, password);
            printf("\nLogin successful!\n");
            usermenu(u);
            fclose(f);
            return;
        }
        else
        {
            printf("Wrong username or password!\n\n");
        }
    }
}

// ---------------- REGISTER ----------------
void reg()
{
    char username[20], password[20];
    int choice;

    while (1)
    {
        printf("Create Username: ");
        scanf("%19s", username);

        if (username_exists(username)) // checks if username already exist by using the function username_exists
        {

            printf("\nUsername already taken! Please try again:\n");
        }
        else
        {
            break;
        }
    }

    printf("Create Password: ");
    scanf("%19s", password);

    FILE *f = fopen("Users.txt", "a");
    fprintf(f, "%s:%s\n", username, password);
    fclose(f);

    printf("User registered successfully!\n");

    printf("\nDo you wish to login?\n1:--> (yes)\n2:--> (no)\n\n--->");

    scanf("%d", &choice);

    CheckOption(choice);
}

// ---------------- USER MENU ----------------
void usermenu(user *u)
{
    int option;
    while (1)
    {
        printf("\n--- USER MENU (%s) ---\n", u->username);
        printf("1: Edit work preference\n");
        printf("2: See work preference\n");
        printf("3: Logout\n---> ");
        scanf("%d", &option);

        if (option == 3)
        {
            CheckOption(0);
            break;
        }
        else if (option == 1)
            work_pref(u);
        else if (option == 2)
            check_user_prefdays(u);
    }
}

// ---------------- DAY FUNCTIONS ----------------
int day_to_index(char day[])
{
    char *valid[] = {"Monday", "Tuesday", "Wednesday", "Thursday",
                     "Friday", "Saturday", "Sunday"};
    for (int i = 0; i < 7; i++)
        if (strcmp(day, valid[i]) == 0)
            return i;
    return -1;
}

int valid_day(char day[])
{
    return day_to_index(day) != -1;
}

// ---------------- SAVE PREFERENCES ----------------
void work_pref(user *u)
{
    char p1[20], p2[20], p3[20];
    printf("Enter 3 preferred days: ");
    scanf("%19s %19s %19s", p1, p2, p3);

    if (!valid_day(p1) || !valid_day(p2) || !valid_day(p3))
    {
        printf("Invalid day entered!\n");
        return;
    }

    FILE *temp = fopen("temp.txt", "w");
    FILE *old = fopen("pref_days.txt", "r");

    char name[20], d1[20], d2[20], d3[20];
    int updated = 0;

    if (old)
    {
        while (fscanf(old, " %[^:]:%[^|]|%[^|]|%s", name, d1, d2, d3) == 4)
        {
            if (strcmp(name, u->username) == 0)
            {
                fprintf(temp, "%s:%s|%s|%s\n", u->username, p1, p2, p3);
                updated = 1;
            }
            else
            {
                fprintf(temp, "%s:%s|%s|%s\n", name, d1, d2, d3);
            }
        }
        fclose(old);
    }

    if (!updated)
        fprintf(temp, "%s:%s|%s|%s\n", u->username, p1, p2, p3);

    fclose(temp);
    remove("pref_days.txt");
    rename("temp.txt", "pref_days.txt");

    printf("Preferences saved.\n");

    total_users = load_all_preferences(all_users, MAX_USERS);
}

// ---------------- VIEW PREFERENCES ----------------
void check_user_prefdays(user *u)
{
    FILE *f = fopen("pref_days.txt", "r");
    char name[20], p1[20], p2[20], p3[20];

    while (fscanf(f, " %[^:]:%[^|]|%[^|]|%s", name, p1, p2, p3) == 4)
    {
        if (strcmp(name, u->username) == 0)
        {
            printf("Your preferred days: %s %s %s\n", p1, p2, p3);
            fclose(f);
            return;
        }
    }
    fclose(f);
    printf("No preferences saved.\n");
}

// ---------------- LOAD ALL USERS ----------------
int load_all_preferences(user users[], int max_users)
{
    FILE *f = fopen("pref_days.txt", "r");
    if (!f)
        return 0;

    int count = 0;
    char name[20], d1[20], d2[20], d3[20];

    while (fscanf(f, " %[^:]:%[^|]|%[^|]|%s", name, d1, d2, d3) == 4 && count < max_users)
    {
        strcpy(users[count].username, name);
        strcpy(users[count].pref_days[0], d1);
        strcpy(users[count].pref_days[1], d2);
        strcpy(users[count].pref_days[2], d3);
        count++;
    }
    fclose(f);
    return count;
}

// ---------------- SCHEDULE GENERATOR ----------------
void compare_users_pref_days(user users[], int numb_of_users)
{
    int schedule[DAYS][MAX_USERS];
    int workers_count[DAYS] = {0};

    // 1) Assign preferred days first
    for (int i = 0; i < numb_of_users; i++)
    {
        for (int j = 0; j < 3; j++)
        {
            int day = day_to_index(users[i].pref_days[j]);
            if (day != -1)
            {
                schedule[day][workers_count[day]] = i;
                workers_count[day]++;
            }
        }
    }

    // 2) Randomly fill missing workers fairly
    int forced_assigned[MAX_USERS] = {0}; // keeps track of who has already been forced
    srand(time(NULL));

    for (int d = 0; d < DAYS; d++)
    {
        while (workers_count[d] < MIN_WORKERS)
        {

            int candidates_pref[MAX_USERS];
            int pref_count = 0;

            // Find users who:
            // - are NOT already working this day
            // - and have NOT been forced yet
            for (int u = 0; u < numb_of_users; u++)
            {
                int already = 0;

                for (int k = 0; k < workers_count[d]; k++)
                {
                    if (schedule[d][k] == u)
                    {
                        already = 1;
                        break;
                    }
                }

                if (!already && forced_assigned[u] == 0)
                {
                    candidates_pref[pref_count++] = u;
                }
            }

            int pick = -1;

            if (pref_count > 0)
            {
                // Pick randomly among users who haven't been forced yet
                int idx = rand() % pref_count;
                pick = candidates_pref[idx];
            }
            else
            {
                // Fallback: pick any user not already in this day
                int candidates_any[MAX_USERS];
                int any_count = 0;

                for (int u = 0; u < numb_of_users; u++)
                {
                    int already = 0;

                    for (int k = 0; k < workers_count[d]; k++)
                    {
                        if (schedule[d][k] == u)
                        {
                            already = 1;
                            break;
                        }
                    }

                    if (!already)
                    {
                        candidates_any[any_count++] = u;
                    }
                }

                if (any_count == 0)
                    break; // safety against infinite loop

                int idx = rand() % any_count;
                pick = candidates_any[idx];
            }

            // Assign the chosen user to this day
            schedule[d][workers_count[d]] = pick;
            workers_count[d]++;

            // Mark user as forced so they won't be preferred again
            forced_assigned[pick] = 1;
        }
    }

    // 3) Print final schedule
    char *day_names[] = {
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"};

    printf("\n----- FINAL WORK SCHEDULE -----\n");
    for (int d = 0; d < DAYS; d++)
    {
        printf("\n%s (%d workers): ", day_names[d], workers_count[d]);
        for (int i = 0; i < workers_count[d]; i++)
            printf("%s ", users[schedule[d][i]].username);
    }
    printf("\n--------------------------------\n");
}

// menu for admin
void admin_menu()
{
    int option;

    while (1)
    {
        printf("\n    ---- ADMIN MODE ----    \n\n");
        printf("You have the following options:\n\n");
        printf("1:--> See users preferences\n");
        printf("2:--> Print work schedule for users\n");
        printf("3:--> Exit admin mode\n\n---> ");

        scanf("%d", &option);

        // 1) See user preferences
        if (option == 1)
        {
            printf("\nRegistered Preferences:\n");

            if (total_users == 0)
            {
                printf("No users have saved preferences yet.\n");
            }
            else
            {
                for (int i = 0; i < total_users; i++)
                {
                    printf("User: %s | %s %s %s\n",
                           all_users[i].username,
                           all_users[i].pref_days[0],
                           all_users[i].pref_days[1],
                           all_users[i].pref_days[2]);
                }
            }
        }

        // 2) Print work schedule
        else if (option == 2)
        {
            if (total_users == 0)
            {
                printf("No users available to create a schedule.\n");
            }
            else
            {
                compare_users_pref_days(all_users, total_users);
            }
        }

        // 3) Exit admin mode
        else if (option == 3)
        {
            printf("Exiting admin mode...\n");
            return;
        }

        else
        {
            printf("Invalid input!\n");
        }
    }
}

int username_exists(char *username)
{
    FILE *f = fopen("Users.txt", "r");
    if (!f)
        return 0; // No file means no users yet → username is unique

    char file_username[20], file_password[20];

    while (fscanf(f, " %[^:]:%[^\n]", file_username, file_password) == 2)
    {
        if (strcmp(username, file_username) == 0)
        {
            fclose(f);
            return 1; // found duplicate
        }
    }

    fclose(f);
    return 0; // unique
}






