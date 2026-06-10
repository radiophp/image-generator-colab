"""
Pure Python FastAPI server for Colab.
Run via:  python3 api_server.py
"""
import nest_asyncio
nest_asyncio.apply()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64
import subprocess
import re
from io import BytesIO

import torch
from diffusers import StableDiffusionPipeline

print("Loading model...")
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
    use_safetensors=True
).to("cuda")
print("Model ready on:", torch.cuda.get_device_name(0))

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


class PromptRequest(BaseModel):
    prompt: str


@app.post("/generate")
async def generate(req: PromptRequest):
    image = pipe(req.prompt).images[0]
    buf = BytesIO()
    image.save(buf, format="PNG")
    return {"image": base64.b64encode(buf.getvalue()).decode()}


@app.get("/health")
async def health():
    return {"status": "ok"}


# Start cloudflared tunnel
proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://localhost:8000"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

def print_url():
    for line in proc.stdout:
        print(line.strip())
        m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if m:
            print(f"\nCOLAB_URL={m.group()}")
            return

import threading
threading.Thread(target=print_url, daemon=True).start()

# Run uvicorn (main thread)
uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
