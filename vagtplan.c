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
void login();
void reg();

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
            // Login Function
            login();
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
    void login() // The user will be logged in
    {
        char username[20], password[20], file_username[20], file_password[20];

        // scan fil
        FILE *f = fopen("Users.txt", "r");

        if (f == NULL)
        {

            printf("There's no account yet, pls make one first");
            exit(EXIT_FAILURE);
        }

        while (1)
        {
            // Input Username and password
            printf("Enter username\n");
            scanf("%s", username);
            printf("Enter password\n");
            scanf("%s", password);
        int match = 0;
            rewind(f);  // VERY IMPORTANT

            // Read each user from file
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
                printf("You have successfully logged in!\n");
                printf("----Welcome to SmartPlan----\n----%s----\n", username);
                break;
            }
            else
            {
                printf("Username or password is incorrect! Try again.\n");
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
            printf("User registered succcessfully\n");
            CheckOption(1);
        }
        }    
    }


    //Menu for specifik user
    void usermenu(int match)
    {



    }
