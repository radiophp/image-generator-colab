"""
FastAPI app - SD 1.5 + IP-Adapter FaceID Plus v2 for proper face consistency.
"""
import os, sys, base64
from io import BytesIO

os.environ["LD_LIBRARY_PATH"] = "/usr/lib64-nvidia:/usr/local/cuda-12.8/compat:" + os.environ.get("LD_LIBRARY_PATH", "")

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
import numpy as np
from PIL import Image
import cv2
import warnings
warnings.filterwarnings("ignore")

print("Loading face analyzer...")
import insightface
face_analyer = insightface.app.FaceAnalysis(
    name="buffalo_l",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
face_analyer.prepare(ctx_id=0, det_size=(640, 640))

print("Loading SD 1.5 + IP-Adapter FaceID...")

from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline, DDIMScheduler
from transformers import CLIPVisionModelWithProjection

# Pre-load image encoder so load_ip_adapter doesn't try to load from FaceID repo
image_encoder = CLIPVisionModelWithProjection.from_pretrained(
    "h94/IP-Adapter",
    subfolder="models/image_encoder",
    torch_dtype=torch.float16,
)

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
    safety_checker=None,
    requires_safety_checker=False,
    image_encoder=image_encoder,
).to("cuda")
pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)

# Now load FaceID weights (will skip image encoder since it's already set)
pipe.load_ip_adapter(
    "h94/IP-Adapter-FaceID",
    subfolder="",
    weight_name="ip-adapter-faceid_sd15.bin",
)
pipe.set_ip_adapter_scale(0.8)

print("Model ready on:", torch.cuda.get_device_name(0))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_face_emb(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    faces = face_analyer.get(img)
    if len(faces) == 0:
        return None
    emb = torch.from_numpy(faces[0].normed_embedding).float()
    return emb

@app.post("/generate")
async def generate(prompt: str = Form(...), reference: UploadFile = File(None)):
    ref_bytes = None
    if reference and reference.filename:
        ref_bytes = await reference.read()

    if ref_bytes:
        face_emb = get_face_emb(ref_bytes)
    else:
        face_emb = None

    if face_emb is not None:
        neg_emb = torch.zeros_like(face_emb)
        both = torch.stack([neg_emb, face_emb], dim=0).to("cuda", dtype=torch.float16)
        extra_kwargs = {
            "ip_adapter_image_embeds": [both.unsqueeze(1)],
        }
    else:
        extra_kwargs = {}

    image = pipe(
        prompt=prompt,
        num_inference_steps=30,
        guidance_scale=7.5,
        **extra_kwargs,
    ).images[0]

    buf = BytesIO()
    image.save(buf, format="PNG")
    return {"image": base64.b64encode(buf.getvalue()).decode()}

@app.get("/health")
async def health():
    return {"status": "ok"}

uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
