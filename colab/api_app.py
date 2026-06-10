"""
FastAPI app module for Colab (imported by uvicorn).
"""
import os, base64
from io import BytesIO

os.environ["LD_LIBRARY_PATH"] = "/usr/lib64-nvidia:/usr/local/cuda-12.8/compat:" + os.environ.get("LD_LIBRARY_PATH", "")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
