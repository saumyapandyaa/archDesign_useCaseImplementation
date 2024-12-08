# Simple Web Application based on the following Use Case-

In the course management scenario, a lecturer can upload  
 course materials via system that facilitates searches in all static information of courses, update them with a system that allows students to edit their personal information, and
remove them if necessary using a system that allows them to change password. Students and
lecturers can view and download materials using system that provides a password reset function, which resets the password and mails it to the user and notifies students of events. Administrators ensure the security and management  
 of storage via a system that allows the administration to enter lecturer information and a system that is interoperable with secondary university systems.

This is a **web application** project built using **Node.js**, **Express**, **MySQL**, and **EJS**. The app supports user authentication, session handling, file uploads, and role-based functionalities for students, lecturers, and admins.

## Features

- **User Authentication**: Login and session management.
- **Role-Based Access**: Students, Lecturers, and Admins have distinct functionalities.
- **Dashboard**: Personalized views based on user roles.
- **File Management**: Lecturers can upload materials (simulated).
- **Admin Panel**: Manage users and view courses.
- **Dynamic Routing**: EJS templates render dynamic content.

## Prerequisites

Before you can run the application, ensure you have the following installed:

- **Node.js** (v16+ recommended)
- **MySQL** (configured with a database named `phase3`)

## Installation

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd uc2

   ```

2. ## Running the Application

```bash
nodemon app.js

```
