// app/api/reviews/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SubmitReviewData {
    token: string;
    rating: number;
    comment?: string;
    images?: string[];
}

export async function POST(req: NextRequest) {
    try {
        const { token, rating, comment, images }: SubmitReviewData = await req.json();

        // Validações
        if (!token || !rating) {
            return NextResponse.json(
                { success: false, error: 'Token e avaliação são obrigatórios' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Avaliação deve ser entre 1 e 5 estrelas' },
                { status: 400 }
            );
        }

        // Buscar agendamento pelo token
        const appointment = await prisma.appointment.findFirst({
            where: {
                id: token,
                status: 'COMPLETED'
            },
            include: {
                user: true,
                service: true,
                review: true
            }
        });

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado ou ainda não concluído' },
                { status: 404 }
            );
        }

        // Verificar se já foi avaliado
        if (appointment.review) {
            return NextResponse.json(
                { success: false, error: 'Este agendamento já foi avaliado' },
                { status: 400 }
            );
        }

        // Criar avaliação
        const review = await prisma.review.create({
            data: {
                userId: appointment.userId,
                appointmentId: appointment.id,
                serviceId: appointment.serviceId,
                rating,
                comment: comment || null,
                images: images || [],
                status: 'PENDING', // Vai para moderação
                token,
                tokenUsed: true
            }
        });

        return NextResponse.json({
            success: true,
            data: review,
            message: 'Avaliação enviada com sucesso! Obrigado pelo seu feedback.'
        });

    } catch (error) {
        console.error('❌ Erro ao submeter avaliação:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao enviar avaliação' },
            { status: 500 }
        );
    }
}

// GET - Verificar se token é válido
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token não fornecido' },
                { status: 400 }
            );
        }

        const appointment = await prisma.appointment.findFirst({
            where: {
                id: token,
                status: 'COMPLETED'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                service: {
                    select: {
                        name: true,
                        description: true
                    }
                },
                review: true
            }
        });

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Token inválido ou agendamento não encontrado' },
                { status: 404 }
            );
        }

        if (appointment.review) {
            return NextResponse.json(
                { success: false, error: 'Este agendamento já foi avaliado', alreadyReviewed: true },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user: appointment.user,
                service: appointment.service,
                date: appointment.date,
                canReview: true
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar token:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao verificar token' },
            { status: 500 }
        );
    }
}