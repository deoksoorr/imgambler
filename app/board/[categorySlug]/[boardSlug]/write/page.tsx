"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

export default function WritePage({ params }: { params: { categorySlug: string; boardSlug: string } }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn()
    }
  }, [status])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleImageRemove = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }
    setIsLoading(true)
    try {
      let imageUrl = null
      if (image) {
        const formData = new FormData()
        formData.append('file', image)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          imageUrl = data.url
        }
      }
      const res = await fetch(`/api/board/${params.categorySlug}/${params.boardSlug}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, imageUrl }),
        credentials: 'include',
      })
      if (res.ok) {
        router.push(`/board/${params.categorySlug}/${params.boardSlug}`)
        router.refresh()
      } else {
        alert('글 작성에 실패했습니다.')
      }
    } catch (error) {
      alert('글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">글쓰기</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full px-4 py-3 border border-gray-400 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 font-medium"
            maxLength={100}
            required
          />
        </div>
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            className="w-full px-4 py-3 border border-gray-400 rounded-lg min-h-[180px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 font-medium"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-2 text-gray-800">이미지 첨부</label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col sm:flex-row items-center gap-4 border-2 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded p-4 transition min-h-[100px] justify-center cursor-pointer`}
            style={{ minHeight: 120 }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold"
            >
              이미지 선택
            </button>
            <span className="text-gray-700 text-sm select-none font-medium">여기로 이미지를 드래그하거나 클릭해서 업로드</span>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="미리보기" className="w-24 h-24 object-cover rounded border border-gray-400" />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  title="이미지 삭제"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-bold"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-bold"
            disabled={isLoading}
          >
            {isLoading ? '작성 중...' : '작성하기'}
          </button>
        </div>
      </form>
    </div>
  )
} 