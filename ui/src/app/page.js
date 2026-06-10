"use client"

import { useState, useRef } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState(null)
  const [mode, setMode] = useState("generate")
  const [strength, setStrength] = useState(0.75)
  const [editPreview, setEditPreview] = useState(null)
  const faceRef = useRef(null)
  const editRef = useRef(null)

  async function generate(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setImage(null)

    try {
      const form = new FormData()
      form.append("prompt", prompt)
      form.append("mode", mode)

      if (mode === "edit") {
        if (editRef.current?.files?.[0]) {
          form.append("image", editRef.current.files[0])
        } else {
          throw new Error("Please select an image to edit")
        }
        form.append("strength", String(strength))
      }

      if (faceRef.current?.files?.[0]) {
        form.append("reference", faceRef.current.files[0])
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
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

  function handleFaceFile(e) {
    const file = e.target.files[0]
    if (!file) return setPreview(null)
    setPreview(URL.createObjectURL(file))
  }

  function handleEditFile(e) {
    const file = e.target.files[0]
    if (!file) return setEditPreview(null)
    setEditPreview(URL.createObjectURL(file))
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

      <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
        <button
          onClick={() => setMode("generate")}
          className={`flex-1 py-2 text-center font-medium transition ${
            mode === "generate"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setMode("edit")}
          className={`flex-1 py-2 text-center font-medium transition ${
            mode === "edit"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Edit Image
        </button>
      </div>

      <form onSubmit={generate} className="space-y-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === "edit"
              ? "Describe what to change (e.g., wearing a police uniform)..."
              : "Enter a prompt..."
          }
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />

        {mode === "edit" && (
          <div>
            <label className="block cursor-pointer">
              <span className="block px-4 py-3 rounded-lg bg-gray-800 border border-gray-700
                           text-center hover:border-blue-500 transition">
                {editPreview ? "Change image to edit" : "+ Select image to edit"}
              </span>
              <input
                ref={editRef}
                type="file"
                accept="image/*"
                onChange={handleEditFile}
                className="hidden"
              />
            </label>
            {editPreview && (
              <div className="relative inline-block mt-2">
                <img src={editPreview} alt="edit" className="h-24 rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setEditPreview(null); editRef.current.value = "" }}
                  className="absolute -top-2 -right-2 bg-red-600 rounded-full w-6 h-6
                             text-sm flex items-center justify-center hover:bg-red-700"
                >
                  x
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-gray-400 w-16">Strength:</span>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm text-gray-400 w-10">{strength.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lower = closer to original, Higher = more change
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <span className="block px-4 py-3 rounded-lg bg-gray-800 border border-gray-700
                         text-center hover:border-blue-500 transition">
              {preview ? "Change reference face" : "+ Add face reference (optional)"}
            </span>
            <input
              ref={faceRef}
              type="file"
              accept="image/*"
              onChange={handleFaceFile}
              className="hidden"
            />
          </label>
        </div>

        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="preview"
              className="h-24 rounded-lg"
            />
            <button
              type="button"
              onClick={() => { setPreview(null); faceRef.current.value = "" }}
              className="absolute -top-2 -right-2 bg-red-600 rounded-full w-6 h-6
                         text-sm flex items-center justify-center hover:bg-red-700"
            >
              x
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {loading
            ? "Working..."
            : mode === "edit"
              ? "Edit Image"
              : "Generate"}
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
          <button
            onClick={() => {
              fetch(`data:image/png;base64,${image}`)
                .then(r => r.blob())
                .then(blob => {
                  const file = new File([blob], "result.png", { type: "image/png" })
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  if (editRef.current) editRef.current.files = dt.files
                  setEditPreview(URL.createObjectURL(blob))
                  setMode("edit")
                  setImage(null)
                })
            }}
            className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600
                       font-medium transition text-sm"
          >
            Edit this image
          </button>
        </div>
      )}
    </main>
  )
}
