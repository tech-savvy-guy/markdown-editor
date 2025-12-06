# app/models.py
from enum import Enum

from pydantic import BaseModel


class OutputFormat(str, Enum):
    md = "md"
    docx = "docx"
    pdf = "pdf"


class ConvertRequest(BaseModel):
    markdown: str
    format: OutputFormat
