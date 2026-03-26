// app/api/admin/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';


// GET - Listar todas as avaliações
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED
        const featured = searchParams.get('featured');

        const where: Prisma.ReviewWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (featured === 'true') {
            where.featured = true;
        }

        const reviews = await prisma.review.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                },
                service: {
                    select: {
                        name: true
                    }
                },
                appointment: {
                    select: {
                        date: true,
                        time: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Estatísticas
        const stats = {
            total: await prisma.review.count(),
            pending: await prisma.review.count({ where: { status: 'PENDING' } }),
            approved: await prisma.review.count({ where: { status: 'APPROVED' } }),
            rejected: await prisma.review.count({ where: { status: 'REJECTED' } }),
            featured: await prisma.review.count({ where: { featured: true } })
        };

        // Média de avaliação
        const avgRating = await prisma.review.aggregate({
            where: { status: 'APPROVED' },
            _avg: { rating: true }
        });

        return NextResponse.json({
            success: true,
            data: reviews,
            stats: {
                ...stats,
                averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : 0
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar avaliações:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar avaliações' },
            { status: 500 }
        );
    }
}

// PATCH - Moderar avaliação (aprovar/reprovar/destacar)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { id, action, comment, moderationNote } = await req.json();

        if (!id || !action) {
            return NextResponse.json(
                { success: false, error: 'ID e ação são obrigatórios' },
                { status: 400 }
            );
        }

        const updateData: Prisma.ReviewUpdateInput = {
            moderatedBy: session.user.id,
            moderatedAt: new Date(),
            moderationNote: moderationNote || null
        };

        switch (action) {
            case 'approve':
                updateData.status = 'APPROVED';
                break;
            case 'reject':
                updateData.status = 'REJECTED';
                break;
            case 'feature':
                updateData.featured = true;
                updateData.status = 'APPROVED'; // Auto-aprovar quando destacar
                break;
            case 'unfeature':
                updateData.featured = false;
                break;
            case 'edit':
                if (comment !== undefined) {
                    updateData.comment = comment;
                }
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Ação inválida' },
                    { status: 400 }
                );
        }

        const review = await prisma.review.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: review,
            message: `Avaliação ${action === 'approve' ? 'aprovada' : action === 'reject' ? 'reprovada' : 'atualizada'} com sucesso!`
        });

    } catch (error) {
        console.error('❌ Erro ao moderar avaliação:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao moderar avaliação' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar avaliação
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            );
        }

        await prisma.review.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Avaliação deletada com sucesso!'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar avaliação:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar avaliação' },
            { status: 500 }
        );
    }
}