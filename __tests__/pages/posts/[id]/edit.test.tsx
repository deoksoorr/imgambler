import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditPostPage from '@/app/posts/[id]/edit/page'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

describe('EditPostPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  const mockPost = {
    id: '1',
    title: 'Test Post',
    content: 'Test Content',
    imageUrl: 'https://example.com/image.jpg',
    isNotice: false,
    boardId: '1',
  }

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com', isAdmin: true } },
      status: 'authenticated',
    })

    global.fetch = jest.fn((url) => {
      if (url?.toString().includes('/api/posts/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost),
        } as Response)
      }
      if (url?.toString().includes('/api/upload')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/new-image.jpg' }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    })
  })

  it('게시글 수정 폼이 정상적으로 렌더링된다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    await waitFor(() => {
      expect(screen.getByLabelText('제목')).toBeInTheDocument()
      expect(screen.getByLabelText('내용')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '수정하기' })).toBeInTheDocument()
    })
  })

  it('기존 게시글 데이터가 폼에 로드된다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    await waitFor(() => {
      expect(screen.getByLabelText('제목')).toHaveValue('Test Post')
      expect(screen.getByLabelText('내용')).toHaveValue('Test Content')
    })
  })

  it('제목과 내용이 없으면 에러 메시지가 표시된다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    const titleInput = screen.getByLabelText('제목')
    const contentInput = screen.getByLabelText('내용')
    const submitButton = screen.getByRole('button', { name: '수정하기' })

    fireEvent.change(titleInput, { target: { value: '' } })
    fireEvent.change(contentInput, { target: { value: '' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('제목과 내용을 모두 입력해주세요')).toBeInTheDocument()
    })
  })

  it('게시글 수정이 성공하면 해당 게시글로 이동한다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    const submitButton = screen.getByRole('button', { name: '수정하기' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/posts/1')
    })
  })

  it('이미지 업로드가 실패하면 에러 메시지가 표시된다', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)
    )

    render(<EditPostPage params={{ id: '1' }} />)
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText('이미지 업로드')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('이미지 업로드에 실패했습니다')).toBeInTheDocument()
    })
  })

  it('관리자는 공지사항으로 등록할 수 있다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    await waitFor(() => {
      expect(screen.getByLabelText('공지사항으로 등록')).toBeInTheDocument()
    })
  })

  it('로그인하지 않은 사용자는 로그인 페이지로 리다이렉트된다', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<EditPostPage params={{ id: '1' }} />)
    expect(mockRouter.push).toHaveBeenCalledWith('/api/auth/signin')
  })

  it('취소 버튼 클릭 시 이전 페이지로 이동한다', async () => {
    render(<EditPostPage params={{ id: '1' }} />)
    const cancelButton = screen.getByRole('button', { name: '취소' })
    fireEvent.click(cancelButton)
    expect(mockRouter.back).toHaveBeenCalled()
  })
}) 