"""
Cloud Bus Ticket Reservation System — Flask backend.

Architecture
------------
- Supabase Auth handles email/password sign-up & login directly from
  the browser (static/js/auth.js). Flask never touches passwords.
- Flask exposes a small stateless JSON API that uses the Supabase
  *service role* key to read/write the Postgres database. Because
  it's stateless (no server-side sessions — auth is a JWT the
  browser holds), you can run many copies of this app behind a load
  balancer for high traffic; any instance can handle any request.
- Seat booking race conditions (two people booking the same seat at
  once) are prevented by the database itself via a unique index +
  the `book_seats` Postgres function — see database/schema.sql.
"""

from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS
from supabase import create_client, Client

from config import Config
from auth_utils import login_required

Config.validate()

app = Flask(__name__)
app.secret_key = Config.FLASK_SECRET_KEY
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Service-role client: full read/write access, bypasses Row Level
# Security. Only ever used server-side — this key must never reach
# the browser.
service_client: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)


# ---------------------------------------------------------------
# Page routes (server-rendered shells; the pages fetch data client
# side from the JSON API below)
# ---------------------------------------------------------------

@app.get("/")
def home():
    return render_template("index.html")


@app.get("/login")
def login_page():
    return render_template("login.html")


@app.get("/signup")
def signup_page():
    return render_template("signup.html")


@app.get("/seats")
def seats_page():
    return render_template("seats.html")


@app.get("/bookings")
def bookings_page():
    return render_template("bookings.html")


# ---------------------------------------------------------------
# Public config — hands the browser the values it needs to talk to
# Supabase Auth directly (the anon key is designed to be public;
# access is still governed by Row Level Security policies).
# ---------------------------------------------------------------

@app.get("/api/config")
def public_config():
    return jsonify({
        "supabaseUrl": Config.SUPABASE_URL,
        "supabaseAnonKey": Config.SUPABASE_ANON_KEY,
    })


# ---------------------------------------------------------------
# Routes / trips search (public — no login required to browse)
# ---------------------------------------------------------------

@app.get("/api/routes/search")
def search_trips():
    source = request.args.get("source", "").strip()
    destination = request.args.get("destination", "").strip()
    date = request.args.get("date", "").strip()

    route_query = service_client.table("routes").select("id, source, destination")
    if source:
        route_query = route_query.ilike("source", f"%{source}%")
    if destination:
        route_query = route_query.ilike("destination", f"%{destination}%")

    routes_res = route_query.execute().data
    if not routes_res:
        return jsonify({"trips": []})

    route_ids = [r["id"] for r in routes_res]
    routes_by_id = {r["id"]: r for r in routes_res}

    trip_query = (
        service_client.table("trips")
        .select("*")
        .in_("route_id", route_ids)
        .order("departure_time")
    )
    if date:
        trip_query = trip_query.gte("departure_time", f"{date}T00:00:00")
        trip_query = trip_query.lte("departure_time", f"{date}T23:59:59")

    trips = trip_query.execute().data
    if not trips:
        return jsonify({"trips": []})

    trip_ids = [t["id"] for t in trips]
    avail_res = (
        service_client.table("trip_availability")
        .select("*")
        .in_("trip_id", trip_ids)
        .execute()
        .data
    )
    availability = {row["trip_id"]: row["seats_available"] for row in avail_res}

    results = []
    for t in trips:
        route = routes_by_id.get(t["route_id"], {})
        results.append({
            **t,
            "source": route.get("source"),
            "destination": route.get("destination"),
            "seats_available": availability.get(t["id"], t["total_seats"]),
        })

    return jsonify({"trips": results})


@app.get("/api/trips/<int:trip_id>")
def get_trip(trip_id):
    trip_res = (
        service_client.table("trips")
        .select("*, routes(source, destination)")
        .eq("id", trip_id)
        .single()
        .execute()
    )
    trip = trip_res.data
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    booked_res = (
        service_client.table("bookings")
        .select("seat_number")
        .eq("trip_id", trip_id)
        .eq("status", "confirmed")
        .execute()
    )
    taken_seats = [b["seat_number"] for b in booked_res.data]

    return jsonify({"trip": trip, "taken_seats": taken_seats})


# ---------------------------------------------------------------
# Bookings (all require a logged-in user)
# ---------------------------------------------------------------

@app.post("/api/bookings")
@login_required
def create_booking():
    body = request.get_json(force=True, silent=True) or {}
    trip_id = body.get("trip_id")
    seats = body.get("seats") or []

    if not trip_id or not isinstance(seats, list) or len(seats) == 0:
        return jsonify({"error": "trip_id and at least one seat are required"}), 400

    seat_numbers = []
    passenger_names = []
    for s in seats:
        name = (s.get("passenger_name") or "").strip()
        seat_number = s.get("seat_number")
        if not name or seat_number is None:
            return jsonify({"error": "Each seat needs a seat_number and passenger_name"}), 400
        seat_numbers.append(seat_number)
        passenger_names.append(name)

    try:
        result = service_client.rpc("book_seats", {
            "p_trip_id": trip_id,
            "p_seat_numbers": seat_numbers,
            "p_passenger_names": passenger_names,
            "p_user_id": g.user_id,
        }).execute()
        return jsonify({"bookings": result.data}), 201
    except Exception as exc:
        message = str(exc)
        if "unique_confirmed_seat" in message or "duplicate key" in message:
            return jsonify({
                "error": "One or more of those seats were just booked by someone else. "
                         "Please pick different seats."
            }), 409
        return jsonify({"error": "Could not complete booking", "detail": message}), 400


@app.get("/api/bookings")
@login_required
def list_bookings():
    res = (
        service_client.table("bookings")
        .select("*, trips(*, routes(source, destination))")
        .eq("user_id", g.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify({"bookings": res.data})


@app.delete("/api/bookings/<int:booking_id>")
@login_required
def cancel_booking(booking_id):
    existing = (
        service_client.table("bookings")
        .select("id, user_id, status")
        .eq("id", booking_id)
        .single()
        .execute()
        .data
    )
    if not existing:
        return jsonify({"error": "Booking not found"}), 404
    if existing["user_id"] != g.user_id:
        return jsonify({"error": "This isn't your booking"}), 403
    if existing["status"] == "cancelled":
        return jsonify({"message": "Booking already cancelled"}), 200

    service_client.table("bookings").update({"status": "cancelled"}).eq("id", booking_id).execute()
    return jsonify({"message": "Booking cancelled"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=False)
