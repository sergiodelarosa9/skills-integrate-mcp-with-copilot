# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Login/logout with token-based authentication
- Role-based access control (`student`, `leader`, `teacher`, `admin`)
- Sign up for activities (authenticated users)
- Unregister participants (leader/teacher/admin)

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                     | Login and return bearer token + user role                          |
| POST   | `/auth/logout`                                                    | Logout and invalidate current bearer token                          |
| GET    | `/auth/me`                                                        | Return currently authenticated user and role                        |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity (requires auth)                             |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove participant (leader/teacher/admin only)                  |

## Development users

Seed users are stored in `users.json` for local development:

- `student1` / `student123` (`student`)
- `leader1` / `leader123` (`leader`)
- `teacher1` / `teacher123` (`teacher`)
- `admin1` / `admin123` (`admin`)

Use the returned bearer token from `/auth/login` as:

`Authorization: Bearer <access_token>`

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
