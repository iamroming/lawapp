"""Vercel serverless function - Download Order PDF."""
import json
import base64
from http.server import BaseHTTPRequestHandler
import asyncio


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        asyncio.run(self._handle())

    async def _handle(self):
        try:
            from bharat_courts import HCServicesClient
            from bharat_courts.captcha.ocr import OCRCaptchaSolver
            from urllib.parse import urlparse, parse_qs

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            pdf_url = params.get("pdf_url", [None])[0]

            if not pdf_url:
                self._json_response({"error": "Missing pdf_url"}, 400)
                return

            solver = OCRCaptchaSolver()
            async with HCServicesClient(captcha_solver=solver) as client:
                pdf_bytes = await client.download_order_pdf(pdf_url)
                self._json_response({
                    "pdf_base64": base64.b64encode(pdf_bytes).decode(),
                    "url": pdf_url,
                })

        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
