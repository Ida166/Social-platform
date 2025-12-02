#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#define MAX_USERS 100
#define DAYS 7
#define MIN_WORKERS 3

// ---------------- USER STRUCT ----------------
struct user {
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
    printf("1: Login\n2: Register\n--->");

    while (1) {
        scanf("%d", &answer);
        if (answer == 1 || answer == 2 || answer == 19014)
            return answer;
        else
            printf("Invalid input try again!\n");
    }
}

// ---------------- OPTION SWITCH ----------------
void CheckOption(int option)
{
    if (option == 1) {
        user logged_in_user;
        login(&logged_in_user);
    } 
    else if (option == 2) {
        reg();
    }
    else if (option == 19014) {
        printf("\n--- ADMIN MODE ---\n");

        printf("\nRegistered Preferences:\n");
        for (int i = 0; i < total_users; i++) {
            printf("User: %s | %s %s %s\n",
                   all_users[i].username,
                   all_users[i].pref_days[0],
                   all_users[i].pref_days[1],
                   all_users[i].pref_days[2]);
        }

        compare_users_pref_days(all_users, total_users);
    }
}

// ---------------- LOGIN ----------------
void login(user *u)
{
    char username[20], password[20], file_username[20], file_password[20];

    FILE *f = fopen("Users.txt", "r");
    if (!f) {
        printf("No users exist yet.\n");
        return;
    }

    while (1) {
        printf("Enter username: ");
        scanf("%19s", username);
        printf("Enter password: ");
        scanf("%19s", password);

        int match = 0;
        rewind(f);

        while (fscanf(f, " %[^:]:%s", file_username, file_password) == 2) {
            if (strcmp(username, file_username) == 0 &&
                strcmp(password, file_password) == 0) {
                match = 1;
                break;
            }
        }

        if (match) {
            strcpy(u->username, username);
            strcpy(u->password, password);
            printf("\nLogin successful!\n");
            usermenu(u);
            fclose(f);
            return;
        } else {
            printf("Wrong username or password.\n");
        }
    }
}

// ---------------- REGISTER ----------------
void reg()
{
    char username[20], password[20];

    printf("Create Username: ");
    scanf("%19s", username);
    printf("Create Password: ");
    scanf("%19s", password);

    FILE *f = fopen("Users.txt", "a");
    fprintf(f, "%s:%s\n", username, password);
    fclose(f);

    printf("User registered successfully!\n");
}

// ---------------- USER MENU ----------------
void usermenu(user *u)
{
    int option;
    while (1) {
        printf("\n--- USER MENU (%s) ---\n", u->username);
        printf("1: Edit work preference\n");
        printf("2: See work preference\n");
        printf("3: Logout\n---> ");
        scanf("%d", &option);

        if (option == 3)
            return;
        else if (option == 1)
            work_pref(u);
        else if (option == 2)
            check_user_prefdays(u);
    }
}

// ---------------- DAY FUNCTIONS ----------------
int day_to_index(char day[]) {
    char *valid[] = {"Monday","Tuesday","Wednesday","Thursday",
                     "Friday","Saturday","Sunday"};
    for (int i = 0; i < 7; i++)
        if (strcmp(day, valid[i]) == 0)
            return i;
    return -1;
}

int valid_day(char day[]) {
    return day_to_index(day) != -1;
}

// ---------------- SAVE PREFERENCES ----------------
void work_pref(user *u)
{
    char p1[20], p2[20], p3[20];
    printf("Enter 3 preferred days: ");
    scanf("%19s %19s %19s", p1, p2, p3);

    if (!valid_day(p1) || !valid_day(p2) || !valid_day(p3)) {
        printf("Invalid day entered!\n");
        return;
    }

    FILE *temp = fopen("temp.txt", "w");
    FILE *old = fopen("pref_days.txt", "r");

    char name[20], d1[20], d2[20], d3[20];
    int updated = 0;

    if (old) {
        while (fscanf(old," %[^:]:%[^|]|%[^|]|%s",name,d1,d2,d3)==4) {
            if (strcmp(name,u->username)==0) {
                fprintf(temp,"%s:%s|%s|%s\n",u->username,p1,p2,p3);
                updated=1;
            } else {
                fprintf(temp,"%s:%s|%s|%s\n",name,d1,d2,d3);
            }
        }
        fclose(old);
    }

    if (!updated)
        fprintf(temp,"%s:%s|%s|%s\n",u->username,p1,p2,p3);

    fclose(temp);
    remove("pref_days.txt");
    rename("temp.txt","pref_days.txt");

    printf("Preferences saved.\n");

    total_users = load_all_preferences(all_users, MAX_USERS);
}

// ---------------- VIEW PREFERENCES ----------------
void check_user_prefdays(user *u)
{
    FILE *f = fopen("pref_days.txt", "r");
    char name[20], p1[20], p2[20], p3[20];

    while (fscanf(f," %[^:]:%[^|]|%[^|]|%s",name,p1,p2,p3)==4) {
        if (strcmp(name,u->username)==0) {
            printf("Your preferred days: %s %s %s\n",p1,p2,p3);
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

    int count=0;
    char name[20], d1[20], d2[20], d3[20];

    while (fscanf(f," %[^:]:%[^|]|%[^|]|%s",name,d1,d2,d3)==4 && count<max_users) {
        strcpy(users[count].username,name);
        strcpy(users[count].pref_days[0],d1);
        strcpy(users[count].pref_days[1],d2);
        strcpy(users[count].pref_days[2],d3);
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

    // Assign preferred days
    for (int i = 0; i < numb_of_users; i++) {
        for (int j = 0; j < 3; j++) {
            int day = day_to_index(users[i].pref_days[j]);
            if (day != -1) {
                schedule[day][workers_count[day]] = i;
                workers_count[day]++;
            }
        }
    }

    srand(time(NULL));

    // Fill missing workers
    for (int d = 0; d < DAYS; d++) {
        while (workers_count[d] < MIN_WORKERS) {
            int r = rand() % numb_of_users;
            int exists = 0;

            for (int k=0;k<workers_count[d];k++)
                if (schedule[d][k]==r)
                    exists=1;

            if (!exists) {
                schedule[d][workers_count[d]]=r;
                workers_count[d]++;
            }
        }
    }

    char *day_names[]={"Monday","Tuesday","Wednesday",
                        "Thursday","Friday","Saturday","Sunday"};

    printf("\n----- FINAL WORK SCHEDULE -----\n");
    for (int d = 0; d < DAYS; d++) {
        printf("\n%s (%d workers): ", day_names[d], workers_count[d]);
        for (int i = 0; i < workers_count[d]; i++)
            printf("%s ", users[schedule[d][i]].username);
    }
    printf("\n--------------------------------\n");
}




