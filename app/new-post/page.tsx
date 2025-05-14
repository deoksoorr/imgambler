// app/new-post/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPostPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [author, setAuthor] = useState('')

    // 기존 작성자 input 삭제 → author는 아예 클라이언트에서 넘기지 않음
    // body에서 title, content만 전송
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
        })
    if (res.ok) router.push('/posts')   
  }
  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✍️ 새 글 작성</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="border p-2 w-full" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full" placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} required />
        <input className="border p-2 w-full" placeholder="작성자" value={author} onChange={(e) => setAuthor(e.target.value)} required />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">작성하기</button>
      </form>
    </main>
  )
}