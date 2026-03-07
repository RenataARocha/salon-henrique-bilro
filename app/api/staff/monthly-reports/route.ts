// app/api/staff/monthly-reports/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar relatórios mensais consolidados
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const year = Number(searchParams.get('year'))
        const month = Number(searchParams.get('month'))

        if (!year || !month) {
            return NextResponse.json(
                { success: false, error: 'Ano e mês são obrigatórios' },
                { status: 400 }
            )
        }

        // Buscar relatórios mensais
        const reports = await prisma.staffMonthlyReport.findMany({
            where: {
                year,
                month
            },
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        photo: true,
                        commissionPercent: true
                    }
                }
            },
            orderBy: [
                { paid: 'asc' }, // Pendentes primeiro
                { totalCommission: 'desc' } // Maiores valores primeiro
            ]
        })

        return NextResponse.json({
            success: true,
            data: reports
        })

    } catch (error) {
        console.error('Erro ao buscar relatórios mensais:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar relatórios' },
            { status: 500 }
        )
    }
}