Wisdom Gate API
base URL
https://wisdom-gate.juheapi.com/v1


Authentication
Wisdom Gate API uses API keys for authentication. Include your API key in the Authorization header.


Header Format
Authorization: Bearer YOUR_API_KEY
⚠️ Security Note
Keep your API keys secure and never expose them in client-side code or public repositories.


API Reference
POST /chat/completions
Create a chat completion with AI models.

Parameters
model
string
The AI model to use (e.g.,"wisdom-ai-gpt5", "wisdom-ai-dsr1", "wisdom-ai-glm4.5")
messages
array
Array of message objects
max_tokens
integer
Maximum number of tokens to generate


🤖 AI Models
• wisdom-ai-gpt5 (via Gpt5)
• wisdom-ai-gpt5-mini (via Gpt5 Mini)
• wisdom-ai-gpt5-nano (via Gpt5 Nano)
• wisdom-ai-dsv3 (via DeepseekV3)
• wisdom-ai-dsr1 (via DeepseekR1)
• wisdom-ai-claude-sonnet-4 (via Claude Sonnet 4)
• wisdom-ai-gemini-2.5-flash (via Gemini 2.5 Flash)


Code Examples
curl --location --request POST 'https://wisdom-gate.juheapi.com/v1/chat/completions' \
--header 'Authorization: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--header 'Host: wisdom-gate.juheapi.com' \
--header 'Connection: keep-alive' \
--data-raw '{
    "model":"wisdom-ai-dsv3",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how can you help me today?"
      }
    ]
}'


