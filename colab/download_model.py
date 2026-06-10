"""
Download the Stable Diffusion model weights.
Run this before api_server.py so the model is cached.
"""
import torch
from diffusers import StableDiffusionPipeline

print("Downloading model (may take 2-5 min)...")
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
    use_safetensors=True
).to("cuda")
print("Model cached and ready")
