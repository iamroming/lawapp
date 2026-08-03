"""Vercel serverless function - Judgment Search (Supreme Court recent)."""
import json
from http.server import BaseHTTPRequestHandler
import asyncio


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        asyncio.run(self._handle())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    async def _handle(self):
        try:
            from bharat_courts import SCIClient

            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}

            limit = body.get("limit", 50)
            text = body.get("text", "").lower() if body.get("text") else None
            judge = body.get("judge", "").lower() if body.get("judge") else None
            party = body.get("party", "").lower() if body.get("party") else None

            async with SCIClient() as client:
                judgments = await client.list_recent_judgments(limit=min(limit * 3, 150))
                results = []
                for j in judgments:
                    item = j.to_dict(exclude_none=True)
                    title = (item.get("title", "") + item.get("case_number", "")).lower()
                    if text and text not in title:
                        continue
                    if judge and judge not in title:
                        continue
                    if party and party not in title:
                        continue
                    results.append(item)
                    if len(results) >= limit:
                        break

            self._json_response(results)

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
