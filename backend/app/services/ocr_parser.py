import os
from typing import Optional
import fitz # PyMuPDF

class DocumentParserService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        Extract raw text from PDF using PyMuPDF (fitz) with clean formatting.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")
            
        full_text = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                if text.strip():
                    full_text.append(f"--- Page {page_num + 1} ---\n" + text.strip())
            doc.close()
        except Exception as e:
            # Fallback to pypdf if fitz encounters file specifics
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for idx, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text:
                        full_text.append(f"--- Page {idx + 1} ---\n" + text.strip())
            except Exception as inner_e:
                raise RuntimeError(f"Failed to extract PDF text: {str(e)} / {str(inner_e)}")

        return "\n\n".join(full_text)

    @staticmethod
    def extract_text_from_bytes(content: bytes, filename: str) -> str:
        """Extract text directly from in-memory bytes."""
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            full_text = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                if text.strip():
                    full_text.append(f"--- Page {page_num + 1} ---\n" + text.strip())
            doc.close()
            return "\n\n".join(full_text)
        except Exception:
            # If plain text file or markdown
            try:
                return content.decode("utf-8")
            except Exception as e:
                raise RuntimeError(f"Could not decode document bytes: {e}")
