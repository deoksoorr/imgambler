import { useEffect, useState } from 'react'

export interface Banner {
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

export interface Category {
  id: number
  name: string
  description: string | null
  boards: Board[]
}

export interface Board {
  id: number
  name: string
  description: string | null
  categoryId: number
  slug: string
}

export interface Post {
  id: number
  postKey: string
  title: string
  content: string
  userName?: string
  isNotice?: boolean
  isPinned?: boolean
  createdAt: string
  views: number
  likes: number
  dislikes: number
  boardId: number
  user?: {
    name?: string
    image?: string
    email?: string
  }
}

export function useMainPageData() {
  // 배너
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)
  const [bannersError, setBannersError] = useState<string | null>(null)
  // 카테고리
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  // 게시글
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [latestPosts, setLatestPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState<string | null>(null)
  // 슬라이드 배너 상태 (SSR/CSR hydration 불일치 방지: 초기값 고정)
  const [current, setCurrent] = useState(0)
  const [intervalMs, setIntervalMs] = useState(4000)
  const [progress, setProgress] = useState(0)
  // 탭
  const [tab, setTab] = useState<'categories' | 'latest' | 'hot'>('categories')
  // 구독
  const [newsletterAgree, setNewsletterAgree] = useState(false)

  // 병렬 fetch
  useEffect(() => {
    setCategoriesLoading(true)
    setPostsLoading(true)
    setBannersLoading(true)
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/posts?limit=100').then(res => res.json()),
      fetch('/api/posts?limit=5').then(res => res.json()),
      fetch('/api/banners').then(res => res.json()),
      fetch('/api/banners/speed').then(res => res.json()),
    ]).then(([catData, allData, latestData, bannersData, speedData]) => {
      setCategories(catData)
      setAllPosts(allData.posts || [])
      setLatestPosts(latestData.posts || [])
      setBanners(bannersData)
      setIntervalMs(speedData.intervalMs || 4000)
      setCategoriesLoading(false)
      setPostsLoading(false)
      setBannersLoading(false)
    }).catch(err => {
      setCategoriesError('카테고리 로딩 실패')
      setPostsError('게시글 로딩 실패')
      setBannersError('배너 로딩 실패')
      setCategoriesLoading(false)
      setPostsLoading(false)
      setBannersLoading(false)
    })
  }, [])

  // 배너 슬라이드/프로그레스
  useEffect(() => {
    if (banners.length < 2) return
    setProgress(0)
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, intervalMs)
    let start = Date.now()
    let raf: number
    function animate() {
      const elapsed = Date.now() - start
      setProgress(Math.min(1, elapsed / intervalMs))
      if (elapsed < intervalMs) raf = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      clearInterval(timer)
      cancelAnimationFrame(raf)
    }
  }, [banners, intervalMs, current])

  return {
    banners, bannersLoading, bannersError,
    categories, categoriesLoading, categoriesError,
    allPosts, latestPosts, postsLoading, postsError,
    intervalMs, setIntervalMs,
    current, setCurrent, progress, setProgress,
    tab, setTab,
    newsletterAgree, setNewsletterAgree
  }
} 