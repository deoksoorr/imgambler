import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PostList from '@/components/PostList'

const mockPosts = [
  {
    id: 1,
    title: '공지사항',
    userCode: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    views: 100,
    isPinned: false,
    isNotice: true,
    likes: 10,
    dislikes: 0,
    commentsCount: 5,
    userImage: null,
    userName: '관리자',
    postKey: 'notice-1',
    board: { slug: 'notice' }
  },
  {
    id: 2,
    title: '고정글',
    userCode: 'user2',
    createdAt: '2024-01-02T00:00:00.000Z',
    views: 50,
    isPinned: true,
    isNotice: false,
    likes: 5,
    dislikes: 1,
    commentsCount: 3,
    userImage: null,
    userName: '작성자',
    postKey: 'pinned-1',
    board: { slug: 'general' }
  },
  {
    id: 3,
    title: '일반글',
    userCode: 'user3',
    createdAt: '2024-01-03T00:00:00.000Z',
    views: 30,
    isPinned: false,
    isNotice: false,
    likes: 3,
    dislikes: 0,
    commentsCount: 1,
    userImage: null,
    userName: '일반사용자',
    postKey: 'normal-1',
    board: { slug: 'general' }
  }
]

describe('PostList', () => {
  it('공지사항, 고정글, 일반글을 올바르게 표시합니다', () => {
    render(<PostList initialPosts={mockPosts} />)
    
    // 공지사항 확인
    expect(screen.getByText('공지사항')).toBeInTheDocument()
    expect(screen.getByText('[공지] 공지사항')).toBeInTheDocument()
    
    // 고정글 확인
    expect(screen.getByText('고정글')).toBeInTheDocument()
    expect(screen.getByText('[고정] 고정글')).toBeInTheDocument()
    
    // 일반글 확인
    expect(screen.getByText('일반글')).toBeInTheDocument()
  })

  it('검색 기능이 정상적으로 작동합니다', () => {
    render(<PostList initialPosts={mockPosts} />)
    
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요')
    fireEvent.change(searchInput, { target: { value: '공지' } })
    
    expect(screen.getByText('[공지] 공지사항')).toBeInTheDocument()
    expect(screen.queryByText('일반글')).not.toBeInTheDocument()
  })

  it('정렬 기능이 정상적으로 작동합니다', () => {
    render(<PostList initialPosts={mockPosts} />)
    
    const sortSelect = screen.getByRole('combobox')
    fireEvent.change(sortSelect, { target: { value: 'views' } })
    
    // 게시글 row만 가져옴
    const postRows = screen.getAllByTestId('post-row')
    const texts = postRows.map(row => row.textContent)
    expect(texts[0]).toContain('공지사항') // 조회수 100
    expect(texts[1]).toContain('고정글') // 조회수 50
    expect(texts[2]).toContain('일반글') // 조회수 30
  })

  it('전체글/인기글 탭 전환이 정상적으로 작동합니다', () => {
    render(<PostList initialPosts={mockPosts} />)
    
    const hotTab = screen.getByText('인기글')
    fireEvent.click(hotTab)
    
    // 게시글 row만 가져옴
    const postRows = screen.getAllByTestId('post-row')
    const texts = postRows.map(row => row.textContent)
    expect(texts[0]).toContain('공지사항') // 점수 10
    expect(texts[1]).toContain('고정글') // 점수 4
    expect(texts[2]).toContain('일반글') // 점수 3
  })
}) 