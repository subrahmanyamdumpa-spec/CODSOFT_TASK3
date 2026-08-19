"""
Authentication helpers.

Users sign up / log in with email + password directly against
Supabase Auth from the browser (see static/js/auth.js). Supabase
issues a JWT access token for the session. The frontend attaches
that token to every API call as:

    Authorization: Bearer <token>

This module verifies that token on the Flask side so API routes
know *which* user is making the request, without the backend ever
having to see the user's password.
"""

from functools import wraps

import jwt
from jwt import PyJWKClient
from flask import request, jsonify, g

from config import Config

# Supabase projects sign auth tokens one of two ways:
#   - Legacy: a shared secret you hold, algorithm HS256
#   - Newer projects (or after migrating): asymmetric keys, algorithm
#     ES256, verified against the project's public JWKS endpoint
# We detect which one a given token uses and verify it the matching
# way, so this works regardless of which system your project is on.
_jwks_client = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{Config.SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwks_client


def decode_supabase_jwt(token: str) -> dict:
    """Verify and decode a Supabase Auth access token (HS256 or ES256)."""
    header = jwt.get_unverified_header(token)
    alg = header.get("alg")

    if alg == "HS256":
        return jwt.decode(
            token,
            Config.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )

    # ES256 / asymmetric — verify against the project's JWKS
    signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=[alg],
        audience="authenticated",
    )


def get_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def login_required(fn):
    """
    Route decorator. Verifies the Supabase access token and stashes
    the caller's user id / email on flask.g for the view to use.
    Returns 401 if the token is missing, expired, or invalid.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        if not token:
            return jsonify({"error": "Missing Authorization header"}), 401

        try:
            payload = decode_supabase_jwt(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        g.user_id = payload.get("sub")
        g.user_email = payload.get("email")

        if not g.user_id:
            return jsonify({"error": "Token missing user id"}), 401

        return fn(*args, **kwargs)

    return wrapper
