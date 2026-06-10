# AI Image Generator

Generate AI images using Stable Diffusion on a free Google Colab GPU (Tesla T4), with a Next.js web UI.

## Architecture

```
Your Browser  -->  Next.js (localhost:3000)
                        |
                   API Route (/api/generate)
                        |
                   Cloudflare Tunnel (trycloudflare.com)
                        |
                   Colab T4 GPU (Stable Diffusion v1.5)
```

## Project Structure

```
├── src/app/page.js              # Frontend UI
├── src/app/api/generate/route.js # Backend API proxy
├── colab/
│   ├── 01_ssh_setup.py           # Colab: starts SSH + bore tunnel
│   ├── 02_setup_env.sh           # SSH: installs Python deps
│   ├── 03_api_app.py             # FastAPI app (model + endpoints)
│   ├── 04_run_api.py             # Launches uvicorn + cloudflared
│   ├── 05_download_model.py      # Downloads SD weights (run once)
│   └── upload_and_run.sh         # Uploads .py to Colab and runs it
├── run_on_colab.sh               # Run commands on Colab via SSH
├── command.txt                   # Colab cells (copy-paste)
├── .env                          # SSH credentials (host, port, password)
└── .env.local                    # API URL for Next.js
```

## Setup

### 1. Start Colab

1. Open [colab.research.google.com](https://colab.research.google.com)
2. **Runtime → Change runtime type → T4 GPU**
3. Copy-paste `colab/01_ssh_setup.py` into a cell and run it
4. It prints the SSH command — copy the hostname

### 2. Configure .env

```bash
# Edit .env with the SSH details printed by Colab
COLAB_SSH_HOST=bore.pub
COLAB_SSH_PORT=XXXXX
COLAB_SSH_PASS=colab123
```

### 3. Install deps on Colab

```bash
./run_on_colab.sh colab/setup_env.py
```

### 4. Download model (first time only)

```bash
./colab/upload_and_run.sh colab/download_model.py
```

### 5. Start the API server

```bash
./colab/upload_and_run.sh colab/run_api.py
# Or directly via SSH:
./run_on_colab.sh "cd /content && nohup cloudflared tunnel --url http://localhost:8000 > /tmp/cf.log 2>&1 & sleep 8 && grep -o 'https://.*\.trycloudflare\.com' /tmp/cf.log | head -1"
```

Copy the cloudflare URL it prints.

### 6. Configure .env.local

```bash
COLAB_URL=https://your-tunnel.trycloudflare.com
```

### 7. Start Next.js

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## Usage

1. Type a prompt (e.g. "a cat sitting on a couch")
2. Click **Generate**
3. Wait ~10-30 seconds for the image
4. Click **Download Image**

## Notes

- Colab sessions expire after ~2 hours of inactivity
- Each new session needs a fresh bore tunnel + cloudflare tunnel
- Bore and cloudflare tunnels cost nothing and require no account
- The SD v1.5 model is cached after the first download
