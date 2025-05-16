import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log('SESSION in /api/admin/online-casinos:', session);
  try {
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const casinos = await prisma.onlineCasino.findMany({
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
    });

    return NextResponse.json(casinos);
  } catch (error) {
    console.error('Error fetching casinos:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  console.log('SESSION in /api/admin/online-casinos POST:', session);
  try {
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      logoUrl,
      establishedYear,
      operator,
      license,
      isMobileSupported,
      avgRating,
      withdrawalSpeed,
      minDeposit,
      minWithdrawal,
      withdrawalLimit,
      visitUrl,
      reviewUrl,
      description,
      review,
    } = body;

    const casino = await prisma.onlineCasino.create({
      data: {
        name,
        logoUrl,
        establishedYear,
        operator,
        license,
        isMobileSupported,
        avgRating,
        withdrawalSpeed,
        minDeposit,
        minWithdrawal,
        withdrawalLimit,
        visitUrl,
        reviewUrl,
        description,
        review,
      },
    });

    return NextResponse.json(casino);
  } catch (error) {
    console.error('Error creating casino:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 