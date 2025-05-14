import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Comments from '@/components/Comments'

const mockComments = [
  {
    id: 1,
    content: '첫 댓글',
    author: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
    userEmail: 'user1@email.com',
    parentId: null,
    replies: [],
    deleted: false,
  },
  {
    id: 2,
    content: '두번째 댓글',
    author: 'user2',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: null,
    userEmail: 'user2@email.com',
    parentId: null,
    replies: [],
    deleted: false,
  },
]

global.fetch = jest.fn((url, options) => {
  if (url?.toString().includes('/comments')) {
    if (options?.method === 'GET' || !options?.method) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComments),
      })
    }
    if (options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ...mockComments[0],
          id: 3,
          content: '새 댓글',
          author: 'me',
          userEmail: 'me@email.com',
        }),
      })
    }
    if (options?.method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ...mockComments[0],
          content: '수정된 댓글',
        }),
      })
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true })
    }
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
}) as any

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { email: 'user1@email.com' } }, status: 'authenticated' }),
  signIn: jest.fn(),
}))

describe('Comments', () => {
  it('댓글 목록을 올바르게 렌더링한다', async () => {
    render(<Comments postId={1} likes={0} dislikes={0} />)
    expect(await screen.findByText('첫 댓글')).toBeInTheDocument()
    expect(screen.getByText('두번째 댓글')).toBeInTheDocument()
  })

  it('댓글 작성이 정상적으로 동작한다', async () => {
    render(<Comments postId={1} likes={0} dislikes={0} />)
    const textarea = await screen.findByPlaceholderText('Write a comment...')
    fireEvent.change(textarea, { target: { value: '새 댓글' } })
    fireEvent.click(screen.getByText('Post Comment'))
    await waitFor(() => {
      expect(screen.getByText('새 댓글')).toBeInTheDocument()
    })
  })

  it('댓글 수정이 정상적으로 동작한다', async () => {
    render(<Comments postId={1} likes={0} dislikes={0} />)
    const editBtn = await screen.findAllByLabelText('Edit')
    fireEvent.click(editBtn[0])
    const editTextarea = screen.getByDisplayValue('첫 댓글')
    fireEvent.change(editTextarea, { target: { value: '수정된 댓글' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(screen.getByText('수정된 댓글')).toBeInTheDocument()
    })
  })

  it('댓글 삭제가 정상적으로 동작한다', async () => {
    render(<Comments postId={1} likes={0} dislikes={0} />)
    const deleteBtn = await screen.findAllByLabelText('Delete')
    window.confirm = jest.fn(() => true)
    fireEvent.click(deleteBtn[0])
    await waitFor(() => {
      expect(screen.getByText('This comment has been deleted.')).toBeInTheDocument()
    })
  })
}) 