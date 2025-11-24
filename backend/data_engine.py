import pandas as pd
from typing import Any, List, Dict, Union

class DataExtractor:
    def __init__(self):
        pass

    def load_data(self, file_path: str) -> Union[pd.DataFrame, List[str]]:
        """
        Loads data from CSV, Excel, or PDF.
        Returns a DataFrame for structured data or a list of strings for text.
        """
        if file_path.endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            return pd.read_excel(file_path)
        elif file_path.endswith('.pdf'):
            return self._extract_text_from_pdf(file_path)
        else:
            raise ValueError("Unsupported file format")

    def _extract_text_from_pdf(self, file_path: str) -> List[str]:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = []
        for page in reader.pages:
            text.append(page.extract_text())
        return text
