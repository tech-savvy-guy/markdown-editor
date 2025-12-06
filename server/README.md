# Markdown to Word / PDF Conversion API | Microservice

FastAPI-based microservice that uses Pandoc to convert Markdown to:

- `.md`
- `.docx`
- `.pdf` (via LaTeX)

Designed to be used by a frontend (e.g. Next.js on Vercel).

## Endpoints

### `GET /health`

Simple health check.

### `POST /convert`

**Request body (JSON):**

```json
{
  "markdown": "# Hello\nThis is *markdown*.",
  "format": "pdf"
}
