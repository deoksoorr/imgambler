import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const casino = await prisma.onlineCasino.findUnique({
      where: {
        id: parseInt(params.id),
      },
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
    });

    if (!casino) {
      return new NextResponse('Casino not found', { status: 404 });
    }

    return NextResponse.json(casino);
  } catch (error) {
    console.error('Error fetching casino:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 