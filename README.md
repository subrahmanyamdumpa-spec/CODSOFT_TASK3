

# 🚌 CloudBus — Bus Ticket Reservation System

CloudBus is a cloud-based bus ticket reservation system built with **Python Flask, Supabase, and PostgreSQL**.

The system allows users to securely register and log in, search for buses, select available seats, enter passenger details, and confirm bookings. It also provides real-time seat availability and database-level protection against double booking.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 Authentication | Secure user registration and login using Supabase Auth |
| 🔎 Bus Search | Search buses by source, destination, and travel date |
| 🚌 Bus Details | View available buses and trip information |
| 💺 Seat Selection | Interactive seat selection with available/booked states |
| 🎟️ Multi-seat Booking | Book multiple seats in a single transaction |
| 💰 Price Calculation | Automatically calculates the total booking price |
| 📊 Live Availability | Updates available seats after successful bookings |
| 🛡️ Double-booking Protection | PostgreSQL constraints prevent duplicate seat bookings |
| 📋 Booking History | Users can view their personal bookings |
| 🔒 Row Level Security | Supabase RLS protects user-specific data |
| ☁️ Cloud Database | PostgreSQL database hosted on Supabase |

---

## 🛠️ Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python
- Flask
- REST API

### Database & Authentication
- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)
- JWT Authentication

### Deployment
- Render
- Railway
- Other Python-compatible cloud platforms

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │        User          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   HTML / CSS / JS    │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                 REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Flask Backend    │
                         │       Python         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Supabase       │
                         │   Authentication     │
                         │          +           │
                         │     PostgreSQL       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Routes / Trips /     │
                         │ Seats / Bookings     │
                         └──────────────────────┘


---

📁 Project Structure

The project is organized into backend, frontend, database, configuration, and screenshot components.

bus-reservation-system/
│
├── app.py
├── config.py
├── auth_utils.py
├── requirements.txt
├── .env.example
├── .gitignore
├── Procfile
├── runtime.txt
├── README.md
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── common.js
│       ├── auth.js
│       ├── search.js
│       ├── seats.js
│       └── bookings.js
│
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── seats.html
│   └── bookings.html
│
└── screenshots/
    ├── Register-signup.png
    ├── Login.png
    ├── Home.png
    ├── Select_seats.png
    ├── Bookings.png
    └── Supabase.png

📂 Important Directories

Directory	Purpose

database/	PostgreSQL schema and sample data
static/css/	Application styles
static/js/	Frontend JavaScript
templates/	Flask HTML templates
screenshots/	Project screenshots


📄 Important Files

File	Purpose

app.py	Main Flask application
config.py	Application configuration
auth_utils.py	Authentication utilities
requirements.txt	Python dependencies
.env.example	Example environment variables
.gitignore	Files excluded from Git
Procfile	Cloud deployment configuration
runtime.txt	Python runtime configuration
README.md	Project documentation


> ⚠️ The actual .env file is intentionally excluded from GitHub because it contains private credentials.




---

🗄️ Database Design

CloudBus uses Supabase PostgreSQL as its cloud database.

Routes

The routes table stores source and destination information.

Column	Description

route_id	Unique route identifier
from_city	Starting city
to_city	Destination city


Trips

The trips table stores individual bus trips.

Column	Description

id	Unique trip identifier
route_id	Associated route
bus_name	Bus name
bus_number	Bus number
bus_type	Type of bus
departure_time	Departure time


Trip Availability

The trip_availability table maintains seat availability.

Column	Description

trip_id	Associated trip
total_seats	Total number of seats
seats_available	Currently available seats


Example

Trip ID	Total Seats	Seats Available

1	40	40
2	32	32
3	40	40
4	45	45


After booking two seats:

Total Seats      : 40
Available Seats  : 38


---

💺 Seat Booking System

CloudBus provides an interactive seat-selection system.

Booking Process

Search Bus
    ↓
Select Trip
    ↓
View Seat Map
    ↓
Select Seat(s)
    ↓
Enter Passenger Details
    ↓
Review Price
    ↓
Confirm Booking
    ↓
Booking Stored in PostgreSQL

Seat States

State	Meaning

🟢 Available	Seat can be selected
🔵 Selected	Seat currently selected by the user
🔴 Booked	Seat is already reserved


Example:

Seat 31 → Selected
Seat 32 → Selected

2 seats selected
Total Price → ₹90


---

🔒 Authentication

CloudBus uses Supabase Email/Password Authentication.

Authentication Flow

User
 │
 ▼
Register / Login
 │
 ▼
Supabase Authentication
 │
 ▼
Authentication Token
 │
 ▼
Flask Backend
 │
 ▼
Protected API

Authenticated requests use:

Authorization: Bearer <token>

The Flask backend verifies the authentication token before allowing protected operations.


---

🛡️ Double-Booking Protection

A major feature of CloudBus is protection against two users booking the same seat simultaneously.

A PostgreSQL partial unique index is used:

CREATE UNIQUE INDEX unique_confirmed_seat
ON public.bookings (trip_id, seat_number)
WHERE status = 'confirmed';

This guarantees that only one confirmed booking can exist for the same seat on the same trip.

Example

