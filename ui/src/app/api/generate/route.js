export async function POST(req) {
  try {
    const { prompt } = await req.json()
    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const colabUrl = process.env.COLAB_URL
    if (!colabUrl) {
      return Response.json(
        { error: "COLAB_URL not configured. Add it to .env.local" },
        { status: 500 }
      )
    }

    const res = await fetch(`${colabUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
      const text = await res.text()
      return Response.json(
        { error: `Colab error: ${text}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return Response.json({ image: data.image })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
