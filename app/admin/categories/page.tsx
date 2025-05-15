'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CategoriesPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('카테고리 추가 시도:', { name, description })
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      const data = await response.json()
      console.log('카테고리 추가 성공:', data)

      // 이벤트 발생
      const event = new CustomEvent('categoryChange', {
        detail: { type: 'category_add', response }
      })
      console.log('이벤트 발생:', event)
      window.dispatchEvent(event)

      setName('')
      setDescription('')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('카테고리 생성 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = async (id: number, name: string, description: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, description }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('categoryChange', {
        detail: { type: 'category_edit', response }
      }))

      setEditingId(null)
      setEditingName('')
      setEditingDescription('')
    } catch (error) {
      console.error('Error updating category:', error)
      alert('카테고리 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`정말로 "${name}" 카테고리를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('categoryChange', {
        detail: { type: 'category_delete', response }
      }))
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('카테고리 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">카테고리 관리</h1>
      
      {/* 카테고리 추가 폼 */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="카테고리 이름"
            className="flex-1 px-4 py-2 border rounded"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="카테고리 설명"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            추가
          </button>
        </div>
      </form>

      {/* 카테고리 목록 */}
      <div className="space-y-4">
        {/* 여기에 카테고리 목록 렌더링 */}
      </div>
    </div>
  )
} 