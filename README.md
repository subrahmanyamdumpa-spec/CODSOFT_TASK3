CloudBus — Bus Ticket Reservation System

CloudBus is a cloud-based bus ticket reservation system that allows users to search for bus routes, view seat availability, select seats, enter passenger details, and confirm bookings.

The application uses Python Flask for the backend, Supabase PostgreSQL for database management, and Supabase Authentication for secure user registration and login.

🚀 Features

- 🔐 User registration and login
- 🔎 Search buses by source, destination, and date
- 🚌 View available buses and trip details
- 💺 Interactive seat-selection system
- 📊 Real-time seat availability
- 👤 Passenger information management
- 🎟️ Multi-seat booking
- 💰 Automatic booking price calculation
- 🔒 Secure authentication using Supabase
- 🛡️ Row Level Security (RLS)
- ⚡ Prevention of double-booking
- 📋 View personal booking history
- ☁️ Cloud-based PostgreSQL database

🛠️ Technology Stack

Frontend

- HTML5
- CSS3
- JavaScript

Backend

- Python
- Flask
- REST API

Database & Authentication

- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)

Deployment

- Render / Railway / other Python cloud platforms

📁 Project Structure

bus-reservation-system/
│
├── app.py
├── config.py
├── auth_utils.py
├── requirements.txt
├── .env.example
├── Procfile
├── runtime.txt
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

🖼️ Application Screenshots

1. Registration / Signup

The registration page allows new users to create an account securely using Supabase Authentication.

"Register / Signup" (screenshots/Register-signup.png)

2. Login

Existing users can log in using their registered email and password.

"Login" (screenshots/Login.png)

3. Home / Bus Search

Users can search for available buses by entering the source, destination, and travel date.

"Home" (screenshots/Home.png)

4. Seat Selection

Users can view the bus seat layout and select one or multiple available seats before booking.

"Select Seats" (screenshots/Select_seats.png)

5. Bookings

Users can view their confirmed bookings and booking details in their personal booking history.

"Bookings" (screenshots/Bookings.png)

6. Supabase Database

Supabase PostgreSQL is used to store routes, trips, seat availability, bookings, and related application data.

"Supabase" (screenshots/Supabase.png)

🗄️ Database Structure

CloudBus uses Supabase PostgreSQL as its cloud database.

"routes"

Stores source and destination information.

Column| Description
"route_id"| Unique route identifier
"from_city"| Starting city
"to_city"| Destination city

"trips"

Stores individual bus trips.

Column| Description
"id"| Unique trip identifier
"route_id"| Associated route
"bus_name"| Bus name
"bus_number"| Bus number
"bus_type"| Type of bus
"departure_time"| Departure time

"trip_availability"

Stores seat availability for every trip.

Column| Description
"trip_id"| Associated trip
"total_seats"| Total number of seats
"seats_available"| Currently available seats

Example:

Trip ID| Total Seats| Seats Available
1| 40| 40
2| 32| 32
3| 40| 40
4| 45| 45

When a booking is confirmed, the available-seat count is updated.

💺 Seat Booking System

CloudBus provides an interactive seat map.

Users can:

1. Open a bus trip.
2. View available, selected, and booked seats.
3. Select one or multiple seats.
4. Enter passenger details.
5. Review the total price.
6. Confirm the booking.

Seat states include:

- Available → Can be selected
- Selected → Currently selected by the user
- Booked → Already reserved and cannot be selected

Example:

Seat 31 → Selected
Seat 32 → Selected

2 seats selected
Total: ₹90

🔒 Authentication

CloudBus uses Supabase Email/Password Authentication.

Users can:

- Create an account
- Log in
- Log out
- Access protected pages
- View their own bookings

After login, Supabase provides an authentication token.

The browser sends the token to the Flask backend using:

Authorization: Bearer <token>

The backend verifies the token before allowing protected operations.

🛡️ Preventing Double Booking

One of the important features of CloudBus is preventing two users from booking the same seat simultaneously.

A PostgreSQL unique partial index is used:

create unique index unique_confirmed_seat
on public.bookings (trip_id, seat_number)
where status = 'confirmed';

This ensures that only one confirmed booking can exist for a particular seat on a particular trip.

The booking operation is also handled through a PostgreSQL function so multiple seats can be processed safely as a single transaction.

