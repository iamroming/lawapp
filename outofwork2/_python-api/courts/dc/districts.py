"""Vercel serverless function - DC Districts by State (static data)."""
import json
import os
from http.server import BaseHTTPRequestHandler

# Load static court data
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
            if not state_code:
                self._json_response({"error": "Missing state_code"}, 400)
                return

            state_data = COURT_DATA.get(state_code, {})
            districts = state_data.get("districts", {})
            result = [{"district_code": k, "district_name": v} for k, v in districts.items()]
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
