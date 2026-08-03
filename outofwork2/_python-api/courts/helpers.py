"""Shared court service helpers for Vercel serverless functions."""
import json
import logging
from http.server import BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("court-service")


def json_response(handler: BaseHTTPRequestHandler, data: dict | list, status: int = 200):
    """Send JSON response from a Vercel serverless function."""
    handler.response_status = status
    handler.response_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    handler.response_body = json.dumps(data, default=str)


def json_error(handler: BaseHTTPRequestHandler, message: str, status: int = 500):
    """Send JSON error response."""
    json_response(handler, {"error": message}, status)


async def get_hc_client():
    """Get High Court client with CAPTCHA solver."""
    from bharat_courts import HCServicesClient
    from bharat_courts.captcha.ocr import OCRCaptchaSolver
    solver = OCRCaptchaSolver()
    return HCServicesClient(captcha_solver=solver)


async def get_dc_client():
    """Get District Court client with CAPTCHA solver."""
    from bharat_courts import DistrictCourtClient
    from bharat_courts.captcha.ocr import OCRCaptchaSolver
    solver = OCRCaptchaSolver()
    return DistrictCourtClient(captcha_solver=solver)
