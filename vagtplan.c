#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// User Data
struct user
{
    char username[20];
    char password[20];
    char pref_days[20][20];
    char assigned_shifts[20][20];
};
typedef struct user user;

// PROTOTYPER:
int introduction();
void CheckOption(int option);
void login(user *u);
void reg();
void usermenu(user *u);
void work_pref(user *u);
void check_user_prefdays(user *u);

// MAIN:
int main(void)
{

    int option = introduction(); // Scanf
    CheckOption(option);         // determined answear

    return 0;
}

// FUNCTIONS:

// introduktions funktion til brugeren:
int introduction()
{

    int answer;

    printf("----Welcome to SmartPlan alpha version----\n");
    printf("----You now have the following options----\n1:--->(Login)\n2:--->(Register)\n--->");

    while (1)
    {
        scanf("%d", &answer);

        if (answer == 1 || answer == 2 || answer == 456)
        {
            return answer;
            break;
        }
        else
        {
            printf("Invalid input try again!\n");
        }
    }
}

// Checkoption
void CheckOption(int option)
{
    if (option == 1)
    {
        user logged_in_user;
        // Login Function
        login(&logged_in_user);
    }
    else if (option == 2)
    {
        // Register
        reg();
    }
    else if (option == 456)
    {
        // Admin register
        printf("here you can login as a Admin");
    }
    else
    {
        printf("Error");
        exit(0);
    }
}

// login
void login(user *u)
{
    char username[20], password[20], file_username[20], file_password[20];

    FILE *f = fopen("Users.txt", "r");
    if (!f)
    {
        printf("There's no account yet, please create one first.\n");
        exit(EXIT_FAILURE);
    }

    while (1)
    {
        printf("Enter username:-->");
        scanf("%s", username);
        printf("Enter password:-->");
        scanf("%s", password);
        printf("\n");
        int match = 0;
        rewind(f);

        while (fscanf(f, "%[^:]:%s\n", file_username, file_password) == 2)
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

            printf("You have successfully logged in!\n");
            printf("----Welcome to SmartPlan----\n----%s----\n\n\n", u->username);
            // calling the usermenu to the user who's logged in.
            usermenu(u);
            break;
        }
        else
        {
            printf("Username or password incorrect! try again.\n");
        }
    }

    fclose(f);
}

// Register
void reg() // The user will be registered
{

    int reg_succesful = 0;
    char username[20], password[20];
    printf("----You have entered register mode----\n\nPlease Create your Username --->");
    scanf("%s", username);
    // Save this username in the file>Users

    printf("Please Create your Password --->");
    scanf("%s", password);
    // Save this Password in the file>Users

    FILE *f = fopen("Users.txt", "a");

    if (f == NULL)
    {

        printf("ERROR opening the file!!!!!");
        exit(EXIT_FAILURE);
    }
    else
    {

        reg_succesful = 1;
        fprintf(f, "%s:%s\n", username, password);

        fclose(f);

        if (reg_succesful == 1)
        {
            printf("\nUser registered succcessfully\n");

            
            // Give the user option to return to main menu
            
            int choice;
            printf("\nDo you want to go back to the introduction menu?\n");
            printf("1:--> Yes\n2:--> No (Exit Program)\n---> ");
            scanf("%d", &choice);

            if (choice == 1)
            {
                // Return to main introduction menu
                printf("\n");
                int option = introduction();
                CheckOption(option);
            }
            else
            {
                printf("Thank you for using our service!\n");
                exit(0); // closes the program
            }
            // ---------------------------------------------------------
        }
    }
}


// Menu for specifik user
void usermenu(user *u)
{
    int option_answer;
    int return_answer;

    printf("This is the menu for the user:---%s---:\n", u->username);

    // options for the user who's logged in:
    printf("1:--> See workshedule:\n");
    printf("2:--> edit workpreference:\n");
    printf("3:--> See workpreference:\n");
    printf("4:--> logout:\n\n");

    scanf("%d", &option_answer);

    // checks the answer:
    if (option_answer == 4)
    {
        printf("You are now logged out of the account: %s\n\n", u->username);

        printf("Do you wish to login again?\n");
        printf("1:--> (yes)\n2:--> (no)\n");
        scanf("%d", &return_answer);

        if (return_answer == 1)
        {
            login(u);
        }

        else
        {
            printf("Thank you for using our service!");
        }
    }
    else if (option_answer == 3)
    {

        check_user_prefdays(u);
    }

    else if (option_answer == 2)
    {

        work_pref(u);
    }
}

