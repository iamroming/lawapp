"""Vercel serverless function - Supreme Court Recent Judgments."""
import json
from http.server import BaseHTTPRequestHandler
import asyncio


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        asyncio.run(self._handle())

    async def _handle(self):
        try:
            from bharat_courts import SCIClient
            from urllib.parse import urlparse, parse_qs

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            limit = int(params.get("limit", ["10"])[0])

            async with SCIClient() as client:
                judgments = await client.list_recent_judgments(limit=limit)
                self._json_response([j.to_dict(exclude_none=True) for j in judgments])

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
