// app/api/reviews/public/route.ts
// Lista avaliações aprovadas e destacadas para exibição pública

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const reviews = await prisma.review.findMany({
            where: {
                status: 'APPROVED',
                featured: true
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
                service: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        return NextResponse.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações públicas:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar avaliações' },
            { status: 500 }
        );
    }
}