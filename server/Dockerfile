FROM python:3.12-slim

# Install pandoc + LaTeX environment
RUN apt-get update && \
    apt-get install -y \
        pandoc \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-fonts-recommended \
        texlive-fonts-extra \
        texlive-xetex \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app

EXPOSE 8000

# Uvicorn entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
