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
                    select: { name: true, email: true, phone: true }
                },
                service: {
                    select: { id: true, name: true, price: true, duration: true }
                },
                combo: {  // ✅ ADICIONAR
                    include: {
                        services: {
                            include: { service: true }
                        }
                    }
                },
                coupon: true
            },
            orderBy: { date: 'desc' }
        })

        // ✅ FORMATAR DADOS
        const formattedAppointments = appointments.map(apt => {
            let formattedApt: any = { ...apt, service: apt.service || null, combo: null }

            if (apt.combo) {
                const comboServices = apt.combo.services.map(cs => cs.service)
                const originalPrice = comboServices.reduce((sum, s) => sum + s.price, 0)
                const comboPrice = originalPrice * (1 - apt.combo.discountPercent / 100)

                formattedApt.combo = {
                    id: apt.combo.id,
                    name: apt.combo.name,
                    description: apt.combo.description,
                    services: comboServices,
                    originalPrice,
                    comboPrice,
                    discountPercent: apt.combo.discountPercent
                }

                if (!formattedApt.service && comboServices.length > 0) {
                    formattedApt.service = {
                        id: apt.combo.id,
                        name: apt.combo.name,
                        price: comboPrice,
                        duration: comboServices.reduce((sum, s) => sum + s.duration, 0)
                    }
                }
            }

            return formattedApt
        })

        return NextResponse.json({
            success: true,
            data: formattedAppointments
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