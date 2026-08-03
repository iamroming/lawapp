"""Vercel serverless function - DC Court Complexes by District (static data)."""
import json
import os
from http.server import BaseHTTPRequestHandler

_DATA_PATH = os.path.join(os.path.dirname(__file__), "court-data.json")
with open(_DATA_PATH) as _f:
    COURT_DATA = json.load(_f)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            state_code = params.get("state_code", [None])[0]
            district_code = params.get("district_code", [None])[0]
            if not district_code:
                self._json_response({"error": "Missing district_code"}, 400)
                return

            # Try state-specific complexes, then fallback to default
            state_data = COURT_DATA.get(state_code, {})
            all_complexes = state_data.get("complexes", {})
            district_complexes = all_complexes.get(district_code, [])

            if not district_complexes:
                # Fallback: use district name as the court complex
                districts = state_data.get("districts", {})
                district_name = districts.get(district_code, f"District {district_code}")
                district_complexes = [f"{district_name} District Court"]

            result = [
                {"court_complex_code": str(i + 1), "court_complex_name": name}
                for i, name in enumerate(district_complexes)
            ]
            self._json_response(result)

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
