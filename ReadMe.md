Moodle-Extension Clubs Events

A web-based platform developed as a Moodle extension prototype where stu-
dents can explore and join clubs and events, while club owners can create and
manage club activities.

For an in-depth overview of the application, its design, and development process, please refer to the project repport.

The project is built using a multi-page architecture with a Node.js and Ex-
press.js backend connected to a Supabase PostgreSQL database.
Features

Student Features:
  • Role-based login as student
  • View club list
  • View event list
  • Join and leave clubs
  • Join and leave events
  • Create new events
  • View club details and event information
  
Club Owner Features:
  • Role-based login as club owner
  • Create clubs
  • Edit club information
  • Edit event information
  • Upload club images
  • View club and event lists

Technologies Used
Frontend:
  • HTML
  • CSS
  • JavaScript
  • Fetch API
Backend:
  • Node.js
  • Express.js
  • express-session
  • Multer
  • dotenv
Database & Storage:
  • Supabase
  • PostgreSQL
  • Supabase Storage

Project Structure
- Backend/
- Public/
- .gitignore

Installation
  1. Clone the repository: git clone https://github.com/Ida166/Social-platform.git
  2. Navigate to the backend folder: cd social-platform/backend
  3. Install dependencies: npm install

Environment Variables
There is alredy created a .env file inside the backend/ folder. Where the following variable i added:
  • SUPABASE SERVICE KEY = your supabase service key
This is done to there can be connected to the database, and the relevant data can be fetched and updated, when the application is run. Furthermore the url to the suppabase can be found in backend/Supabase.js, and here: https://sjtapuesjqubmdawxwzm.supabase.co

Running the Application
  1. Start the server: npm start or node server.js
  2. The server will run locally on: http://localhost:3000

Development Mode
To run the project using nodemon: npm run dev
Backend Architecture
The backend follows a modular Express.js architecture based on separation of
concerns.

The system is divided into:
  • routes → endpoint definitions
  • controllers → application logic
  • middleware → reusable authorization logic
  • Supabase configuration → centralized database connection
  
This structure improves:
  • maintainability
  • scalability
  • readability
  • separation between routing and business logic
  
Database Design
The application uses Supabase with a PostgreSQL relational database.
Main database tables:
  • users
  • clubs
  • events
  • club members
  • event joined

The system uses relational connections and junction tables to manage:
  • users joining clubs
  • users joining events
Foreign key constraints ensure relational integrity between entities.

Authentication & Sessions
The application uses a simplified session-based authentication system using
express-session. Instead of traditional email/password authentication:
  • users are assigned a UUID
  • users select a role (student or club owner)
  • sessions maintain user state during navigation
  
This approach was chosen because the system is designed as a Moodle exten-
sion, where authentication would normally be handled externally.

Image Uploads
Club images are uploaded using:
  • Multer for handling file uploads
  • Supabase Storage for cloud-based image storage
Uploaded image URLs are stored in the database and linked to the correspond-
ing club.

API Structure
The backend follows REST-inspired routing principles using standard HTTP
methods.
