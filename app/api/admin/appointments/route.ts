import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type FormattedAppointment = {
    id: string
    date: Date
    user: {
        name: string
        email: string
        phone: string | null
    }

    service: {
        id: string
        name: string
        price: number
        duration: number
    } | null

    combo: {
        id: string
        name: string
        description: string | null
        services: {
            id: string
            name: string
            price: number
            duration: number
        }[]
        originalPrice: number
        comboPrice: number
        discountPercent: number
    } | null

    staffName: string | null

    // mantém o resto do Prisma
    [key: string]: unknown
}

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
                combo: {
                    include: {
                        services: {
                            include: { service: true }
                        }
                    }
                },
                coupon: true,
                // ✅ ADICIONAR appointmentServices
                appointmentServices: {
                    include: {
                        service: true
                    }
                },
                // ✅ ADICIONAR staffServices (para mostrar funcionário)
                staffServices: {
                    include: {
                        staff: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        })

        // Formatar dados
        const formattedAppointments: FormattedAppointment[] = appointments.map((apt) => {
            const formattedApt: FormattedAppointment = {
                id: apt.id,
                date: apt.date,
                user: apt.user,

                service: apt.service
                    ? {
                        id: apt.service.id,
                        name: apt.service.name,
                        price: apt.service.price,
                        duration: apt.service.duration
                    }
                    : null,
                combo: null,
                staffName: null,

            }

            // ✅ SE TEM MÚLTIPLOS SERVIÇOS, CRIAR SERVICE VIRTUAL
            if (apt.appointmentServices && apt.appointmentServices.length > 0) {
                const totalPrice = apt.appointmentServices.reduce(
                    (sum: number, as) => sum + (as.price * as.quantity),
                    0
                )
                const totalDuration = apt.appointmentServices.reduce(
                    (sum: number, as) => sum + (as.service.duration * as.quantity),
                    0
                )

                const serviceNames = apt.appointmentServices
                    .map(as => as.quantity > 1 ? `${as.quantity}x ${as.service.name}` : as.service.name)
                    .join(' + ')

                formattedApt.service = {
                    id: 'multiple',
                    name: serviceNames,
                    price: totalPrice,
                    duration: totalDuration
                }
            }

            // ✅ EXTRAIR NOME DO FUNCIONÁRIO
            if (apt.staffServices && apt.staffServices.length > 0) {
                formattedApt.staffName = apt.staffServices[0].staff.name
            }

            if (apt.combo) {
                const comboServices = apt.combo.services.map(cs => cs.service)
                const originalPrice = comboServices.reduce(
                    (sum: number, s) => sum + s.price,
                    0
                )
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
                        duration: comboServices.reduce(
                            (sum: number, s) => sum + s.duration,
                            0
                        )
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