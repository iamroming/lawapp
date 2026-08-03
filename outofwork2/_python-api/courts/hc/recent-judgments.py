"""Vercel serverless function - HC Recent Judgments (via court_orders as fallback)."""
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

            court_code = params.get("court_code", ["delhi"])[0]
            limit = int(params.get("limit", ["10"])[0])

            court = get_court(court_code)
            if not court:
                self._json_response({"error": f"Court '{court_code}' not found"}, 404)
                return

            solver = OCRCaptchaSolver()
            async with HCServicesClient(captcha_solver=solver) as client:
                # Use court_orders as the closest available API to recent judgments
                import datetime
                today = datetime.date.today()
                orders = await client.court_orders(
                    court,
                    from_date=(today - datetime.timedelta(days=30)).strftime("%d-%m-%Y"),
                    to_date=today.strftime("%d-%m-%Y"),
                )
                results = []
                for o in (orders or [])[:limit]:
                    d = o.to_dict(exclude_none=True) if hasattr(o, "to_dict") else dict(o) if hasattr(o, "keys") else {}
                    results.append({
                        "title": d.get("title") or d.get("order_title") or d.get("case_number") or "Court Order",
                        "court": d.get("court_name") or court_code.upper(),
                        "date": d.get("date") or d.get("order_date") or str(today),
                        "citation": d.get("citation"),
                        "pdf_url": d.get("pdf_url") or d.get("order_pdf_url"),
                        "source_url": d.get("source_url"),
                    })
                self._json_response({"results": results})

        except Exception as e:
            self._json_response({"error": str(e), "results": []})

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
