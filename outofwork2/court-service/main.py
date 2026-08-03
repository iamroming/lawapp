import asyncio
import json
import logging
from datetime import datetime, date
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from bharat_courts import (
    HCServicesClient,
    DistrictCourtClient,
    Judgments,
    ArchiveClient,
    SCIClient,
    get_court,
    list_high_courts,
    list_all_courts,
)
from bharat_courts.captcha.ocr import OCRCaptchaSolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("court-service")

solver = OCRCaptchaSolver()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Court service starting...")
    yield
    logger.info("Court service shutting down...")


app = FastAPI(
    title="Causly Court Service",
    description="Indian court data API for Causly legal practice management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class CaseStatusRequest(BaseModel):
    court_code: str
    case_type: str
    case_number: str
    year: str
    bench_code: str = "1"


class CaseByPartyRequest(BaseModel):
    court_code: str
    party_name: str
    year: str
    bench_code: str = "1"
    status_filter: str = "Both"


class DistrictCaseRequest(BaseModel):
    state_code: str
    dist_code: str
    court_complex_code: str
    est_code: str
    case_type: str
    case_number: str
    year: str


class JudgmentSearchRequest(BaseModel):
    text: Optional[str] = None
    judge: Optional[str] = None
    party: Optional[str] = None
    year: Optional[int] = None
    court: Optional[str] = None
    source: str = "auto"
    limit: int = 50


# ──────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "court-service", "timestamp": datetime.now().isoformat()}


# ──────────────────────────────────────────────
# Courts list
# ──────────────────────────────────────────────

@app.get("/api/courts/list")
async def list_courts():
    """List all available courts."""
    courts = list_all_courts()
    return [{"name": c.name, "code": c.code, "type": c.court_type.value} for c in courts]


@app.get("/api/courts/high-courts")
async def list_hc():
    """List all High Courts."""
    courts = list_high_courts()
    return [{"name": c.name, "code": c.code} for c in courts]


# ──────────────────────────────────────────────
# High Court case status
# ──────────────────────────────────────────────

@app.get("/api/hc/case-status")
async def hc_case_status(
    court_code: str = Query(..., description="Court code like 'delhi', 'bombay'"),
    case_type: str = Query(..., description="Numeric case type code"),
    case_number: str = Query(...),
    year: str = Query(...),
    bench_code: str = Query(default="1"),
):
    """Check case status at a High Court."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    try:
        async with HCServicesClient(captcha_solver=solver) as client:
            cases = await client.case_status(
                court,
                case_type=case_type,
                case_number=case_number,
                year=year,
                bench_code=bench_code,
            )
            return [c.to_dict(exclude_none=True) for c in cases]
    except Exception as e:
        logger.error(f"HC case status error: {e}")
        raise HTTPException(500, f"Failed to fetch case status. CAPTCHA solving may be required. Error: {str(e)}")


@app.get("/api/hc/case-status-by-party")
async def hc_case_status_by_party(
    court_code: str = Query(...),
    party_name: str = Query(...),
    year: str = Query(...),
    bench_code: str = Query(default="1"),
    status_filter: str = Query(default="Both"),
):
    """Search cases by party name at a High Court."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    try:
        async with HCServicesClient(captcha_solver=solver) as client:
            cases = await client.case_status_by_party(
                court,
                party_name=party_name,
                year=year,
                bench_code=bench_code,
                status_filter=status_filter,
            )
            return [c.to_dict(exclude_none=True) for c in cases]
    except Exception as e:
        logger.error(f"HC party search error: {e}")
        raise HTTPException(500, f"Failed to search by party. CAPTCHA solving may be required. Error: {str(e)}")


@app.get("/api/hc/orders")
async def hc_orders(
    court_code: str = Query(...),
    case_type: str = Query(...),
    case_number: str = Query(...),
    year: str = Query(...),
    bench_code: str = Query(default="1"),
):
    """Get court orders for a High Court case."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    async with HCServicesClient(captcha_solver=solver) as client:
        orders = await client.court_orders(
            court,
            case_type=case_type,
            case_number=case_number,
            year=year,
            bench_code=bench_code,
        )
        return [o.to_dict(exclude_none=True) for o in orders]


@app.get("/api/hc/cause-list")
async def hc_cause_list(
    court_code: str = Query(...),
    civil: bool = Query(default=True),
    bench_code: str = Query(default="1"),
    causelist_date: str = Query(default="", description="DD-MM-YYYY format"),
):
    """Get cause list for a High Court."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    async with HCServicesClient(captcha_solver=solver) as client:
        pdfs = await client.cause_list(
            court,
            civil=civil,
            bench_code=bench_code,
            causelist_date=causelist_date,
        )
        return [p.to_dict(exclude_none=True) for p in pdfs]


@app.get("/api/hc/benches")
async def hc_benches(court_code: str = Query(...)):
    """Get available benches for a High Court."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    async with HCServicesClient(captcha_solver=solver) as client:
        benches = await client.list_benches(court)
        return benches


@app.get("/api/hc/case-types")
async def hc_case_types(
    court_code: str = Query(...),
    bench_code: str = Query(default="1"),
):
    """Get case types for a High Court bench."""
    court = get_court(court_code)
    if not court:
        raise HTTPException(404, f"Court '{court_code}' not found")

    async with HCServicesClient(captcha_solver=solver) as client:
        types = await client.list_case_types(court, bench_code=bench_code)
        return types


@app.get("/api/hc/download-order")
async def hc_download_order(pdf_url: str = Query(...)):
    """Download an order PDF."""
    async with HCServicesClient(captcha_solver=solver) as client:
        pdf_bytes = await client.download_order_pdf(pdf_url)
        import base64
        return {"pdf_base64": base64.b64encode(pdf_bytes).decode(), "url": pdf_url}


# ──────────────────────────────────────────────
# District Court endpoints
# ──────────────────────────────────────────────

@app.get("/api/dc/states")
async def dc_states():
    """List all states for District Courts."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        states = await client.list_states()
        return states


@app.get("/api/dc/districts")
async def dc_districts(state_code: str = Query(...)):
    """List districts for a state."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        districts = await client.list_districts(state_code)
        return districts


@app.get("/api/dc/complexes")
async def dc_complexes(
    state_code: str = Query(...),
    dist_code: str = Query(...),
):
    """List court complexes for a district."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        complexes = await client.list_complexes(state_code, dist_code)
        return complexes


@app.get("/api/dc/case-status")
async def dc_case_status(
    state_code: str = Query(...),
    dist_code: str = Query(...),
    court_complex_code: str = Query(...),
    est_code: str = Query(...),
    case_type: str = Query(...),
    case_number: str = Query(...),
    year: str = Query(...),
):
    """Check case status at a District Court."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        cases = await client.case_status(
            state_code=state_code,
            dist_code=dist_code,
            court_complex_code=court_complex_code,
            est_code=est_code,
            case_type=case_type,
            case_number=case_number,
            year=year,
        )
        return [c.to_dict(exclude_none=True) for c in cases]


@app.get("/api/dc/case-status-by-party")
async def dc_case_status_by_party(
    state_code: str = Query(...),
    dist_code: str = Query(...),
    court_complex_code: str = Query(...),
    est_code: str = Query(...),
    party_name: str = Query(...),
    year: str = Query(...),
    status_filter: str = Query(default="Both"),
):
    """Search District Court cases by party name."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        cases = await client.case_status_by_party(
            state_code=state_code,
            dist_code=dist_code,
            court_complex_code=court_complex_code,
            est_code=est_code,
            party_name=party_name,
            year=year,
            status_filter=status_filter,
        )
        return [c.to_dict(exclude_none=True) for c in cases]


