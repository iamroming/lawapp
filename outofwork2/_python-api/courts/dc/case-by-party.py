"""Vercel serverless function - DC Case by Party."""
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
            from bharat_courts import DistrictCourtClient
            from bharat_courts.captcha.ocr import OCRCaptchaSolver
            from urllib.parse import urlparse, parse_qs

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            state_code = params.get("state_code", [None])[0]
            district_code = params.get("district_code", [None])[0]
            court_complex_code = params.get("court_complex_code", [None])[0]
            party_name = params.get("party_name", [None])[0]
            year = params.get("year", [None])[0]

            if not all([state_code, district_code, court_complex_code, party_name]):
                self._json_response({"error": "Missing required params"}, 400)
                return

            solver = OCRCaptchaSolver()
            async with DistrictCourtClient(captcha_solver=solver) as client:
                cases = await client.case_status_by_party(
                    state_code=state_code,
                    dist_code=district_code,
                    court_complex_code=court_complex_code,
                    party_name=party_name,
                    year=year or str(__import__("datetime").date.today().year),
                )
                self._json_response([c.to_dict(exclude_none=True) if hasattr(c, 'to_dict') else c for c in cases])

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
