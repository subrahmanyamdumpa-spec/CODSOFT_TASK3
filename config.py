"""
Central configuration for the Bus Ticket Reservation System.

All secrets are read from environment variables (loaded from a local
.env file via python-dotenv during development; on a real cloud host
— Render, Railway, Fly.io, Heroku, etc — you set these as dashboard
environment variables instead of shipping a .env file).
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

    FLASK_SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "dev-key-change-me")
    PORT = int(os.environ.get("PORT", 5000))

    @classmethod
    def validate(cls):
        missing = [
            name for name in (
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "SUPABASE_SERVICE_ROLE_KEY",
                "SUPABASE_JWT_SECRET",
            )
            if not getattr(cls, name)
        ]
        if missing:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing)}. "
                f"Copy .env.example to .env and fill them in."
            )
