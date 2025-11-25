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
            return self._load_with_header_detection(file_path, 'csv')
        elif file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            return self._load_with_header_detection(file_path, 'excel')
        elif file_path.endswith('.pdf'):
            # Try to extract table first, fallback to text if no table found
            try:
                return self._extract_table_from_pdf(file_path)
            except Exception as e:
                print(f"PDF Table extraction failed: {e}, falling back to text")
                return self._extract_text_from_pdf(file_path)
        else:
            raise ValueError("Unsupported file format")

    def _load_with_header_detection(self, file_path: str, file_type: str) -> pd.DataFrame:
        """
        Intelligently detects the header row by analyzing the first few rows.
        Skips title/heading rows and finds the actual table headers.
        """
        # Read first 10 rows without headers to analyze
        if file_type == 'csv':
            # Use python engine and names to handle variable column counts (titles)
            try:
                # Try reading with a generous number of columns to capture everything
                sample_df = pd.read_csv(file_path, header=None, nrows=10, names=range(50), engine='python')
                # Drop columns that are all NaN
                sample_df = sample_df.dropna(axis=1, how='all')
            except Exception:
                # Fallback: read as single column
                sample_df = pd.read_csv(file_path, header=None, nrows=10, engine='python')
        else:  # excel
            sample_df = pd.read_excel(file_path, header=None, nrows=10)
        
        header_row = self._detect_header_row(sample_df)
        
        # Now read the full file with the detected header row
        if file_type == 'csv':
            return pd.read_csv(file_path, header=header_row)
        else:  # excel
            return pd.read_excel(file_path, header=header_row)

    def _extract_table_from_pdf(self, file_path: str) -> pd.DataFrame:
        """
        Extracts the largest table found in the PDF and converts it to a DataFrame
        with smart header detection.
        """
        import pdfplumber
        
        all_rows = []
        
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Extract table from page
                table = page.extract_table()
                if table:
                    # Filter out empty rows
                    clean_table = [row for row in table if any(cell is not None and str(cell).strip() != "" for cell in row)]
                    all_rows.extend(clean_table)
        
        if not all_rows:
            raise ValueError("No tables found in PDF")
            
        # Create initial DataFrame without headers
        df = pd.DataFrame(all_rows)
        
        # Detect header row
        header_idx = self._detect_header_row(df)
        
        # Set headers and slice data
        headers = df.iloc[header_idx]
        # Handle duplicate columns if any
        headers = [f"{col}_{i}" if list(headers).count(col) > 1 else col for i, col in enumerate(headers)]
        
        new_df = df.iloc[header_idx+1:].reset_index(drop=True)
        new_df.columns = headers
        
        return new_df
    
    def _detect_header_row(self, df: pd.DataFrame) -> int:
        """
        Detects which row contains the actual column headers.
        
        Logic:
        1. Look for a row where most cells are non-numeric strings
        2. The row after should have mostly numeric/consistent data types
        3. Skip rows with single merged cells (titles)
        """
        for idx in range(min(5, len(df))):  # Check first 5 rows max
            row = df.iloc[idx]
            
            # Skip if row has too many empty cells (likely a title row)
            non_empty = row.notna().sum()
            if non_empty <= 1:
                continue
            
            # Check if this looks like a header row
            if self._is_likely_header(row):
                # Verify next row has data (not another header)
                if idx + 1 < len(df):
                    next_row = df.iloc[idx + 1]
                    if self._is_likely_data(next_row):
                        return idx
        
        # Default to first row if no clear header detected
        return 0
    
    def _is_likely_header(self, row: pd.Series) -> bool:
        """
        Checks if a row looks like column headers.
        Headers typically have:
        - Mostly string values
        - Short text (not paragraphs)
        - Few or no numeric values
        """
        non_empty = row.notna()
        if non_empty.sum() == 0:
            return False
        
        # Check if values are mostly strings and short
        string_count = 0
        for val in row[non_empty]:
            if isinstance(val, str):
                # Headers are usually short (< 50 chars)
                if len(str(val).strip()) < 50 and len(str(val).strip()) > 0:
                    string_count += 1
        
        # At least 60% should be short strings
        return string_count / non_empty.sum() >= 0.6
    
    def _is_likely_data(self, row: pd.Series) -> bool:
        """
        Checks if a row looks like actual data.
        Data rows typically have:
        - Mix of data types or mostly numeric
        - More varied content than headers
        """
        non_empty = row.notna()
        if non_empty.sum() == 0:
            return False
        
        # Data rows often have numbers or varied content
        numeric_count = 0
        for val in row[non_empty]:
            if isinstance(val, (int, float)) or (isinstance(val, str) and val.replace('.', '').replace('-', '').isdigit()):
                numeric_count += 1
        
        # If at least 30% numeric, likely data
        return numeric_count / non_empty.sum() >= 0.3

    def _extract_text_from_pdf(self, file_path: str) -> List[str]:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = []
        for page in reader.pages:
            text.append(page.extract_text())
        return text