User A                    User B
   │                         │
   │ Book Seat 31            │ Book Seat 31
   │                         │
   └──────────┬──────────────┘
              ↓
        PostgreSQL
              ↓
       Seat 31 available?
          /       \
        YES        NO
         │          │
       Book       Reject
         │          │
         ↓          ↓
     Success     Booking
                 failed

This protection is handled at the database level, rather than relying only on frontend JavaScript.

🔄 Application Flow

User
 │
 ▼
Login / Signup
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

⚙️ Installation

1. Clone the Repository

git clone https://github.com/subrahmanyamdumpa-spec/CODSOFT_TASK3.git
cd bus-reservation-system

2. Create a Virtual Environment

Windows

python -m venv venv
venv\Scripts\activate

Linux / macOS

python -m venv venv
source venv/bin/activate

3. Install Dependencies

pip install -r requirements.txt

🔑 Environment Variables

Create a ".env" file in the project root:

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
FLASK_SECRET_KEY=your_flask_secret_key

⚠️ Never upload ".env" to GitHub.

Add the following to ".gitignore":

.env
venv/
__pycache__/

🗃️ Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run "database/schema.sql".
4. Run "database/seed.sql".
5. Enable Email/Password authentication.
6. Add the Supabase credentials to ".env".

The database will then contain the required routes, trips, availability, bookings, and user-related information.

▶️ Run the Application

Start the Flask server:

python app.py

Open the application in your browser:

http://localhost:5000

☁️ Cloud Deployment

CloudBus can be deployed on platforms such as:

- Render
- Railway
- Fly.io
- AWS

Render

Build Command

pip install -r requirements.txt

Start Command

gunicorn app:app

Add the required environment variables through the cloud platform's environment settings.

🧪 Testing

- [ ] Create a new user account
- [ ] Login successfully
- [ ] Search for available buses
- [ ] Search using source and destination
- [ ] Search using a valid travel date
- [ ] View bus details
- [ ] View available seats
- [ ] Select multiple seats
- [ ] Enter passenger details
- [ ] Confirm a booking
- [ ] Verify booking in Supabase
- [ ] View booking in My Bookings
- [ ] Cancel a booking
- [ ] Verify the seat becomes available again
- [ ] Test two users attempting to book the same seat
- [ ] Verify that the second booking is rejected
- [ ] Logout successfully
- [ ] Verify protected pages require authentication

📊 Seat Availability

CloudBus maintains live seat availability through the "trip_availability" table.

Example:

Trip 1
Total Seats     : 40
Available Seats : 40

After two seats are successfully booked:

Trip 1
Total Seats     : 40
Available Seats : 38

The seat map then reflects the updated booking state.

🔐 Security

CloudBus follows several security practices:

- Supabase handles user authentication.
- Passwords are never handled directly by Flask.
- JWT authentication is used for protected API requests.
- Supabase Row Level Security protects user data.
- Service-role credentials are kept on the backend.
- ".env" credentials are excluded from GitHub.
- PostgreSQL constraints prevent duplicate confirmed seats.

«⚠️ Important: Never expose the Supabase "service_role" key or JWT secret in frontend JavaScript.»

📈 Scalability

The Flask backend is designed to be stateless, allowing multiple application instances to run simultaneously behind a load balancer.

The database remains the central source of truth for:

- Trips
- Seat availability
- Bookings
- Users

Because seat uniqueness is enforced at the PostgreSQL level, booking consistency can be maintained even when multiple users attempt bookings simultaneously.

🎯 Future Improvements

Possible future enhancements include:

- 💳 Online payment integration
- 📧 Booking confirmation emails
- 📱 Mobile-responsive improvements
- 🎫 Downloadable PDF tickets
- 🔔 Booking notifications
- 🧾 Digital ticket / QR code generation
- 🗺️ Live bus tracking
- 👨‍💼 Admin dashboard
- 📊 Booking analytics
- 🔍 Advanced bus filtering
- 🌐 Custom domain deployment
- ⚡ Caching for high-traffic searches

👨‍💻 Project

CloudBus — Cloud-Based Bus Ticket Reservation System

Built using:

Python + Flask
HTML + CSS + JavaScript
Supabase
PostgreSQL
JWT Authentication
REST API

CloudBus is designed as a secure, cloud-based and scalable bus reservation platform that provides route searching, real-time seat availability, multi-seat booking, authentication, and database-level protection against double booking.