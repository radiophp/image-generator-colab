export async function POST(req) {
  try {
    const form = await req.formData()
    const prompt = form.get("prompt")
    const reference = form.get("reference")
    const image = form.get("image")
    const strength = form.get("strength") || "0.75"
    const mode = form.get("mode") || "generate"

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const colabUrl = process.env.COLAB_URL
    if (!colabUrl) {
      return Response.json(
        { error: "COLAB_URL not configured" },
        { status: 500 }
      )
    }

    const endpoint = mode === "edit" ? "/edit" : "/generate"
    const colabForm = new FormData()
    colabForm.append("prompt", prompt)
    if (image instanceof Blob) {
      colabForm.append("image", image, image.name || "input.png")
    }
    if (reference instanceof Blob) {
      colabForm.append("reference", reference, reference.name || "ref.png")
    }
    if (mode === "edit") {
      colabForm.append("strength", strength)
    }

    const res = await fetch(`${colabUrl}${endpoint}`, {
      method: "POST",
      body: colabForm,
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
