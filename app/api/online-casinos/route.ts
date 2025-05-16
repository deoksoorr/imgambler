import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    let where = {};
    if (category === 'recommended') {
      where = {
        avgRating: {
          gte: 4.0,
        },
      };
    } else if (category === 'new') {
      where = {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 이내
        },
      };
    }

    const [casinos, total] = await Promise.all([
      prisma.onlineCasino.findMany({
        where,
        include: {
          providers: true,
          gameTypes: true,
          languages: true,
          supportLanguages: true,
          pros: true,
          cons: true,
          paymentMethods: true,
          screenshots: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.onlineCasino.count({ where }),
    ]);

    return NextResponse.json({
      casinos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching casinos:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 