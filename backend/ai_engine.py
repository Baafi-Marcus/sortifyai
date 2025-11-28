import os
import openai
import pandas as pd
import json
from typing import List, Dict, Any, Union
from dotenv import load_dotenv

load_dotenv()

class AIGroupingAgent:
    def __init__(self):
        # Load keys from environment
        keys_str = os.getenv("OPENROUTER_API_KEYS") or os.getenv("OPENROUTER_API_KEY")
        
        if not keys_str:
            print("WARNING: No OPENROUTER_API_KEY found.")
            self.api_keys = []
        else:
            # Split by comma and strip whitespace
            self.api_keys = [k.strip() for k in keys_str.split(',') if k.strip()]
            print(f"✓ Loaded {len(self.api_keys)} API key(s) for rotation")
            
        self.current_key_index = 0
        self.model = "openai/gpt-4o" # Using GPT-4o via OpenRouter
        self._initialize_client()

    def _initialize_client(self):
        """Initializes the OpenAI client with the current key."""
        if not self.api_keys:
            return
            
        current_key = self.api_keys[self.current_key_index]
        print(f"Initializing AI Agent with key index {self.current_key_index} (starts with {current_key[:4]}...)")
        
        self.client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=current_key,
        )

    def _rotate_key(self) -> bool:
        """
        Rotates to the next available API key.
        Returns True if a new key was selected, False if we've cycled through all keys.
        """
        if not self.api_keys or len(self.api_keys) <= 1:
            return False
            
        old_index = self.current_key_index
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._initialize_client()
        print(f"🔄 Rotated from key {old_index} to key {self.current_key_index}")
        return True

    def analyze_structure(self, data: Union[pd.DataFrame, List[str]]) -> str:
        """
        Analyzes the data structure to understand columns and content.
        Returns a string summary.
        """
        if isinstance(data, pd.DataFrame):
            columns = data.columns.tolist()
            sample = data.head(10).to_string()
            total_rows = len(data)
            return f"TOTAL ROWS IN DATASET: {total_rows}\nColumns: {columns}\nSample Data (first 10 rows):\n{sample}"
        else:
            # For text data (PDF)
            return f"Text Data Sample: {data[:500]}..."

    def interpret_instructions(self, data_summary: str, user_prompt: str) -> str:
        """
        Converts natural language instructions into grouping RULES.
        Returns a JSON string with rules, not actual data.
        """
        system_prompt = """
        You are an AI data analyst.
        Your goal is to analyze user instructions and return GROUPING RULES, not the actual data.
        
        Return a JSON object with the following structure:
        {
            "groups": [
                {
                    "name": "Group Name",
                    "description": "Brief description",
                    "rules": {
                        "column_name": {"operator": value},
                        "another_column": {"operator": value}
                    },
                    "is_catchall": false,
                    "min_capacity": null,
                    "max_capacity": null
                }
            ],
            "explanation": "Why you created these rules"
        }
        
        RULES FORMAT:
        - Use column names from the data summary
        - Operators: ">=", ">", "<=", "<", "==", "!="
        - Example: {"Math": {">=": 50}, "English": {">=": 10, "<": 50}}
        - For ranges, use multiple operators on same column
        - For catch-all groups (e.g., "Class C", "Other"), set "is_catchall": true with no rules
        
        CAPACITY-BASED GROUPING:
        - If user specifies max capacity (e.g., "max 50 rows per group"), set "max_capacity": 50
        - If user specifies min capacity (e.g., "min 10 rows per group"), set "min_capacity": 10
        - Both can be specified together (e.g., "between 10 and 50 rows per group")
        - The backend will automatically split groups that exceed max_capacity
        - The backend will merge or flag groups that are below min_capacity
        - Overflow groups will be named "Group Name - Overflow 1", "Group Name - Overflow 2", etc.
        - If no capacity is specified, set both to null
        
        CRITICAL INSTRUCTIONS:
        1. Create rules that will cover ALL rows when applied
        2. The last group should typically be a catch-all (is_catchall: true) for remaining rows
        3. Rules should be mutually exclusive where possible
        4. Return ONLY the rules - the backend will apply them to all rows
        5. If user mentions capacity/limit/minimum/maximum, include it in the appropriate field
        
        DO NOT return actual data - only return the grouping logic/rules.
        """

        user_message = f"""
        Data Summary:
        {data_summary}

        User Instructions:
        {user_prompt}
        
        Return the GROUPING RULES (not the actual data). The backend will apply these rules to all rows.
        """

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
                    max_tokens=1500  # Rules are much smaller than data
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
                                if operator == ">=":
                                    if not (value >= threshold):
                                        matches = False
                                elif operator == ">":
                                    if not (value > threshold):
                                        matches = False
                                elif operator == "<=":
                                    if not (value <= threshold):
                                        matches = False
                                elif operator == "<":
                                    if not (value < threshold):
                                        matches = False
                                elif operator == "==":
                                    if not (value == threshold):
                                        matches = False
                                elif operator == "!=":
                                    if not (value != threshold):
                                        matches = False
                        
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
