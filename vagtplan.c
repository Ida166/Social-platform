#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// PROTOTYPER:
int introduction();
void CheckOption(int option);
void login();
void reg();

// User Data
struct user
{
    char username[20];
    char password[20];
    char pref_days[20][20];
    char assigned_shifts[20][20];
};
typedef struct user user;

// MAIN:
int main(void)
{
    int option = introduction(); // Scanf
    CheckOption(option);    // determined answear

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

        if (answer == 1)
        {
            return answer;
            break;
        }
        else if (answer == 2)
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
        //Admin register
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
    char username[20], password[20];
    // Input Username
    printf("Enter username");
    scanf("%s", username);
    // Check if this username exists in file>Users
    printf("Enter password");
    scanf("%s", password);
    // Check if this password is connected to the previous username in file>Users

    // When you log in
    printf("you have successfully logged in");
    // open a function that throws you into the program.

    printf("8===>");
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

        int reg_succesful = 1;
        fprintf(f, "%s:%s\n", username, password);

        fclose(f);
    }

    if (reg_succesful == 1)
    {
        printf("User registered succcessfully\n");
    }
}





