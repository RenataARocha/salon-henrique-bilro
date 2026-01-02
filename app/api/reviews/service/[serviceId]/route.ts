// app/api/reviews/service/[serviceId]/route.ts
// 🔧 VERSÃO CORRIGIDA para Next.js 15+

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ serviceId: string }> }
) {
    try {
        // ✅ IMPORTANTE: Await params no Next.js 15+
        const params = await context.params;
        const serviceId = params.serviceId;

        // Buscar avaliações aprovadas
        const reviews = await prisma.review.findMany({
            where: {
                serviceId,
                status: 'APPROVED'
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calcular estatísticas
        const total = reviews.length;
        const distribution = {
            1: reviews.filter(r => r.rating === 1).length,
            2: reviews.filter(r => r.rating === 2).length,
            3: reviews.filter(r => r.rating === 3).length,
            4: reviews.filter(r => r.rating === 4).length,
            5: reviews.filter(r => r.rating === 5).length
        };

        const average = total > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                reviews,
                stats: {
                    average: Number(average.toFixed(1)),
                    total,
                    distribution
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações do serviço:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar avaliações' },
            { status: 500 }
        );
    }
}