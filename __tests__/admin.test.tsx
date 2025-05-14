import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPage from '../app/admin/page'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AdminPage', () => {
  const mockSession = {
    data: {
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        isAdmin: true,
      },
    },
    status: 'authenticated',
  }

  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders admin page with all sections', () => {
    render(<AdminPage />)
    
    // Check if all main sections are rendered
    expect(screen.getByText('카테고리 관리')).toBeInTheDocument()
    expect(screen.getByText('게시판 관리')).toBeInTheDocument()
    expect(screen.getByText('공지사항 관리')).toBeInTheDocument()
    expect(screen.getByText('유저 관리')).toBeInTheDocument()
    expect(screen.getByText('카지노 관리')).toBeInTheDocument()
  })

  it('handles category creation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'New Category' }),
    })

    render(<AdminPage />)
    
    // Fill in category form
    fireEvent.change(screen.getByLabelText('카테고리명'), {
      target: { value: 'New Category' },
    })
    fireEvent.change(screen.getByLabelText('카테고리 설명'), {
      target: { value: 'Category Description' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('카테고리 추가'))
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Category',
          description: 'Category Description',
        }),
      })
    })
  })

  it('handles board creation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'New Board' }),
    })

    render(<AdminPage />)
    
    // Fill in board form
    fireEvent.change(screen.getByLabelText('게시판명'), {
      target: { value: 'New Board' },
    })
    fireEvent.change(screen.getByLabelText('게시판 설명'), {
      target: { value: 'Board Description' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('게시판 추가'))
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Board',
          description: 'Board Description',
          categoryId: expect.any(String),
        }),
      })
    })
  })

  it('handles notice creation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', title: 'New Notice' }),
    })

    render(<AdminPage />)
    
    // Fill in notice form
    fireEvent.change(screen.getByLabelText('게시판 선택'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('제목'), {
      target: { value: 'New Notice' },
    })
    fireEvent.change(screen.getByLabelText('내용'), {
      target: { value: 'Notice Content' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('공지사항 등록'))
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Notice',
          content: 'Notice Content',
          boardId: '1',
          isNotice: true,
        }),
      })
    })
  })

  it('handles casino creation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'New Casino' }),
    })

    render(<AdminPage />)
    
    // Fill in casino form
    fireEvent.change(screen.getByLabelText('카지노명'), {
      target: { value: 'New Casino' },
    })
    fireEvent.change(screen.getByLabelText('카지노 설명'), {
      target: { value: 'Casino Description' },
    })
    fireEvent.change(screen.getByLabelText('카지노 URL'), {
      target: { value: 'https://example.com' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('카지노 추가'))
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/casinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Casino',
          description: 'Casino Description',
          url: 'https://example.com',
        }),
      })
    })
  })

  it('shows error message when form submission fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to create'))

    render(<AdminPage />)
    
    // Fill in category form
    fireEvent.change(screen.getByLabelText('카테고리명'), {
      target: { value: 'New Category' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('카테고리 추가'))
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('카테고리 생성에 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('redirects to home when user is not admin', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Regular User',
          email: 'user@example.com',
          isAdmin: false,
        },
      },
      status: 'authenticated',
    })

    render(<AdminPage />)
    
    // Check if redirect message is shown
    expect(screen.getByText('관리자 권한이 필요합니다.')).toBeInTheDocument()
  })
}) 