// src/lib/schedule-integration.ts
// Integração entre Horários de Funcionamento e Bloqueios
// CORREÇÃO FINAL: Tipos corretos do BlockedTime

import { prisma } from './prisma'
import { isHoliday as checkIsHoliday } from './holidays'
import { Prisma } from '@prisma/client'

// Tipo correto do BlockedTime (mesma estrutura do Prisma)
interface BlockedTime {
    id: string
    type: string
    date?: Date | null
    startTime?: string | null
    endTime?: string | null
    dayOfWeek?: number | null
    isRecurring: boolean
    startDate?: Date | null
    endDate?: Date | null
    reason: string
    description?: string | null
}

/**
 * Busca todos os horários bloqueados para uma data específica
 */
async function getBlockedTimesForDate(date: Date): Promise<BlockedTime[]> {
    const dayOfWeek = date.getDay()
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const blockedTimes = await prisma.blockedTime.findMany({
        where: {
            OR: [
                // Bloqueios recorrentes para este dia da semana
                {
                    isRecurring: true,
                    dayOfWeek: dayOfWeek,
                    OR: [
                        // Sem período de validade (sempre ativo)
                        {
                            AND: [
                                { startDate: null },
                                { endDate: null }
                            ]
                        },
                        // Dentro do período de validade
                        {
                            AND: [
                                {
                                    OR: [
                                        { startDate: null },
                                        { startDate: { lte: date } }
                                    ]
                                },
                                {
                                    OR: [
                                        { endDate: null },
                                        { endDate: { gte: date } }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                // Bloqueios pontuais (inclui férias por intervalo)
                {
                    isRecurring: false,
                    OR: [
                        // Bloqueio de um único dia
                        {
                            date: {
                                gte: dateStart,
                                lte: dateEnd
                            }
                        },
                        // FÉRIAS / INTERVALO DE DATAS
                        {
                            AND: [
                                { date: { lte: dateEnd } },
                                { endDate: { gte: dateStart } }
                            ]
                        }
                    ]
                }

            ]
        }
    })

    return blockedTimes as BlockedTime[]
}

/**
 * Verifica se um horário específico está bloqueado
 */
function isTimeBlocked(time: string, blockedTimes: BlockedTime[]): boolean {
    for (const block of blockedTimes) {
        // Se não tem horário específico, bloqueia o dia todo
        if (!block.startTime && !block.endTime) {
            return true
        }

        // Se tem horário específico, verificar se está no intervalo
        if (block.startTime && block.endTime) {
            if (time >= block.startTime && time <= block.endTime) {
                return true
            }
        }

        // Se só tem início (bloqueia desse horário em diante)
        if (block.startTime && !block.endTime) {
            if (time >= block.startTime) {
                return true
            }
        }

        // Se só tem fim (bloqueia até esse horário)
        if (!block.startTime && block.endTime) {
            if (time <= block.endTime) {
                return true
            }
        }
    }

    return false
}

/**
 * Obtém todos os horários disponíveis para uma data específica
 * Considera: horários recorrentes, bloqueios e feriados
 */
export async function getAvailableTimesForDate(date: Date): Promise<{
    date: Date
    times: string[]
    isHoliday: boolean
    holidayName?: string
    isBlocked: boolean
    blockReason?: string
}> {
    const dayOfWeek = date.getDay()

    // 1. Verificar se é feriado
    const holiday = checkIsHoliday(date)
    if (holiday) {
        return {
            date,
            times: [],
            isHoliday: true,
            holidayName: holiday.name,
            isBlocked: true,
            blockReason: `Feriado: ${holiday.name}`
        }
    }

    // 2. Buscar horários recorrentes deste dia da semana
    const recurringSlots = await prisma.availableSlot.findMany({
        where: {
            dayOfWeek: dayOfWeek,
            active: true
        },
        orderBy: {
            timeSlot: 'asc'
        }
    })

    if (recurringSlots.length === 0) {
        return {
            date,
            times: [],
            isHoliday: false,
            isBlocked: true,
            blockReason: 'Sem horários configurados para este dia'
        }
    }

    // 3. Buscar bloqueios para esta data
    const blockedTimes = await getBlockedTimesForDate(date)

    // 4. Verificar se o dia inteiro está bloqueado
    const fullDayBlocked = blockedTimes.some(block => !block.startTime && !block.endTime)
    if (fullDayBlocked) {
        const block = blockedTimes.find(b => !b.startTime && !b.endTime)
        return {
            date,
            times: [],
            isHoliday: false,
            isBlocked: true,
            blockReason: block?.reason || 'Dia bloqueado'
        }
    }

    // 5. Filtrar horários que não estão bloqueados
    const availableTimes = recurringSlots
        .map(slot => slot.timeSlot)
        .filter(time => !isTimeBlocked(time, blockedTimes))

    return {
        date,
        times: availableTimes,
        isHoliday: false,
        isBlocked: availableTimes.length === 0,
        blockReason: availableTimes.length === 0 ? 'Todos os horários estão bloqueados' : undefined
    }
}

/**
 * Verifica se um horário específico está disponível
 */
export async function isTimeAvailable(date: Date, time: string): Promise<{
    available: boolean
    reason?: string
}> {
    const { times, isBlocked, blockReason } = await getAvailableTimesForDate(date)

    if (isBlocked) {
        return {
            available: false,
            reason: blockReason
        }
    }

    if (!times.includes(time)) {
        return {
            available: false,
            reason: 'Horário não disponível'
        }
    }

    // Verificar se já existe agendamento neste horário
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const existingAppointment = await prisma.appointment.findFirst({
        where: {
            date: {
                gte: dateStart,
                lte: dateEnd
            },
            time: time,
            status: {
                in: ['PENDING', 'CONFIRMED']
            }
        }
    })

    if (existingAppointment) {
        return {
            available: false,
            reason: 'Horário já agendado'
        }
    }

    return {
        available: true
    }
}

/**
 * Obtém status visual do dia para o calendário
 */
export async function getDayStatus(date: Date): Promise<{
    status: 'available' | 'partial' | 'blocked' | 'holiday'
    color: 'green' | 'yellow' | 'red' | 'purple'
    message: string
    availableCount: number
    totalCount: number
}> {
    const holiday = checkIsHoliday(date)
    if (holiday) {
        return {
            status: 'holiday',
            color: 'purple',
            message: `Feriado: ${holiday.name}`,
            availableCount: 0,
            totalCount: 0
        }
    }

    const { times, isBlocked, blockReason } = await getAvailableTimesForDate(date)

    const dayOfWeek = date.getDay()
    const totalSlots = await prisma.availableSlot.count({
        where: { dayOfWeek, active: true }
    })

    // Bloqueado ou sem horários configurados
    if (isBlocked || times.length === 0 || totalSlots === 0) {
        return {
            status: 'blocked',
            color: 'red',
            message: blockReason || 'Sem horários disponíveis',
            availableCount: 0,
            totalCount: totalSlots
        }
    }

    // Verificar agendamentos já feitos para esse dia
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const bookedCount = await prisma.appointment.count({
        where: {
            date: { gte: dateStart, lte: dateEnd },
            status: { in: ['PENDING', 'CONFIRMED'] }
        }
    })

    const realAvailable = times.length - bookedCount

    // Sem horários realmente disponíveis
    if (realAvailable <= 0) {
        return {
            status: 'blocked',
            color: 'red',
            message: 'Todos os horários estão ocupados',
            availableCount: 0,
            totalCount: totalSlots
        }
    }

    // Parcial — menos da metade disponível
    if (realAvailable < totalSlots / 2) {
        return {
            status: 'partial',
            color: 'yellow',
            message: `${realAvailable} horário${realAvailable > 1 ? 's' : ''} disponível${realAvailable > 1 ? 'is' : ''}`,
            availableCount: realAvailable,
            totalCount: totalSlots
        }
    }

    // Disponível
    return {
        status: 'available',
        color: 'green',
        message: `${realAvailable} horários disponíveis`,
        availableCount: realAvailable,
        totalCount: totalSlots
    }
}

/**
 * Cria horários em lote para várias datas
 */
export async function createSlotsInBatch(
    timeSlot: string,
    dates: Date[]
): Promise<{
    success: boolean
    created: number
    skipped: number
    errors: string[]
}> {
    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const date of dates) {
        try {
            const dayOfWeek = date.getDay()

            // Verificar se já existe
            const existing = await prisma.availableSlot.findFirst({
                where: {
                    dayOfWeek: dayOfWeek,
                    timeSlot: timeSlot
                }
            })

            if (existing) {
                skipped++
                continue
            }

            // Criar
            await prisma.availableSlot.create({
                data: {
                    dayOfWeek: dayOfWeek,
                    timeSlot: timeSlot,
                    active: true
                }
            })

            created++
        } catch (error) {
            errors.push(`Erro ao criar horário para ${date.toLocaleDateString('pt-BR')}: ${error}`)
        }
    }

    return {
        success: errors.length === 0,
        created,
        skipped,
        errors
    }
}

/**
 * Bloqueia automaticamente horários quando cria um bloqueio
 */
export async function autoBlockTimesForBlockedTime(
    blockedTimeId: string
): Promise<{
    success: boolean
    affectedSlots: number
    affectedAppointments: number
}> {
    const blockedTime = await prisma.blockedTime.findUnique({
        where: { id: blockedTimeId }
    })

    if (!blockedTime) {
        return {
            success: false,
            affectedSlots: 0,
            affectedAppointments: 0
        }
    }

    let affectedSlots = 0
    let affectedAppointments = 0

    if (blockedTime.isRecurring) {
        // Bloqueio recorrente: desativar slots do dia da semana
        if (blockedTime.dayOfWeek !== null) {
            const slots = await prisma.availableSlot.findMany({
                where: {
                    dayOfWeek: blockedTime.dayOfWeek,
                    active: true
                }
            })

            // Se tem horário específico, só desativar esses
            const slotsToDisable = blockedTime.startTime && blockedTime.endTime
                ? slots.filter(s =>
                    s.timeSlot >= blockedTime.startTime! &&
                    s.timeSlot <= blockedTime.endTime!
                )
                : slots // Sem horário = desativa todos

            for (const slot of slotsToDisable) {
                await prisma.availableSlot.update({
                    where: { id: slot.id },
                    data: { active: false }
                })
                affectedSlots++
            }
        }
    } else if (blockedTime.date) {
        // Bloqueio pontual: cancelar agendamentos da data
        const dateStart = new Date(blockedTime.date)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(blockedTime.date)
        dateEnd.setHours(23, 59, 59, 999)

        const where: Prisma.AppointmentWhereInput = {
            date: {
                gte: dateStart,
                lte: dateEnd
            },
            status: {
                in: ['PENDING', 'CONFIRMED']
            }
        }

        // Se tem horário específico
        if (blockedTime.startTime && blockedTime.endTime) {
            where.time = {
                gte: blockedTime.startTime,
                lte: blockedTime.endTime
            }
        }

        const appointments = await prisma.appointment.findMany({ where })

        for (const apt of appointments) {
            await prisma.appointment.update({
                where: { id: apt.id },
                data: {
                    status: 'CANCELLED',
                    justification: `Cancelado automaticamente: ${blockedTime.reason}`
                }
            })
            affectedAppointments++
        }
    }

    return {
        success: true,
        affectedSlots,
        affectedAppointments
    }
}