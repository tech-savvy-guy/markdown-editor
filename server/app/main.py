# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .config import get_settings
from .models import ConvertRequest, OutputFormat
from .pandoc import convert_markdown, PandocError

settings = get_settings()

app = FastAPI(
    title="Markdown Converter Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS middleware: allow your Vercel app(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],  # you can tighten this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """
    Simple health check endpoint for Railway / monitoring.
    """
    return {"status": "ok"}


@app.post("/convert")
async def convert(req: ConvertRequest):
    """
    Convert markdown to one of: md, docx, pdf.
    Returns file as binary with proper Content-Type & Content-Disposition.
    """
    try:
        output_bytes = convert_markdown(req.markdown, req.format)
    except PandocError as e:
        raise HTTPException(status_code=500, detail=str(e))

    fmt = req.format
    if fmt == OutputFormat.pdf:
        content_type = "application/pdf"
    elif fmt == OutputFormat.docx:
        content_type = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    else:
        content_type = "text/markdown; charset=utf-8"

    headers = {
        "Content-Disposition": f'attachment; filename="export.{fmt.value}"'
    }

    return Response(content=output_bytes, media_type=content_type, headers=headers)
