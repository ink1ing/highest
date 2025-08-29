#!/bin/bash

# Test script for Wisdom Gate API
API_KEY="sk-Jki0Lwj8P6HTWF6H2lsGsX3RsKuSPGe6qeVdFJPOWgxZJTKW"
BASE_URL="https://wisdom-gate.juheapi.com/v1/chat/completions"

echo "Testing Wisdom Gate API..."
echo "API Key: ${API_KEY:0:10}..."
echo "URL: $BASE_URL"
echo ""

curl --location --request POST "$BASE_URL" \
--header "Authorization: $API_KEY" \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--header 'Host: wisdom-gate.juheapi.com' \
--header 'Connection: keep-alive' \
--data-raw '{
    "model":"wisdom-ai-dsv3",
    "messages": [
      {
        "role": "user", 
        "content": "Hello, this is a test message. Please respond briefly."
      }
    ],
    "max_tokens": 100
}'