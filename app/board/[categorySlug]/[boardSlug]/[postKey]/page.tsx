import { prisma } from '@/lib/prisma'
import PostClient from './PostClient'

async function getPost(categorySlug: string, boardSlug: string, postKey: string) {
  const category = await prisma.category.findFirst({
    where: { 
      name: categorySlug.toUpperCase().replace(/-/g, ' ')
    }
  })

  if (!category) {
    throw new Error('Category not found')
  }

  const board = await prisma.board.findFirst({
    where: { 
      slug: boardSlug,
      categoryId: category.id
    }
  })

  if (!board) {
    throw new Error('Board not found')
  }

  // 조회수 증가
  await prisma.post.update({
    where: { postKey },
    data: { views: { increment: 1 } }
  })

  const post = await prisma.post.findUnique({
    where: { postKey },
    include: {
      user: true,
      board: true,
      _count: { select: { comments: true } }
    }
  })

  if (!post) {
    throw new Error('Post not found')
  }

  // PostClient가 기대하는 형식으로 변환
  const formattedPost = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString(),
    imageUrl: post.imageUrl || undefined,
    user: post.user ? {
      name: post.user.name || undefined,
      email: post.user.email || undefined,
      image: post.user.image || undefined
    } : undefined,
    board: {
      slug: post.board.slug
    },
    commentsCount: post._count.comments
  }

  return formattedPost
}

export default async function PostPage({ 
  params 
}: { 
  params: { categorySlug: string; boardSlug: string; postKey: string } 
}) {
  const post = await getPost(params.categorySlug, params.boardSlug, params.postKey)
  
  return <PostClient post={post} params={params} />
} 