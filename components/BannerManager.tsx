"use client"

import { useEffect, useState, useRef } from "react"

interface Banner {
  id: number
  type: string
  fileUrl?: string | null
  externalUrl?: string | null
  slogan?: string | null
  buttonText?: string | null
  buttonLink?: string | null
  mainLink?: string | null
  order: number
}

const emptyBanner: Partial<Banner> = {
  type: "image",
  fileUrl: "",
  externalUrl: "",
  slogan: "",
  buttonText: "",
  buttonLink: "",
  mainLink: "",
  order: 1,
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [form, setForm] = useState<Partial<Banner>>(emptyBanner)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [intervalMs, setIntervalMs] = useState(4000)
  const [speedSaved, setSpeedSaved] = useState(false)
  const [inlineEditId, setInlineEditId] = useState<number | null>(null)
  const [inlineForm, setInlineForm] = useState<Partial<Banner>>(emptyBanner)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    fetch('/api/banners/speed')
      .then(res => res.json())
      .then(data => setIntervalMs(data.intervalMs || 4000))
  }, []);

  const fetchBanners = async () => {
    setLoading(true)
    const res = await fetch("/api/banners")
    const data = await res.json()
    setBanners(data)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setForm(prev => ({ ...prev, externalUrl: data.url }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editingId) {
      await fetch(`/api/banners/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } else {
      await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setForm(emptyBanner)
    setEditingId(null)
    fetchBanners()
    setLoading(false)
  }

  // 인라인 수정 핸들러
  const handleInlineEdit = (banner: Banner) => {
    setInlineEditId(banner.id)
    setInlineForm(banner)
  }
  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInlineForm((prev) => ({ ...prev, [name]: value }))
  }
  const handleInlineFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setInlineForm(prev => ({ ...prev, externalUrl: data.url }))
    }
  }
  const handleInlineSave = async (id: number) => {
    setLoading(true)
    await fetch(`/api/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inlineForm),
    })
    setInlineEditId(null)
    fetchBanners()
    setLoading(false)
  }

  const handleEdit = (banner: Banner) => {
    setForm(banner)
    setEditingId(banner.id)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return
    setLoading(true)
    await fetch(`/api/banners/${id}`, { method: "DELETE" })
    fetchBanners()
    setLoading(false)
  }

  // Slide Speed 저장
  const handleSaveSpeed = async () => {
    setLoading(true)
    setSpeedSaved(false)
    await fetch('/api/banners/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalMs }),
    })
    setLoading(false)
    setSpeedSaved(true)
    setTimeout(() => setSpeedSaved(false), 2000)
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-700 font-semibold">
        <div>• Banners are displayed in order of <span className="text-blue-700 font-bold">Order</span> (ascending).</div>
        <div>• You can set the <span className="text-blue-700 font-bold">slide speed</span> (ms) for the main page below. (Default: 4000ms)</div>
        <div className="mt-1 text-xs text-gray-500">Recommended image size: <span className="font-bold">1200x400px</span> (JPG/PNG). Video: <span className="font-bold">16:9 MP4</span> (max 10MB).</div>
      </div>
      <div className="mb-6 flex items-center gap-4">
        <label className="font-bold text-gray-900">Slide Speed (ms):
          <input type="number" min={1000} step={100} value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} className="ml-2 border rounded p-1 w-28 text-gray-900 placeholder-gray-500" placeholder="4000" />
        </label>
        <button type="button" onClick={handleSaveSpeed} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium" disabled={loading}>Apply</button>
        {speedSaved && <span className="text-green-700 font-bold ml-2">Saved!</span>}
        <span className="text-xs text-gray-500">(This is only applied on the main page, not here.)</span>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded shadow flex flex-col gap-3 max-w-2xl">
        <div className="flex gap-4">
          <label className="font-bold text-gray-900">Type
            <select name="type" value={form.type} onChange={handleChange} className="ml-2 border rounded p-1 text-gray-900">
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label className="font-bold text-gray-900">Order
            <input name="order" type="number" value={form.order} onChange={handleChange} className="ml-2 border rounded p-1 w-20 text-gray-900 placeholder-gray-500" min={1} placeholder="1" />
          </label>
        </div>
        <label className="font-bold text-gray-900">Image/Video URL
          <input name="externalUrl" value={form.externalUrl || ""} onChange={handleChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
        </label>
        <div className="flex gap-2 items-center">
          <input type="file" accept={form.type === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="border rounded p-1" ref={fileInputRef} />
          <span className="text-xs text-gray-500">(Direct upload. JPG/PNG/MP4, max 10MB)</span>
        </div>
        <label className="font-bold text-gray-900">Slogan
          <input name="slogan" value={form.slogan || ""} onChange={handleChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Banner slogan" />
        </label>
        <label className="font-bold text-gray-900">Button Text
          <input name="buttonText" value={form.buttonText || ""} onChange={handleChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Button text" />
        </label>
        <label className="font-bold text-gray-900">Button Link
          <input name="buttonLink" value={form.buttonLink || ""} onChange={handleChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
        </label>
        <label className="font-bold text-gray-900">Main Link
          <input name="mainLink" value={form.mainLink || ""} onChange={handleChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
        </label>
        <div className="flex gap-2 mt-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium" disabled={loading}>
            {editingId ? "Update Banner" : "Add Banner"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(emptyBanner); setEditingId(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-medium">Cancel</button>
          )}
        </div>
      </form>
      <div className="space-y-4">
        {loading && <div className="text-gray-500">Loading...</div>}
        {banners.length === 0 && !loading && <div className="text-gray-400">No banners found.</div>}
        {banners
          .sort((a, b) => a.order - b.order)
          .map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 p-4 border rounded bg-white shadow-sm">
              {inlineEditId === banner.id ? (
                <form className="flex-1 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleInlineSave(banner.id) }}>
                  <div className="flex gap-4">
                    <label className="font-bold text-gray-900">Type
                      <select name="type" value={inlineForm.type} onChange={handleInlineChange} className="ml-2 border rounded p-1 text-gray-900">
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </label>
                    <label className="font-bold text-gray-900">Order
                      <input name="order" type="number" value={inlineForm.order} onChange={handleInlineChange} className="ml-2 border rounded p-1 w-20 text-gray-900 placeholder-gray-500" min={1} placeholder="1" />
                    </label>
                  </div>
                  <label className="font-bold text-gray-900">Image/Video URL
                    <input name="externalUrl" value={inlineForm.externalUrl || ""} onChange={handleInlineChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
                  </label>
                  <div className="flex gap-2 items-center">
                    <input type="file" accept={inlineForm.type === 'image' ? 'image/*' : 'video/*'} onChange={handleInlineFileChange} className="border rounded p-1" />
                    <span className="text-xs text-gray-500">(Direct upload. JPG/PNG/MP4, max 10MB)</span>
                  </div>
                  <label className="font-bold text-gray-900">Slogan
                    <input name="slogan" value={inlineForm.slogan || ""} onChange={handleInlineChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Banner slogan" />
                  </label>
                  <label className="font-bold text-gray-900">Button Text
                    <input name="buttonText" value={inlineForm.buttonText || ""} onChange={handleInlineChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Button text" />
                  </label>
                  <label className="font-bold text-gray-900">Button Link
                    <input name="buttonLink" value={inlineForm.buttonLink || ""} onChange={handleInlineChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
                  </label>
                  <label className="font-bold text-gray-900">Main Link
                    <input name="mainLink" value={inlineForm.mainLink || ""} onChange={handleInlineChange} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium" disabled={loading}>Save</button>
                    <button type="button" onClick={() => setInlineEditId(null)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-medium">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{banner.slogan || <span className="text-gray-400">(No slogan)</span>}</div>
                    <div className="text-xs text-blue-700 font-bold mb-1">Order: {banner.order}</div>
                    <div className="text-xs text-gray-500 mb-1">Type: {banner.type}</div>
                    {banner.externalUrl && (
                      <div className="mb-1">
                        {banner.type === 'image' ? (
                          <img src={banner.externalUrl} alt="banner" className="max-h-16 rounded shadow" />
                        ) : (
                          <video src={banner.externalUrl} className="max-h-16 rounded shadow" controls />
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">Button: {banner.buttonText} | Link: {banner.buttonLink}</div>
                    <div className="text-xs text-gray-500">Main Link: {banner.mainLink}</div>
                  </div>
                  <button onClick={() => handleInlineEdit(banner)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 font-medium">Edit</button>
                  <button onClick={() => handleDelete(banner.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-medium">Delete</button>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  )
} 