"use client"

import Image from "next/image";
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { FaFire, FaList, FaThLarge, FaRegComments, FaRegFolderOpen, FaRegUserCircle, FaRegSadTear, FaRegEye, FaRegChartBar, FaCrown } from 'react-icons/fa'
import { useMainPageData } from '@/lib/hooks/useMainPageData'

interface Banner {
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

interface Category {
  id: number
  name: string
  slug: string
  description: string
  postCount: number
  boards: {
    id: number
    name: string
    slug: string
    description: string
    postCount: number
  }[]
}

interface Post {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  viewCount: number
  commentCount: number
  categoryId: number
  category: Category
}

interface Comment {
  id: number
  content: string
  createdAt: string
  postId: number
  post: Post
}

// 게시판 id→이름 매핑 함수
function getBoardName(boardId: number, categories: any[]): string {
  for (const cat of categories) {
    const board = cat.boards.find((b: any) => b.id === boardId)
    if (board) return board.name
  }
  return '게시판'
}

// 게시판 id→slug 매핑 함수
function getBoardSlug(boardId: number, categories: any[]): string {
  for (const cat of categories) {
    const board = cat.boards.find((b: any) => b.id === boardId)
    if (board) return board.slug
  }
  return ''
}

// 게시판 id→카테고리 슬러그 매핑 함수
function getCategorySlug(boardId: number, categories: any[]): string {
  for (const cat of categories) {
    const board = cat.boards.find((b: any) => b.id === boardId)
    if (board) return cat.name.toLowerCase().replace(/\s+/g, '-')
  }
  return ''
}

// 글쓴이 표시 함수
function getUserName(post: any) {
  return post.userName ? post.userName : 'Anonymous'
}

export default function Home() {
  const {
    banners, bannersLoading, bannersError,
    categories, categoriesLoading, categoriesError,
    allPosts, latestPosts, postsLoading, postsError,
    intervalMs, setIntervalMs,
    current, setCurrent, progress, setProgress,
    tab, setTab,
    newsletterAgree, setNewsletterAgree
  } = useMainPageData();

  const [categoriesState, setCategoriesState] = useState<Category[]>([])
  const [postsState, setPostsState] = useState<Post[]>([])
  const [categoriesLoadingState, setCategoriesLoadingState] = useState(true)
  const [postsLoadingState, setPostsLoadingState] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCategoriesLoadingState(true)
        setPostsLoadingState(true)

        const [categoriesRes, postsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/posts')
        ]);

        if (!categoriesRes.ok || !postsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [categories, posts] = await Promise.all([
          categoriesRes.json(),
          postsRes.json()
        ]);

        setCategoriesState(categories);
        setPostsState(posts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setCategoriesLoadingState(false)
        setPostsLoadingState(false)
      }
    };

    fetchData();

    // API 응답 처리 함수
    const handleApiResponse = async (response: Response, type: string) => {
      console.log('API 응답 처리 시작:', { type, response })
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      console.log('API 응답 데이터:', data)
      
      let message = '';
      switch(type) {
        case 'category_add':
          message = `새로운 카테고리 "${data.name}"가 추가되었습니다.`;
          break;
        case 'category_edit':
          message = `카테고리 "${data.name}"가 수정되었습니다.`;
          break;
        case 'category_delete':
          message = `카테고리 "${data.name}"가 삭제되었습니다.`;
          break;
        case 'board_add':
          message = `새로운 게시판 "${data.name}"가 추가되었습니다.`;
          break;
        case 'board_edit':
          message = `게시판 "${data.name}"가 수정되었습니다.`;
          break;
        case 'board_delete':
          message = `게시판 "${data.name}"가 삭제되었습니다.`;
          break;
      }

      console.log('알림 메시지:', message)
      alert(message);
      console.log('페이지 새로고침 시도')
      window.location.reload();
    };

