import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(casino);
  } catch (error) {
    console.error('Error fetching casino:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
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

    const casino = await prisma.onlineCasino.update({
      where: {
        id: parseInt(params.id),
      },
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
    console.error('Error updating casino:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.onlineCasino.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting casino:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 