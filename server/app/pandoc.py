# app/pandoc.py
import subprocess

from .models import OutputFormat


class PandocError(Exception):
    pass


def convert_markdown(markdown: str, fmt: OutputFormat) -> bytes:
    """
    Run pandoc to convert markdown to the requested format.
    Returns raw bytes of the output file.
    """
    target = fmt.value

    # Build pandoc arguments
    args = [
        "pandoc",
        "-f", "markdown",
        "-t", "markdown" if target == "md" else target,
        "-o", "-",  # write to stdout
    ]

    try:
        proc = subprocess.run(
            args,
            input=markdown.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    except Exception as e:
        raise PandocError(f"Failed to run pandoc: {e}")

    if proc.returncode != 0:
        error_msg = proc.stderr.decode("utf-8", errors="ignore")
        raise PandocError(f"Pandoc error (code {proc.returncode}): {error_msg}")

    return proc.stdout