@app.get("/api/dc/orders")
async def dc_orders(
    state_code: str = Query(...),
    dist_code: str = Query(...),
    court_complex_code: str = Query(...),
    est_code: str = Query(...),
    case_type: str = Query(...),
    case_number: str = Query(...),
    year: str = Query(...),
):
    """Get orders for a District Court case."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        orders = await client.court_orders(
            state_code=state_code,
            dist_code=dist_code,
            court_complex_code=court_complex_code,
            est_code=est_code,
            case_type=case_type,
            case_number=case_number,
            year=year,
        )
        return [o.to_dict(exclude_none=True) for o in orders]


@app.get("/api/dc/cause-list")
async def dc_cause_list(
    state_code: str = Query(...),
    dist_code: str = Query(...),
    court_complex_code: str = Query(...),
    est_code: str = Query(default=""),
    court_no: str = Query(...),
    civil: bool = Query(default=True),
    causelist_date: str = Query(default=""),
):
    """Get cause list for a District Court."""
    async with DistrictCourtClient(captcha_solver=solver) as client:
        entries = await client.cause_list(
            state_code=state_code,
            dist_code=dist_code,
            court_complex_code=court_complex_code,
            est_code=est_code,
            court_no=court_no,
            civil=civil,
            causelist_date=causelist_date,
        )
        return [e.to_dict(exclude_none=True) for e in entries]


# ──────────────────────────────────────────────
# Judgment search (federated)
# ──────────────────────────────────────────────

@app.post("/api/judgments/search")
async def search_judgments(req: JudgmentSearchRequest):
    """Search Supreme Court recent judgments (fast, no CAPTCHA)."""
    try:
        async with SCIClient() as client:
            judgments = await client.list_recent_judgments(limit=req.limit)
            results = []
            for j in judgments:
                item = j.to_dict(exclude_none=True)
                # Filter by text/judge/party if provided
                if req.text and req.text.lower() not in (item.get("title", "") + item.get("case_number", "")).lower():
                    continue
                if req.judge and req.judge.lower() not in item.get("title", "").lower():
                    continue
                if req.party and req.party.lower() not in item.get("title", "").lower():
                    continue
                results.append(item)
            return results[:req.limit]
    except Exception as e:
        logger.error(f"Judgment search error: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


@app.get("/api/judgments/fetch-pdf")
async def fetch_judgment_pdf(
    cnr: str = Query(...),
    language: str = Query(default="english"),
):
    """Fetch a judgment PDF by CNR number."""
    try:
        async with ArchiveClient() as client:
            pdf_bytes = await client.fetch_pdf(cnr, language=language)
            import base64
            return {"pdf_base64": base64.b64encode(pdf_bytes).decode(), "cnr": cnr}
    except Exception as e:
        logger.error(f"PDF fetch error: {e}")
        raise HTTPException(500, f"Failed to fetch PDF: {str(e)}")


# ──────────────────────────────────────────────
# Supreme Court
# ──────────────────────────────────────────────

@app.get("/api/sc/recent-judgments")
async def sc_recent(limit: int = Query(default=10, le=50)):
    """Get recent Supreme Court judgments."""
    async with SCIClient() as client:
        judgments = await client.list_recent_judgments(limit=limit)
        return [j.to_dict(exclude_none=True) for j in judgments]


@app.get("/api/sc/download-pdf")
async def sc_download_pdf(diary_no: str = Query(...)):
    """Download a Supreme Court judgment PDF."""
    async with SCIClient() as client:
        from bharat_courts.models import JudgmentResult
        judgment = JudgmentResult(title="", court_name="Supreme Court", source_id=diary_no)
        await client.download_pdf(judgment)
        if judgment.pdf_bytes:
            import base64
            return {"pdf_base64": base64.b64encode(judgment.pdf_bytes).decode(), "diary_no": diary_no}
        raise HTTPException(500, "Failed to download PDF")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
