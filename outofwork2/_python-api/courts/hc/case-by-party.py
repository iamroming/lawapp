"""Vercel serverless function - HC Case Status by Party."""
import json
from http.server import BaseHTTPRequestHandler
import asyncio


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        asyncio.run(self._handle())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    async def _handle(self):
        try:
            from bharat_courts import HCServicesClient, get_court
            from bharat_courts.captcha.ocr import OCRCaptchaSolver
            from urllib.parse import urlparse, parse_qs

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            court_code = params.get("court_code", [None])[0]
            party_name = params.get("party_name", [None])[0]
            year = params.get("year", [None])[0]
            bench_code = params.get("bench_code", ["1"])[0]
            status_filter = params.get("status_filter", ["Both"])[0]

            if not all([court_code, party_name]):
                self._json_response({"error": "Missing court_code or party_name"}, 400)
                return

            court = get_court(court_code)
            if not court:
                self._json_response({"error": f"Court '{court_code}' not found"}, 404)
                return

            solver = OCRCaptchaSolver()
            async with HCServicesClient(captcha_solver=solver) as client:
                cases = await client.case_status_by_party(
                    court,
                    party_name=party_name,
                    year=year or str(__import__("datetime").date.today().year),
                    bench_code=bench_code,
                    status_filter=status_filter,
                )
                self._json_response([c.to_dict(exclude_none=True) for c in cases])

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
