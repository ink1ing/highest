#!/usr/bin/env python3
import requests
import json

API_KEY = "sk-Jki0Lwj8P6HTWF6H2lsGsX3RsKuSPGe6qeVdFJPOWgxZJTKW"
LOCAL_URL = "http://localhost:8787/api/chat"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "wisdom-ai-dsv3",
    "messages": [
        {
            "role": "user",
            "content": "Hello, this is a test message through the local server."
        }
    ],
    "max_tokens": 100
}

print("Testing local server API...")
print(f"API Key: {API_KEY[:10]}...")
print(f"URL: {LOCAL_URL}")
print("")

try:
    response = requests.post(LOCAL_URL, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success! Response: {json.dumps(result, indent=2)}")
    else:
        print(f"Error: HTTP {response.status_code}")
        
except Exception as e:
    print(f"Exception: {e}")