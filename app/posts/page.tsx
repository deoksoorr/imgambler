// app/posts/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PostList from '@/components/PostList'
import AuthButtons from '@/components/AuthButtons'

export default async function PostListPage() {
  const session = await getServerSession(authOptions)
  const posts = await prisma.post.findMany({
    orderBy: [
      { isPinned: 'desc' },
      { isNotice: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      user: true,
      _count: {
        select: {
          comments: true
        }
      }
    }
  })

  const postsWithCommentsCount = posts.map((post: any) => ({
    ...post,
    commentsCount: post._count?.comments ?? 0,
    userImage: post.user?.image || null,
    userName: post.user?.name || null,
  }))

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <AuthButtons />
      </div>

      <PostList initialPosts={postsWithCommentsCount} currentUserName={session?.user?.name || null} />
    </main>
  )
}