"""Vercel serverless function - HC Cause List."""
import json
from http.server import BaseHTTPRequestHandler
import asyncio


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        asyncio.run(self._handle())

    async def _handle(self):
        try:
            from bharat_courts import HCServicesClient, get_court
            from bharat_courts.captcha.ocr import OCRCaptchaSolver
            from urllib.parse import urlparse, parse_qs

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            court_code = params.get("court_code", [None])[0]
            civil = params.get("civil", ["true"])[0].lower() == "true"
            bench_code = params.get("bench_code", ["1"])[0]
            causelist_date = params.get("causelist_date", [""])[0]

            if not court_code:
                self._json_response({"error": "Missing court_code"}, 400)
                return

            court = get_court(court_code)
            if not court:
                self._json_response({"error": f"Court '{court_code}' not found"}, 404)
                return

            solver = OCRCaptchaSolver()
            async with HCServicesClient(captcha_solver=solver) as client:
                pdfs = await client.cause_list(
                    court,
                    civil=civil,
                    bench_code=bench_code,
                    causelist_date=causelist_date,
                )
                self._json_response([p.to_dict(exclude_none=True) for p in pdfs])

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
