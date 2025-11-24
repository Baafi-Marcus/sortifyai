import os
from dotenv import load_dotenv
from ai_engine import AIGroupingAgent
import pandas as pd

# Load environment variables
load_dotenv()

print("Testing OpenRouter Connection...")
print(f"API Key present: {bool(os.getenv('OPENROUTER_API_KEY'))}")

try:
    agent = AIGroupingAgent()
    print("Agent initialized.")

    # Mock Data
    data_summary = "Columns: ['Name', 'Score']\nSample Data:\n   Name  Score\n0  Alice     85\n1    Bob     90\n2 Charlie     78"
    user_prompt = "Group into High (>80) and Low (<80) scores"

    print("\nSending request to OpenRouter...")
    result = agent.interpret_instructions(data_summary, user_prompt)
    
    print("\n--- Result ---")
    print(result)

except Exception as e:
    print("\n--- ERROR ---")
    print(e)