    // 이벤트 리스너
    const handleCategoryChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, response } = customEvent.detail;
      handleApiResponse(response, type).catch(error => {
        console.error('Error handling category change:', error);
        alert('작업 처리 중 오류가 발생했습니다.');
      });
    };

    window.addEventListener('categoryChange', handleCategoryChange);

    return () => {
      window.removeEventListener('categoryChange', handleCategoryChange);
    };
  }, []);

  if (bannersLoading || categoriesLoading || postsLoading) return <div className="w-screen h-96 flex items-center justify-center text-gray-400">Loading...</div>
  if (bannersError || categoriesError || postsError) return <div className="w-screen h-96 flex items-center justify-center text-red-400">데이터 로딩 실패</div>

  return (
    <main className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* 슬라이드 배너: 코인 슬라이드와 완전히 동일하게 */}
      <div className="relative w-screen h-[340px] sm:h-[400px] md:h-[480px] lg:h-[540px] overflow-hidden shadow-lg bg-white p-0 mt-0 left-1/2 -translate-x-1/2">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {banner.type === 'image' && banner.externalUrl && (
              <a href={banner.mainLink || '#'} target="_blank" rel="noopener noreferrer">
                <img src={banner.externalUrl} alt={banner.slogan || ''} className="w-full h-full object-cover" />
              </a>
            )}
            {banner.type === 'video' && banner.externalUrl && (
              <a href={banner.mainLink || '#'} target="_blank" rel="noopener noreferrer">
                <video src={banner.externalUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              </a>
            )}
            {/* 그라데이션 배경은 하단에 고정 */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-0 pointer-events-none z-10" />
            {/* 텍스트와 버튼: 컨테이너 기준 왼쪽에서 시작 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full z-20 flex justify-start">
              <div className="max-w-6xl w-full mx-auto flex flex-col items-start gap-6 px-8">
                {banner.slogan && <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">{banner.slogan}</div>}
                {banner.buttonText && banner.buttonLink && (
                  <a
                    href={banner.buttonLink}
            target="_blank"
            rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white min-w-[120px] min-h-[44px] px-6 py-2 rounded-full font-bold text-lg shadow-lg hover:bg-blue-700 transition-all duration-150 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  >
                    {banner.buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 인디케이터도 w-screen로 확장 */}
      <div className="w-screen flex justify-center items-center mt-2 mb-4 left-1/2 -translate-x-1/2 relative">
        <div className="flex gap-3 z-20">
          {banners.map((_, idx) => (
            <div key={idx} className="relative flex items-center" style={{height: '12px'}}>
              <button
                className={`transition-all duration-300 rounded-full border-2 focus:outline-none
                  ${idx === current ? 'w-12 h-3 bg-blue-600 border-blue-600' : 'w-3 h-3 bg-white border-gray-300'}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{position: 'relative', zIndex: 1}}
              />
              {idx === current && (
                <div className="absolute left-0 top-0 h-full rounded-full bg-blue-300/60" style={{width: `${progress * 100}%`, transition: 'width 0.1s linear', zIndex: 0}} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* casino-guru 스타일 탭/섹션 */}
      <div className="max-w-6xl mx-auto w-full mt-8">
        {/* 상단 탭 */}
        <div className="flex justify-center gap-2 md:gap-8 mb-8">
          <button
            className={`flex flex-col items-center px-8 py-4 rounded-xl font-bold text-lg shadow-sm border-2 transition-all duration-200 ${tab === 'categories' ? 'border-green-500 text-green-600 bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => setTab('categories')}
          >
            <FaThLarge className="mb-1 text-2xl" />
            Categories
          </button>
          <button
            className={`flex flex-col items-center px-8 py-4 rounded-xl font-bold text-lg shadow-sm border-2 transition-all duration-200 ${tab === 'latest' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => setTab('latest')}
          >
            <FaList className="mb-1 text-2xl" />
            Latest Posts
          </button>
          <button
            className={`flex flex-col items-center px-8 py-4 rounded-xl font-bold text-lg shadow-sm border-2 transition-all duration-200 ${tab === 'hot' ? 'border-red-500 text-red-600 bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => setTab('hot')}
          >
            <FaFire className="mb-1 text-2xl" />
            Hot Threads
          </button>
        </div>

        {/* 탭별 상단 섹션 */}
        {tab === 'categories' && (
          <div className="w-full min-h-[400px] bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <FaThLarge className="text-green-500" /> Forum categories
            </div>
            {categoriesState.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FaRegSadTear className="text-5xl mb-2" />
                카테고리가 없습니다.
              </div>
            ) : (
              categoriesState.map(category => (
                <div key={category.id} className="mb-8">
                  <div className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaRegFolderOpen className="text-gray-400" /> {category.name}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.boards.length === 0 ? (
                      <div className="text-gray-400 flex items-center gap-2"><FaRegSadTear /> 게시판 없음</div>
                    ) : category.boards.map((board: any) => {
                      const boardPosts = allPosts.filter(p => p.boardId === board.id && !p.isNotice)
                      const lastPost = boardPosts[0]
                      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-')
                      return (
                        <div key={board.id} className="flex bg-gray-50 rounded-xl border border-gray-200 p-4 items-center gap-4">
                          <div className="flex flex-col items-center justify-center min-w-[48px]">
                            <FaRegComments className="text-3xl text-blue-400 mb-2" />
                            <div className="text-xs text-gray-500 font-bold">{boardPosts.length} posts</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg text-gray-900 truncate">
                              <a href={`/board/${categorySlug}/${board.slug}`} className="hover:underline">{board.name}</a>
                            </div>
                            <div className="text-sm text-gray-500 truncate">{board.description}</div>
                          </div>
                          <div className="flex flex-col items-end min-w-[180px]">
                            {boardPosts.length === 0 ? (
                              <div className="text-xs text-gray-400 flex items-center gap-1"><FaRegSadTear /> No recent posts</div>
                            ) : (
                              <>
                                <div className="text-xs text-gray-500 mb-1">Last post • {formatDistanceToNow(new Date(lastPost.createdAt), { addSuffix: true, locale: enUS })}</div>
                                <a href={`/board/${categorySlug}/${board.slug}/${lastPost.postKey}`} className="font-semibold text-blue-700 hover:underline truncate max-w-[180px]">
                                  {lastPost.title.length > 15 ? lastPost.title.slice(0, 15) + '...' : lastPost.title}
                                </a>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    {lastPost.user?.image ? (
                                      <img src={lastPost.user.image} alt="profile" className="w-5 h-5 rounded-full object-cover inline-block mr-1" />
                                    ) : (
                                      <FaRegUserCircle className="inline-block mr-1" />
                                    )}
                                    {lastPost.user?.name ?? 'Anonymous'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === 'latest' && (
          <div className="w-full min-h-[200px] bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <FaList className="text-blue-500" /> Latest Posts
            </div>
            {latestPosts.filter(p => !p.isNotice).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FaRegSadTear className="text-5xl mb-2" />
                No recent posts
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {latestPosts.filter(p => !p.isNotice).map((post, idx) => (
                  <li key={post.id} className="flex items-center gap-4 py-4">
                    <div className="w-8 text-center text-2xl font-extrabold text-gray-400">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <a href={`/board/${getCategorySlug(post.boardId, categories)}/${getBoardSlug(post.boardId, categories)}/${post.postKey}`} className="font-bold text-gray-900 hover:underline truncate text-lg">{post.title}</a>
                    </div>
                    <div className="flex gap-4 items-center min-w-[320px] justify-end text-xs text-gray-500">
                      <a href={`/board/${getCategorySlug(post.boardId, categories)}/${getBoardSlug(post.boardId, categories)}`} className="font-semibold text-blue-600 hover:underline">{getBoardName(post.boardId, categories)}</a>
                      <span>• {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}</span>
                      <span className="flex items-center">
                        {post.isNotice ? (
                          <FaCrown className="text-yellow-500 w-5 h-5 inline-block mr-1" title="Manager" />
                        ) : (
                          post.user?.image ? (
                            <img src={post.user.image} alt="profile" className="w-5 h-5 rounded-full object-cover inline-block mr-1" />
                          ) : (
                            <FaRegUserCircle className="inline-block mr-1" />
                          )
                        )}
                        {post.isNotice ? 'Manager' : (post.user?.name ?? 'Anonymous')}
                      </span>
                      <span className="flex items-center gap-1"><FaRegEye />{post.views}</span>
                      <span className="flex items-center gap-1"><FaRegChartBar />{post.likes - post.dislikes} score</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {tab === 'hot' && (
          <div className="w-full min-h-[200px] bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <FaFire className="text-red-500" /> Hot Threads
            </div>
            {allPosts.filter(p => !p.isNotice).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FaRegSadTear className="text-5xl mb-2" />
                No posts yet
              </div>
            ) : (
              (() => {
                // Score 상위 5개 (공지사항 제외)
                const hotPosts = [...allPosts]
                  .filter(p => !p.isNotice)
                  .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
                  .slice(0, 5)
                if (hotPosts.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <FaRegSadTear className="text-5xl mb-2" />
                      No posts yet
                    </div>
                  )
                }
                return (
                  <ul className="divide-y divide-gray-200">
                    {hotPosts.map((post, idx) => (
                      <li key={post.id} className="flex items-center gap-4 py-4">
                        <div className="w-8 text-center text-2xl font-extrabold text-gray-400">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <a href={`/board/${getCategorySlug(post.boardId, categories)}/${getBoardSlug(post.boardId, categories)}/${post.postKey}`} className="font-bold text-gray-900 hover:underline truncate text-lg">{post.title}</a>
                        </div>
                        <div className="flex gap-4 items-center min-w-[320px] justify-end text-xs text-gray-500">
                          <a href={`/board/${getCategorySlug(post.boardId, categories)}/${getBoardSlug(post.boardId, categories)}`} className="font-semibold text-blue-600 hover:underline">{getBoardName(post.boardId, categories)}</a>
                          <span>• {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}</span>
                          <span className="flex items-center">
                            {post.isNotice ? (
                              <FaCrown className="text-yellow-500 w-5 h-5 inline-block mr-1" title="Manager" />
                            ) : (
                              post.user?.image ? (
                                <img src={post.user.image} alt="profile" className="w-5 h-5 rounded-full object-cover inline-block mr-1" />
                              ) : (
                                <FaRegUserCircle className="inline-block mr-1" />
                              )
                            )}
                            {post.isNotice ? 'Manager' : (post.user?.name ?? 'Anonymous')}
                          </span>
                          <span className="flex items-center gap-1"><FaRegEye />{post.views}</span>
                          <span className="flex items-center gap-1"><FaRegChartBar />{post.likes - post.dislikes} score</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              })()
            )}
          </div>
        )}

        {/* 카테고리(Forum categories) 섹션은 항상 아래에 고정 */}
        {tab !== 'categories' && (
          <div className="w-full min-h-[400px] bg-white rounded-2xl shadow-lg p-8">
            <div className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <FaThLarge className="text-green-500" /> Forum categories
            </div>
            {categoriesState.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FaRegSadTear className="text-5xl mb-2" />
                카테고리가 없습니다.
              </div>
            ) : (
              categoriesState.map(category => (
                <div key={category.id} className="mb-8">
                  <div className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaRegFolderOpen className="text-gray-400" /> {category.name}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.boards.length === 0 ? (
                      <div className="text-gray-400 flex items-center gap-2"><FaRegSadTear /> 게시판 없음</div>
                    ) : category.boards.map((board: any) => {
                      const boardPosts = allPosts.filter(p => p.boardId === board.id && !p.isNotice)
                      const lastPost = boardPosts[0]
                      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-')
                      return (
                        <div key={board.id} className="flex bg-gray-50 rounded-xl border border-gray-200 p-4 items-center gap-4">
                          <div className="flex flex-col items-center justify-center min-w-[48px]">
                            <FaRegComments className="text-3xl text-blue-400 mb-2" />
                            <div className="text-xs text-gray-500 font-bold">{boardPosts.length} posts</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg text-gray-900 truncate">
                              <a href={`/board/${categorySlug}/${board.slug}`} className="hover:underline">{board.name}</a>
                            </div>
                            <div className="text-sm text-gray-500 truncate">{board.description}</div>
                          </div>
                          <div className="flex flex-col items-end min-w-[180px]">
                            {boardPosts.length === 0 ? (
                              <div className="text-xs text-gray-400 flex items-center gap-1"><FaRegSadTear /> No recent posts</div>
                            ) : (
                              <>
                                <div className="text-xs text-gray-500 mb-1">Last post • {formatDistanceToNow(new Date(lastPost.createdAt), { addSuffix: true, locale: enUS })}</div>
                                <a href={`/board/${categorySlug}/${board.slug}/${lastPost.postKey}`} className="font-semibold text-blue-700 hover:underline truncate max-w-[180px]">
                                  {lastPost.title.length > 15 ? lastPost.title.slice(0, 15) + '...' : lastPost.title}
                                </a>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    {lastPost.user?.image ? (
                                      <img src={lastPost.user.image} alt="profile" className="w-5 h-5 rounded-full object-cover inline-block mr-1" />
                                    ) : (
                                      <FaRegUserCircle className="inline-block mr-1" />
                                    )}
                                    {lastPost.user?.name ?? 'Anonymous'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