// function which saves users workdays-preferences for the user whos logged in
void work_pref(user *u)
{
    int answer_save_prefdays;
    char file_username[20];
    char pref1[20], pref2[20], pref3[20];
    int updated = 0;

    printf("You chose to edit your workdays preferences for user --> %s\n\n", u->username);
    printf("Input 3 preferred days (Monday-Sunday): ");

    scanf("%s %s %s",
          u->pref_days[0],
          u->pref_days[1],
          u->pref_days[2]);

    printf("\nYour preference-days are: %s, %s and %s\nSave? (1.yes / 2.no): ",
           u->pref_days[0], u->pref_days[1], u->pref_days[2]);

    scanf("%d", &answer_save_prefdays);

    if (answer_save_prefdays != 1)
        return;

    FILE *oldFile = fopen("pref_days.txt", "r");
    FILE *tempFile = fopen("temp.txt", "w");

    if (!tempFile)
    {
        printf("Error opening temp file!\n");
        exit(EXIT_FAILURE);
    }

    // If file exists, copy/update
    if (oldFile)
    {
        while (fscanf(oldFile, " %[^:]:%[^|]|%[^|]|%s",
                      file_username, pref1, pref2, pref3) == 4)
        {
            if (strcmp(file_username, u->username) == 0)
            {
                // OVERWRITE THIS USER
                fprintf(tempFile, "%s:%s|%s|%s\n",
                        u->username,
                        u->pref_days[0],
                        u->pref_days[1],
                        u->pref_days[2]);
                updated = 1;
            }
            else
            {
                // Copy other users unchanged
                fprintf(tempFile, "%s:%s|%s|%s\n",
                        file_username, pref1, pref2, pref3);
            }
        }
        fclose(oldFile);
    }

    // If user was NOT found, add new entry
    if (!updated)
    {
        fprintf(tempFile, "%s:%s|%s|%s\n",
                u->username,
                u->pref_days[0],
                u->pref_days[1],
                u->pref_days[2]);
    }

    fclose(tempFile);

    // Replace original file
    remove("pref_days.txt");
    rename("temp.txt", "pref_days.txt");

    printf("\nPreferences saved and updated successfully!\n");
}

/* This function opens the text-file with every users preference days, and looks for the
matching username in the file in order to find the coresponding days for the user*/
void check_user_prefdays(user *u)
{

    char file_username[20];
    char pref1[20], pref2[20], pref3[20];

    FILE *prefdays = fopen("pref_days.txt", "r");

    if (prefdays == NULL)
    {
        printf("ERROR opening pref_days.txt!\n");
        exit(EXIT_FAILURE);
    }

    int found = 0;

    // Format: username:pref1|pref2|pref3
    while (fscanf(prefdays, " %[^:]:%[^|]|%[^|]|%s",
                  file_username, pref1, pref2, pref3) == 4)
    {
        if (strcmp(u->username, file_username) == 0)
        {
            strcpy(u->pref_days[0], pref1);
            strcpy(u->pref_days[1], pref2);
            strcpy(u->pref_days[2], pref3);

            printf("User %s prefers the following days: %s, %s and %s\n",
                   u->username,
                   u->pref_days[0],
                   u->pref_days[1],
                   u->pref_days[2]);

            found = 1;
            break;
        }
    }

    if (!found)
    {
        int answer_create;
        printf("No saved preferences found for user--> %s\n\n", u->username);
        printf("Do you want to create preferences for user-->%s\n", u->username);
        printf("(1.yes/2.no)-->");
        scanf("%d", &answer_create);

        if (answer_create == 1)
        {

            work_pref(u);
        }
    }

    fclose(prefdays);
}




