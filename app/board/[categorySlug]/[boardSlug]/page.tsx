import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import BoardClient from './BoardClient'
import CasinoCarousel from '@/components/CasinoCarousel'

export default async function BoardPage({ 
  params 
}: { 
  params: { categorySlug: string; boardSlug: string } 
}) {
  const session = await getServerSession(authOptions)
  const currentUserName = session?.user?.name

  try {
    const category = await prisma.category.findFirst({
      where: { 
        name: params.categorySlug.toUpperCase().replace(/-/g, ' ')
      }
    })

    if (!category) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">카테고리를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-8">요청하신 카테고리가 존재하지 않거나 삭제되었습니다.</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      )
    }

    const board = await prisma.board.findFirst({
      where: { 
        slug: params.boardSlug,
        categoryId: category.id
      },
      include: {
        posts: {
          orderBy: [
            { isNotice: 'desc' },
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            user: true,
            board: {
              include: {
                category: true
              }
            },
            _count: {
              select: { comments: true }
            }
          }
        }
      }
    })

    if (!board) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">게시판을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-8">요청하신 게시판이 존재하지 않거나 삭제되었습니다.</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      )
    }

    const posts = board.posts.map(post => ({
      ...post,
      commentsCount: post._count.comments,
      board: {
        ...post.board,
        category: post.board.category
      },
      user: post.user ? {
        name: post.user.name || '익명',
        image: post.user.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode || 'user'}`
      } : {
        name: '익명',
        image: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode || 'user'}`
      }
    }))

    return (
      <>
        <div className="mt-8" />
        <CasinoCarousel />
        <BoardClient initialPosts={posts} currentUserName={currentUserName} categorySlug={params.categorySlug} boardSlug={params.boardSlug} boardName={board.name} boardDescription={board.description} />
      </>
    )
  } catch (error) {
    console.error('Error in BoardPage:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h1>
        <p className="text-gray-600 mb-8">페이지를 불러오는 중 문제가 발생했습니다.</p>
        <Link 
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }
} 