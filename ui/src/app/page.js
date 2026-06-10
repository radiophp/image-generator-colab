"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function generate(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setImage(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      setImage(data.image)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function download() {
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${image}`
    link.download = `ai-image-${Date.now()}.png`
    link.click()
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        AI Image Generator
      </h1>

      <form onSubmit={generate} className="space-y-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt..."
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-400 text-center">{error}</p>
      )}

      {image && (
        <div className="mt-8 space-y-4">
          <img
            src={`data:image/png;base64,${image}`}
            alt={prompt}
            className="w-full rounded-lg shadow-lg"
          />
          <button
            onClick={download}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700
                       font-medium transition"
          >
            Download Image
          </button>
        </div>
      )}
    </main>
  )
}
