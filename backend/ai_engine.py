import os
import openai
import pandas as pd
import json
from typing import List, Dict, Any, Union, Optional
import re
from dotenv import load_dotenv

load_dotenv()

def safe_exec_pandas(df: pd.DataFrame, code: str) -> pd.DataFrame:
    """
    Executes AI-generated pandas code safely in a restricted environment.
    """
    if not code or not code.strip():
        return df

    # Remove markdown code blocks if present
    code = re.sub(r'^```python\n|```$', '', code.strip(), flags=re.MULTILINE).strip()
    
    restricted_globals = {
        "__builtins__": {
            "range": range, "len": len, "float": float, "int": int,
            "str": str, "list": list, "dict": dict, "set": set,
            "abs": abs, "min": min, "max": max, "sum": sum, "round": round,
            "bool": bool
        },
        "pd": pd,
        "df": df
    }
    
    forbidden = ["import ", "exec", "eval", "open(", "__", "os.", "sys."]
    for word in forbidden:
        if word in code:
            raise ValueError(f"Dangerous operation detected: {word}")

    try:
        exec(code, restricted_globals, {})
    except Exception as e:
        print(f"Failed to execute pandas code: {e}")
        pass
    
    return df

class AIGroupingAgent:
    def __init__(self):
        self.current_key_index = 0
        self.client = None
        self.api_keys = []
        self.provider = "openrouter"
        self.model = "openai/gpt-4o-mini"
        self.base_url = "https://openrouter.ai/api/v1"
        self._load_keys()
        self._initialize_client()

    def _load_keys(self):
        """Reloads active AI provider configuration from database or env variables."""
        load_dotenv(override=True)
        
        # Check database for active AIConfig
        try:
            from database import SessionLocal, AIConfig
            db = SessionLocal()
            active_cfg = db.query(AIConfig).filter(AIConfig.is_active == True).first()
            if active_cfg and active_cfg.api_key:
                # Get all active keys for this provider
                all_active = db.query(AIConfig).filter(AIConfig.provider == active_cfg.provider, AIConfig.is_active == True, AIConfig.is_working == True).all()
                self.provider = active_cfg.provider
                self.model = active_cfg.model or "gpt-4o-mini"
                self.base_url = active_cfg.base_url or "https://api.openai.com/v1"
                self.api_keys = [cfg.api_key.strip() for cfg in all_active if cfg.api_key]
                if not self.api_keys:
                    self.api_keys = [active_cfg.api_key.strip()]
                self.current_key_index = 0
                db.close()
                print(f"✓ Loaded active AI Provider '{self.provider}' (Model: {self.model}) with {len(self.api_keys)} keys from Database")
                return
            db.close()
        except Exception as e:
            print("Note checking database for AI config:", e)

        # Fallback to Environment Variables
        found_keys = []
        
        # 1. Check for Gemini
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            self.provider = "gemini"
            self.model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            self.api_keys = [gemini_key.strip()]
            return

        # 2. Check for OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.provider = "openai"
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            self.base_url = "https://api.openai.com/v1"
            self.api_keys = [openai_key.strip()]
            return

        # 3. Check for GitHub Models
        github_token = os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_MODELS_KEY")
        if github_token:
            self.provider = "github"
            self.model = os.getenv("GITHUB_MODEL", "gpt-4o-mini")
            self.base_url = "https://models.inference.ai.azure.com"
            self.api_keys = [github_token.strip()]
            return

        # 4. Check OpenRouter
        self.provider = "openrouter"
        self.model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        self.base_url = "https://openrouter.ai/api/v1"
        
        keys_str = os.getenv("OPENROUTER_API_KEYS") or os.getenv("OPENROUTER_API_KEY")
        if keys_str:
            keys_str = keys_str.replace('\n', ',')
            found_keys.extend([k.strip() for k in keys_str.split(',') if k.strip()])

        for i in range(1, 21):
            key = os.getenv(f"OPENROUTER_API_KEY_{i}")
            if key:
                found_keys.append(key.strip())
        
        self.api_keys = list(dict.fromkeys(found_keys))
        
        if not self.api_keys:
            print("WARNING: No AI API keys found. Please configure in the Admin panel.")
        else:
            print(f"✓ Reloaded {len(self.api_keys)} API key(s) for provider: {self.provider}")
            
        if self.api_keys and self.current_key_index >= len(self.api_keys):
            self.current_key_index = 0

    def _initialize_client(self):
        """Initializes the OpenAI client with the current key and base URL."""
        if not self.api_keys:
            self.client = None
            return
            
        current_key = self.api_keys[self.current_key_index]
        print(f"Initializing AI Agent ({self.provider}) with key index {self.current_key_index} (starts with {current_key[:4]}...)")
        
        self.client = openai.OpenAI(
            base_url=self.base_url,
            api_key=current_key,
        )

    def _rotate_key(self) -> bool:
        """Rotates to the next available API key if multiple exist."""
        if not self.api_keys or len(self.api_keys) <= 1:
            return False
            
        old_index = self.current_key_index
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._initialize_client()
        print(f"🔄 Rotated from key {old_index} to key {self.current_key_index}")
        return True

    @staticmethod
    def test_connection(provider: str, api_key: str, model: str, base_url: Optional[str] = None) -> Dict[str, Any]:
        """Tests an AI provider configuration with a test completion."""
        try:
            target_url = base_url
            if not target_url:
                if provider == "gemini":
                    target_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
                elif provider == "github":
                    target_url = "https://models.inference.ai.azure.com"
                elif provider == "openai":
                    target_url = "https://api.openai.com/v1"
                else:
                    target_url = "https://openrouter.ai/api/v1"

            test_client = openai.OpenAI(base_url=target_url, api_key=api_key)
            test_response = test_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": "Respond with JSON: {\"status\": \"ok\", \"provider\": \"" + provider + "\"}"}
                ],
                max_tokens=50
            )
            content = test_response.choices[0].message.content
            return {
                "success": True,
                "message": f"Successfully connected to {provider.upper()} ({model})!",
                "response_sample": content
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def answer_file_question(self, data: Union[pd.DataFrame, List[str]], user_prompt: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Answers analytical and contextual questions about an uploaded file using the active AI provider.
        """
        self._load_keys()

        # Build detailed data context
        if isinstance(data, pd.DataFrame):
            total_rows = len(data)
            columns = [str(c) for c in data.columns]
            
            # Numeric summaries
            desc = ""
            try:
                numeric_df = data.select_dtypes(include=['number'])
                if not numeric_df.empty:
                    desc = f"\nNumeric Summary:\n{numeric_df.describe().round(2).to_string()}\n"
            except Exception:
                pass

            # Top sample rows
            sample_records = data.head(15).fillna("").to_dict(orient="records")
            data_context = f"""
Dataset Overview:
- Total rows/students: {total_rows}
- Columns ({len(columns)}): {', '.join(columns)}
{desc}
Sample First 15 Records:
{json.dumps(sample_records, default=str, indent=2)}
"""
        else:
            text_preview = "\n".join(data[:40]) if isinstance(data, list) else str(data)[:2000]
            data_context = f"Document Text Sample:\n{text_preview}"

        system_prompt = """You are SortifyAI's Intelligent Roster & Data Assistant.
You have direct access to the user's uploaded dataset/file.
Your goal is to answer questions about the file accurately, concisely, and helpfully.

Formatting Guidelines:
- Use clean Markdown with bolding, lists, and tables when displaying data.
- When computing counts, averages, or top/bottom items, refer directly to the dataset context provided.
- If asked to summarize the file, provide key metrics: total headcount, notable columns, and high-level distribution.
- If the user asks you to group or sort the file, let them know you can do that and provide suggested grouping parameters.
- Be direct, professional, and clear.
"""

        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for msg in conversation_history[-6:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        user_content = f"{data_context}\n\nUser Question about this file:\n{user_prompt}"
        messages.append({"role": "user", "content": user_content})

        if not self.api_keys or not self.client:
            # Helpful algorithmic fallback when no API key is yet configured
            if isinstance(data, pd.DataFrame):
                return f"### File Overview\n\n• **Total Records**: {len(data)} rows\n• **Columns Detected**: {', '.join([f'`{c}`' for c in data.columns])}\n\n*Note: To unlock deep conversational AI reasoning, please configure your API key (Gemini, OpenAI, or GitHub Models) in the Admin panel at `/#admin`.*"
            return "File received. Please configure an AI key in the Admin panel to enable natural language questioning."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error answering question: {e}")
            if self._rotate_key():
                try:
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        max_tokens=1000,
                        temperature=0.3
                    )
                    return response.choices[0].message.content
                except Exception as e2:
                    return f"Sorry, could not answer your question: {str(e2)}"
            return f"Encountered an issue processing your request: {str(e)}"

    def analyze_structure(self, data: Union[pd.DataFrame, List[str]]) -> str:
        """
        Analyzes the data structure to understand columns and content.
        Returns a string summary.
        """
        if isinstance(data, pd.DataFrame):
            # Get types for better context
            dtypes = {col: str(dtype) for col, dtype in data.dtypes.items()}
            
            # Create a truncated sample (3 rows only)
            sample_df = data.head(3).copy()
            
            # Truncate long strings in sample to save tokens
            for col in sample_df.select_dtypes(include=['object']):
                sample_df[col] = sample_df[col].apply(
                    lambda x: (str(x)[:100] + '...') if isinstance(x, str) and len(str(x)) > 100 else x
                )
            
            sample = sample_df.to_string()
            total_rows = len(data)
            return f"ROWS: {total_rows}\nCOLS: {dtypes}\nSAMPLE (3 rows):\n{sample}"
        else:
            # For text data (PDF)
            return f"Text Data Sample: {data[:500]}..."

    def interpret_instructions(self, data_summary: str, user_prompt: str) -> str:
        """
        Converts natural language instructions into grouping RULES.
        Returns a JSON string with rules, not actual data.
        """
        system_prompt = """
        You are an AI data engineer. Analyze user instructions and return an action plan in JSON.
        If the user asks to compute formulas, normalize data, handle missing values, or create new columns, 
        write valid Python (pandas) code in the `pandas_code` field assuming a dataframe named `df`.
        If the user asks to balance, evenly distribute, or snake-draft into a specific number of groups based on a score, 
        use the `optimization` field instead of manual rules.
        
        JSON STRUCTURE:
        {
            "report_title": "Descriptive Title for Export",
            "pandas_code": "df['Overall Score'] = (df['English'] + df['Math'])/2\ndf['Math'].fillna(0, inplace=True)",
            "optimization": {
                "use_optimization": true,
                "num_groups": 5,
                "balance_columns": ["Overall Score"],
                "group_names": ["Class A", "Class B"] 
            },
            "groups": [
                {
                    "name": "Group Name",
                    "description": "Used only if optimization is false",
                    "rules": { "col_name": {"operator": value} },
                    "is_catchall": false
                }
            ],
            "explanation": "What you did"
        }
        
        RULES:
        - `pandas_code`: MUST be valid python for a pandas DataFrame `df`. Can be multiline or empty string. DO NOT use import.
        - `optimization`: Set `use_optimization: true` if the user wants strictly equal group sizes balanced by a numeric metric.
        - `groups`: Legacy fallback. Only required if `use_optimization` is false.
        - Operators for groups: ">=", ">", "<=", "<", "==", "!="
        """

        user_message = f"""
        Data Summary:
        {data_summary}

        User Instructions:
        {user_prompt}
        
        Return the GROUPING RULES (not the actual data). The backend will apply these rules to all rows.
        """

        # Reload keys dynamically to pick up any changes
        self._load_keys()

        if not self.api_keys or not self.client:
            error_response = {
                "error": "No API keys configured",
                "groups": [],
                "explanation": "No OpenRouter API key found. Please configure OPENROUTER_API_KEYS in your environment."
            }
            print("❌ No API key available for interpret_instructions")
            return json.dumps(error_response)

        # Track which keys we've tried to avoid retrying the same key
        tried_keys = set()
        max_retries = len(self.api_keys) if self.api_keys else 1
        
        print(f"🔑 Starting API request with {max_retries} key(s) available")
        
        for attempt in range(max_retries):
            current_key_id = self.current_key_index
            
            # Check if we've already tried this key
            if current_key_id in tried_keys:
                print(f"⚠️ Key {current_key_id} already tried, rotating...")
                if not self._rotate_key():
                    break
                current_key_id = self.current_key_index
            
            # Mark this key as tried
            tried_keys.add(current_key_id)
            
            try:
                print(f"📡 Attempt {attempt + 1}/{max_retries} using key {current_key_id}")
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=1000  # Reduced from 1500 to save tokens
                )
                print(f"✅ Successfully generated rules using key {current_key_id}")
                return response.choices[0].message.content
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error with key {current_key_id}: {error_msg[:100]}...")
                
                # If we have more attempts left, rotate to the next key
                if attempt < max_retries - 1:
                    print(f"🔄 Trying next API key...")
                    if not self._rotate_key():
                        print("⚠️ No more keys to rotate to")
                        break
                else:
                    print(f"❌ All {max_retries} key(s) exhausted")
        
        # If we get here, all keys failed
        error_response = {
            "error": "All API keys exhausted or failed",
            "groups": [],
            "explanation": f"Failed to generate rules after trying all {len(tried_keys)} available key(s)."
        }
        print(f"💥 Returning error response after trying {len(tried_keys)} key(s)")
        return json.dumps(error_response)

    @staticmethod
    def _safe_compare(value: Any, operator: str, threshold: Any) -> bool:
        """Safely compares values across types (e.g. numeric strings, integers, floats, text)."""
        if value is None or pd.isna(value):
            return False

        # Attempt numeric comparison first
        try:
            clean_val = str(value).replace(',', '').replace('$', '').strip()
            clean_thresh = str(threshold).replace(',', '').replace('$', '').strip()
            v_num = float(clean_val)
            t_num = float(clean_thresh)
            if operator == ">=": return v_num >= t_num
            if operator == ">": return v_num > t_num
            if operator == "<=": return v_num <= t_num
            if operator == "<": return v_num < t_num
            if operator == "==": return v_num == t_num
            if operator == "!=": return v_num != t_num
        except (ValueError, TypeError):
            pass

        # String-based comparison fallback
        str_val = str(value).strip().lower()
        str_thresh = str(threshold).strip().lower()
        if operator == "==": return str_val == str_thresh
        if operator == "!=": return str_val != str_thresh
        if operator == ">=": return str_val >= str_thresh
        if operator == ">": return str_val > str_thresh
        if operator == "<=": return str_val <= str_thresh
        if operator == "<": return str_val < str_thresh
        return False

    def apply_rules_to_data(self, data: pd.DataFrame, rules_json: str) -> List[Dict[str, Any]]:
        """
        Applies grouping rules to all rows in the dataset.
        Returns groups with full row data.
        """
        try:
            rules = json.loads(rules_json)
            groups_with_data = []
            assigned_rows = set()
            
            for group in rules.get("groups", []):
                group_data = {
                    "name": group["name"],
                    "description": group.get("description", ""),
                    "items": []
                }
                
                if group.get("is_catchall", False):
                    # Catch-all group gets all remaining rows
                    for idx in range(len(data)):
                        if idx not in assigned_rows:
                            row_dict = data.iloc[idx].to_dict()
                            group_data["items"].append(row_dict)
                            assigned_rows.add(idx)
                else:
                    # Apply rules to filter rows
                    group_rules = group.get("rules", {})
                    for idx in range(len(data)):
                        if idx in assigned_rows:
                            continue
                        
                        row = data.iloc[idx]
                        matches = True
                        
                        for column, conditions in group_rules.items():
                            if column not in row:
                                matches = False
                                break
                            
                            value = row[column]
                            for operator, threshold in conditions.items():
                                if not self._safe_compare(value, operator, threshold):
                                    matches = False
                                    break
                            
                            if not matches:
                                break
                        
                        if matches:
                            row_dict = row.to_dict()
                            group_data["items"].append(row_dict)
                            assigned_rows.add(idx)
                
                groups_with_data.append(group_data)
            
            # Enforce capacity limits and create overflow groups
            final_groups = self._enforce_capacity_limits(groups_with_data, rules.get("groups", []))
            
            return final_groups
        except Exception as e:
            print(f"Error applying rules: {e}")
            return []

    def _enforce_capacity_limits(self, groups_with_data: List[Dict[str, Any]], group_rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enforces capacity limits on groups and creates overflow groups as needed.
        Also validates minimum capacity requirements.
        """
        final_groups = []
        
        for idx, group_data in enumerate(groups_with_data):
            # Get capacity constraints from corresponding rule
            rule = group_rules[idx] if idx < len(group_rules) else {}
            min_capacity = rule.get("min_capacity")
            max_capacity = rule.get("max_capacity")
            
            items = group_data["items"]
            item_count = len(items) if items else 0
            base_name = group_data["name"]
            description = group_data["description"]
            
            # Check minimum capacity
            if min_capacity and item_count > 0 and item_count < min_capacity:
                # Add warning to description
                warning = f"⚠️ Below minimum ({item_count}/{min_capacity} rows)"
                description = f"{description} - {warning}" if description else warning
                print(f"Warning: Group '{base_name}' has {item_count} rows, below minimum of {min_capacity}")
            
            # Check maximum capacity and split if needed
            if max_capacity and item_count > max_capacity:
                # Create main group with capacity limit
                final_groups.append({
                    "name": base_name,
                    "description": description,
                    "items": items[:max_capacity]
                })
                
                # Create overflow groups
                remaining_items = items[max_capacity:]
                overflow_num = 1
                
                while remaining_items:
                    overflow_items = remaining_items[:max_capacity]
                    remaining_items = remaining_items[max_capacity:]
                    
                    # Check if overflow group meets minimum
                    overflow_desc = f"Overflow from {base_name}"
                    if min_capacity and len(overflow_items) < min_capacity:
                        overflow_desc += f" - ⚠️ Below minimum ({len(overflow_items)}/{min_capacity} rows)"
                    
                    final_groups.append({
                        "name": f"{base_name} - Overflow {overflow_num}",
                        "description": overflow_desc,
                        "items": overflow_items
                    })
                    overflow_num += 1
            else:
                # No max capacity limit or within limit
                final_groups.append({
                    "name": base_name,
                    "description": description,
                    "items": items
                })
        
        return final_groups
