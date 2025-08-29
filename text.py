
import requests
import json


import requests
import json

url = "https://wisdom-gate.juheapi.com/v1/chat/completions"

headers = {
    "Authorization": "sk-Jki0Lwj8P6HTWF6H2lsGsX3RsKuSPGe6qeVdFJPOWgxZJTKW",  # 这里换成你的 API Key
    "Content-Type": "application/json",
    "Accept": "*/*"
}

data = {
    "model": "wisdom-ai-dsv3",
    "messages": [
        {
            "role": "user",
            "content": "Hello"
        }
    ]
}

response = requests.post(url, headers=headers, data=json.dumps(data))

# 打印 HTTP 状态码
print("Status Code:", response.status_code)

# 打印返回的 JSON 数据
print("Response:", response.json())
