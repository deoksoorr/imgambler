import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LikeDislikeButtons from '@/components/LikeDislikeButtons'

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { email: 'user@email.com' } }, status: 'authenticated' }),
  signIn: jest.fn(),
}))

describe('LikeDislikeButtons', () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn((url, options) => {
      if (url?.toString().includes('/vote-status')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ userVote: null }) })
      }
      if (url?.toString().includes('/vote-cancel')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ likes: 0, dislikes: 0, userVote: null }) })
      }
      if (url?.toString().includes('/vote')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ likes: 1, dislikes: 0, userVote: 'like' }) })
      }
      if (url?.toString().includes('/dislike')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ likes: 1, dislikes: 1, userVote: 'dislike' }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('추천 버튼 클릭 시 추천 수가 증가한다', async () => {
    render(<LikeDislikeButtons postId={1} likes={0} dislikes={0} />)
    const likeBtn = screen.getByText('Like')
    fireEvent.click(likeBtn)
    await waitFor(() => {
      expect(screen.getByText('Liked')).toBeInTheDocument()
    })
  })

  it('비추천 버튼 클릭 시 비추천 수가 증가한다', async () => {
    render(<LikeDislikeButtons postId={1} likes={1} dislikes={0} />)
    const dislikeBtn = screen.getByText('Dislike')
    fireEvent.click(dislikeBtn)
    await waitFor(() => {
      expect(screen.getByText('Disliked')).toBeInTheDocument()
    })
  })

  it('이미 추천한 상태에서 다시 추천 버튼 클릭 시 취소된다', async () => {
    (global.fetch as any) = jest.fn((url, options) => {
      if (url?.toString().includes('/vote-status')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ userVote: 'like' }) })
      }
      if (url?.toString().includes('/vote-cancel')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ likes: 0, dislikes: 0, userVote: null }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<LikeDislikeButtons postId={1} likes={1} dislikes={0} />)
    await waitFor(() => {
      expect(screen.getByText('Liked')).toBeInTheDocument()
    })
    const likeBtn = screen.getByText('Liked')
    fireEvent.click(likeBtn)
    await waitFor(() => {
      expect(screen.getByText('Like')).toBeInTheDocument()
    })
  })

  it('에러 발생 시 에러 메시지가 노출된다', async () => {
    (global.fetch as any) = jest.fn(() => Promise.resolve({ ok: false }))
    render(<LikeDislikeButtons postId={1} likes={0} dislikes={0} />)
    const likeBtn = screen.getByText('Like')
    fireEvent.click(likeBtn)
    await waitFor(() => {
      expect(screen.getByText(/추천\/비추천 처리에 실패했습니다/)).toBeInTheDocument()
    })
  })
}) 