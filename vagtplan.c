#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#define MAX_USERS 100


// User Data
struct user
{
    char username[20];
    char password[20];
    char pref_days[3][20];
    char assigned_shifts[20][20];
};
typedef struct user user;

// user array:
user all_users[MAX_USERS];
int total_users = 0;



// PROTOTYPES
int introduction();
void CheckOption(int option);
void login(user *u);
void reg();
void usermenu(user *u);
void work_pref(user *u);
void check_user_prefdays(user *u);
int valid_day(char day[]);
int load_all_preferences(user users[], int max_users);

// MAIN
int main(void)
{
    total_users = load_all_preferences(all_users, MAX_USERS);
    int option = introduction();
    CheckOption(option);
    return 0;
}

// INTRO
int introduction()
{
    int answer;

    printf("----Welcome to SmartPlan alpha version----\n");
    printf("1: Login\n2: Register\n---> ");

    while (1)
    {
        scanf("%d", &answer);

        if (answer == 1 || answer == 2 || answer == 19014)
            return answer;
        else
            printf("Invalid input try again!\n");
    }
}

// MENU SWITCH
void CheckOption(int option)
{
    if (option == 1)
    {
        user logged_in_user;
        login(&logged_in_user);
    }
    else if (option == 2)
    {
        reg();
    }

    if (option == 19014)
    {

        int answer_admin;
        printf("----You are now logged in as admin----\n\nYou now have the following options:\n1:---> (Print every users information)\n--->");
        scanf("%d", &answer_admin);

        if (answer_admin == 1)
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
}

// LOGIN (FIXED: max attempts)
void login(user *u)
{
    char username[20], password[20], file_username[20], file_password[20];

    FILE *f = fopen("Users.txt", "r");
    if (!f)
    {
        printf("No users exist yet. Please register first.\n");
        return;
    }

    int attempts = 0;

    while (attempts < 3)
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

            printf("\nLogin successful! Welcome %s\n\n", u->username);
            usermenu(u);
            fclose(f);
            return;
        }
        else
        {
            printf("Wrong username or password.\n");
            attempts++;
        }
    }

    printf("Too many failed attempts.\n");
    fclose(f);
}

// REGISTER
void reg()
{
    char username[20], password[20];

    printf("Create Username: ");
    scanf("%19s", username);
    printf("Create Password: ");
    scanf("%19s", password);

    FILE *f = fopen("Users.txt", "a");

    if (!f)
    {
        printf("File error.\n");
        return;
    }

    fprintf(f, "%s:%s\n", username, password);
    fclose(f);

    printf("User registered successfully!\n");

    int choice;
    printf("Return to menu? (1=yes / 2=no): ");
    scanf("%d", &choice);

    if (choice == 1)
    {
        int option = introduction();
        CheckOption(option);
    }
}

// USER MENU (FIXED: LOOP ADDED)
void usermenu(user *u)
{
    int option_answer;

    while (1)
    {
        printf("\n--- USER MENU (%s) ---\n", u->username);
        printf("1: See workschedule\n");
        printf("2: Edit workpreference\n");
        printf("3: See workpreference\n");
        printf("4: Logout\n---> ");

        scanf("%d", &option_answer);

        if (option_answer == 4)
        {
            printf("Logged out successfully.\n");
            break;
        }
        else if (option_answer == 3)
        {
            check_user_prefdays(u);
        }
        else if (option_answer == 2)
        {
            work_pref(u);
        }
        else
        {
            printf("Invalid option!\n");
        }
    }
}

// VALID DAY CHECK
int valid_day(char day[])
{
    char *valid[] = {"Monday", "Tuesday", "Wednesday", "Thursday",
                     "Friday", "Saturday", "Sunday"};

    for (int i = 0; i < 7; i++)
        if (strcmp(day, valid[i]) == 0)
            return 1;

    return 0;
}

// SAVE PREFERENCES
void work_pref(user *u)
{
    char pref1[20], pref2[20], pref3[20];
    int answer_save_prefdays;

    printf("Enter 3 preferred days: ");
    scanf("%19s %19s %19s", pref1, pref2, pref3);

    if (!valid_day(pref1) || !valid_day(pref2) || !valid_day(pref3))
    {
        printf("Invalid day entered.\n");
        return;
    }

    strcpy(u->pref_days[0], pref1);
    strcpy(u->pref_days[1], pref2);
    strcpy(u->pref_days[2], pref3);

    printf("Save preferences? (1=yes / 2=no): ");
    scanf("%d", &answer_save_prefdays);
    if (answer_save_prefdays != 1)
        return;

    FILE *oldFile = fopen("pref_days.txt", "r");
    FILE *tempFile = fopen("temp.txt", "w");

    if (!tempFile)
    {
        printf("Error opening temp file.\n");
        return;
    }

    char file_username[20], fp1[20], fp2[20], fp3[20];
    int updated = 0;

    if (oldFile)
    {
        while (fscanf(oldFile, " %[^:]:%[^|]|%[^|]|%s",
                      file_username, fp1, fp2, fp3) == 4)
        {
            if (strcmp(file_username, u->username) == 0)
            {
                fprintf(tempFile, "%s:%s|%s|%s\n", u->username,
                        pref1, pref2, pref3);
                updated = 1;
            }
            else
            {
                fprintf(tempFile, "%s:%s|%s|%s\n",
                        file_username, fp1, fp2, fp3);
            }
        }
        fclose(oldFile);
    }

    if (!updated)
    {
        fprintf(tempFile, "%s:%s|%s|%s\n",
                u->username, pref1, pref2, pref3);
    }

    fclose(tempFile);
    remove("pref_days.txt");
    rename("temp.txt", "pref_days.txt");

    printf("Preferences saved successfully!\n\n");

    total_users = load_all_preferences(all_users, MAX_USERS);
    printf("Preferences reloaded for %d users.\n", total_users);
}

// VIEW PREFERENCES
void check_user_prefdays(user *u)
{
    char file_username[20], pref1[20], pref2[20], pref3[20];
    FILE *prefdays = fopen("pref_days.txt", "r");

    if (!prefdays)
    {
        printf("No preferences saved yet.\n");
        return;
    }

    int found = 0;

    while (fscanf(prefdays, " %[^:]:%[^|]|%[^|]|%s",
                  file_username, pref1, pref2, pref3) == 4)
    {
        if (strcmp(u->username, file_username) == 0)
        {
            printf("Your preferred days: %s, %s, %s\n",
                   pref1, pref2, pref3);
            found = 1;
            break;
        }
    }

    fclose(prefdays);

    if (!found)
        printf("No preferences found.\n");
}

// function that reads every user and their corrasponding days:
int load_all_preferences(user users[], int max_users)
{
    FILE *f = fopen("pref_days.txt", "r");
    if (!f)
    {
        printf("No preference file found.\n");
        return 0;
    }

    int count = 0;
    char username[20], d1[20], d2[20], d3[20];

    while (fscanf(f, " %[^:]:%[^|]|%[^|]|%s",
                  username, d1, d2, d3) == 4)
    {
        if (count >= max_users)
            break;

        strcpy(users[count].username, username);
        strcpy(users[count].pref_days[0], d1);
        strcpy(users[count].pref_days[1], d2);
        strcpy(users[count].pref_days[2], d3);

        count++;
    }

    fclose(f);
    return count;
}




