'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface Post {
  id: string
  title: string
  content: string
  imageUrl: string | null
  isNotice: boolean
  boardId: string
}

interface PostFormData {
  title: string
  content: string
  imageUrl: string | null
  isNotice: boolean
}

const EditPostPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userEmail = session?.user?.email || ''
  const isAdmin = session?.user?.isAdmin === true
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isNotice, setIsNotice] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}`)
        if (!response.ok) throw new Error('게시글을 불러오는데 실패했습니다')
        const data: Post = await response.json()
        setTitle(data.title)
        setContent(data.content)
        setImagePreview(data.imageUrl)
        setIsNotice(data.isNotice)
      } catch (error) {
        setError('게시글을 불러오는데 실패했습니다')
      }
    }
    fetchPost()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요')
      return
    }
    setIsUploading(true)
    setError('')

    try {
      let imageUrl = imagePreview

      if (image) {
        const formData = new FormData()
        formData.append('file', image)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadResponse.ok) throw new Error('이미지 업로드에 실패했습니다')
        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const body: PostFormData = {
        title,
        content,
        imageUrl,
        isNotice: isNotice && isAdmin,
      }

      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('게시글 수정에 실패했습니다')
      router.push(`/posts/${params.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : '게시글 수정에 실패했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB 이하여야 합니다')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다')
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  if (status === 'loading') return <div className="max-w-4xl mx-auto p-4">로딩 중...</div>
  if (!session) {
    router.push('/api/auth/signin')
    return null
  }

  return (
    <main className="max-w-4xl mx-auto p-4" role="main">
      <h1 className="text-2xl font-bold mb-4 text-black">게시글 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="게시글 수정 폼">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-800"
            placeholder="제목을 입력하세요"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-black mb-1">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-800"
            placeholder="내용을 입력하세요"
            required
            aria-required="true"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isNotice"
              checked={isNotice}
              onChange={(e) => setIsNotice(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isNotice" className="ml-2 text-sm font-medium text-black">
              공지사항으로 등록
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            이미지 (선택사항)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="이미지 업로드"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="미리보기" className="max-w-xs rounded-md" />
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUploading ? '수정 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default EditPostPage 