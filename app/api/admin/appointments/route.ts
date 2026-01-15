import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const appointments = await prisma.appointment.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                    }
                },
                coupon: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: appointments
        })

    } catch (error) {
        console.error('❌ Erro ao buscar agendamentos:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar agendamentos',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}