User A                    User B
   │                         │
   │ Book Seat 31            │ Book Seat 31
   │                         │
   └──────────┬──────────────┘
              │
              ▼
        PostgreSQL
              │
              ▼
       Check Seat 31
          /       \
       Available  Booked
          │          │
          ▼          ▼
       Confirm     Reject
       Booking     Booking

The database acts as the final source of truth rather than relying only on frontend validation.


---

🔄 Application Flow

User
 │
 ▼
Register / Login
 │
 ▼
Search Route
 │
 ▼
View Available Buses
 │
 ▼
Select Bus
 │
 ▼
View Seat Map
 │
 ▼
Select Seats
 │
 ▼
Enter Passenger Details
 │
 ▼
Confirm Booking
 │
 ▼
Flask REST API
 │
 ▼
Supabase PostgreSQL
 │
 ▼
Booking Confirmed
 │
 ▼
My Bookings
## 🖼️ Application Screenshots

### 1. Registration / Signup

Users can create a new account using Supabase Authentication.

![Registration / Signup](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/Register-signup.png)

### 2. Login

Registered users can securely log in to CloudBus.

![Login](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/Login.png)

### 3. Home / Bus Search

Users can search for buses by entering the source, destination, and travel date.

![Home / Bus Search](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/Home.png)

### 4. Seat Selection

Users can view the seat map and select one or multiple available seats.

![Seat Selection](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/Select_seats.png)

### 5. Booking History

Users can view their confirmed bookings and passenger information.

![Booking History](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/bookings.png)

### 6. Supabase Database
Supabase PostgreSQL is used as the cloud database for routes, trips, seat availability, and bookings.

![Supabase Database](https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3/blob/main/screenshots/Supabase.png)


⚙️ Installation

1. Clone the Repository

git clone https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3.git
cd CODSOFT_TASK3

2. Create a Virtual Environment

Windows

python -m venv venv
venv\Scripts\activate

Linux / macOS

python -m venv venv
source venv/bin/activate

3. Install Dependencies

pip install -r requirements.txt


---

🔑 Environment Variables

Create a .env file in the project root:

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FLASK_SECRET_KEY=your_flask_secret_key

.gitignore

The following should remain excluded from Git:

.env
venv/
__pycache__/
*.pyc

> 🔐 Never upload your .env file, Supabase service-role key, or JWT secret to GitHub.




---

🗃️ Supabase Configuration

1. Create a Supabase project.


2. Open SQL Editor.


3. Run database/schema.sql.


4. Run database/seed.sql.


5. Enable Email/Password Authentication.


6. Copy the required Supabase credentials.


7. Add them to your local .env file.




---

▶️ Running the Application

Start the Flask server:

python app.py

The application will be available at:

http://localhost:5000


---

☁️ Cloud Deployment

CloudBus can be deployed using Python-compatible cloud platforms such as:

Render

Railway

Fly.io

AWS


Render Configuration

Build Command

pip install -r requirements.txt

Start Command

gunicorn app:app

Environment variables should be added through the platform's environment-variable settings.


---

🧪 Testing Checklist

Authentication

[ ] Create a new user account

[ ] Login successfully

[ ] Logout successfully

[ ] Verify protected pages require authentication


Bus Search

[ ] Search using source and destination

[ ] Search using travel date

[ ] View available buses

[ ] View bus details


Seat Booking

[ ] View available seats

[ ] Select a seat

[ ] Select multiple seats

[ ] Enter passenger details

[ ] Verify automatic price calculation

[ ] Confirm booking

[ ] Verify booking in Supabase

[ ] View booking in My Bookings


Booking Safety

[ ] Cancel a booking

[ ] Verify the seat becomes available again

[ ] Test two users attempting to book the same seat

[ ] Verify the second booking is rejected



---

🔐 Security

CloudBus implements several security mechanisms:

Supabase Authentication for user management

JWT-based authentication for protected requests

PostgreSQL Row Level Security

Database-level seat uniqueness

Server-side validation

Environment variables for sensitive credentials

Service-role credentials restricted to the backend

.env excluded from version control


> Important: Never expose the Supabase service_role key or JWT secret in frontend JavaScript.




---

📈 Scalability

The Flask backend is designed to be stateless, allowing multiple application instances to run behind a load balancer.

Supabase PostgreSQL acts as the central source of truth for:

Routes

Trips

Seat availability

Bookings

User data


Database-level constraints help maintain booking consistency even when multiple users attempt to reserve the same seat simultaneously.


---

🚀 Future Improvements

💳 Online payment integration

📧 Booking confirmation emails

📱 Improved mobile responsiveness

🎫 Downloadable PDF tickets

🔔 Booking notifications

🧾 QR-code based digital tickets

🗺️ Live bus tracking

👨‍💼 Admin dashboard

📊 Booking analytics

🔍 Advanced bus filtering

🌐 Custom domain

⚡ Search caching

📈 Advanced monitoring and logging



---

👨‍💻 Project Information

CloudBus

Cloud-Based Bus Ticket Reservation System

Built With

Python

Flask

HTML5

CSS3

JavaScript

Supabase

PostgreSQL

JWT Authentication

REST API


CloudBus demonstrates how a cloud-based reservation application can combine a Python backend, modern web technologies, cloud authentication, and PostgreSQL database transactions to provide a secure and reliable bus booking platform.


---

📌 Repository

GitHub Repository:
https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3


---

⭐ CloudBus — Secure. Cloud-Based. Reliable Bus Booking.
