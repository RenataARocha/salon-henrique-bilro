// lib/blocked-times-utils.ts

import { prisma } from './prisma'

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
}

/**
 * Busca todos os horários bloqueados para uma data específica
 */
export async function getBlockedTimesForDate(date: Date): Promise<BlockedTime[]> {
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
                // Bloqueios pontuais para esta data específica
                {
                    isRecurring: false,
                    date: {
                        gte: dateStart,
                        lte: dateEnd
                    }
                }
            ]
        }
    })

    return blockedTimes as BlockedTime[]
}

/**
 * Verifica se um horário específico está bloqueado
 */
export function isTimeBlocked(time: string, blockedTimes: BlockedTime[]): boolean {
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
 * Verifica se uma data inteira está bloqueada
 */
export async function isDateBlocked(date: Date): Promise<boolean> {
    const blockedTimes = await getBlockedTimesForDate(date)

    // Se existe algum bloqueio sem horário específico, o dia todo está bloqueado
    return blockedTimes.some(block => !block.startTime && !block.endTime)
}

/**
 * Filtra horários disponíveis removendo os bloqueados
 */
export async function filterAvailableTimes(
    date: Date,
    allTimes: string[]
): Promise<string[]> {
    const blockedTimes = await getBlockedTimesForDate(date)

    return allTimes.filter(time => !isTimeBlocked(time, blockedTimes))
}

/**
 * Verifica se há conflito entre um novo bloqueio e agendamentos existentes
 */
export async function checkBlockingConflicts(
    date: Date,
    startTime?: string,
    endTime?: string
) {
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const where: any = {
        date: {
            gte: dateStart,
            lte: dateEnd
        },
        status: {
            in: ['PENDING', 'CONFIRMED']
        }
    }

    // Se tem horário específico, filtrar por horário
    if (startTime && endTime) {
        where.time = {
            gte: startTime,
            lte: endTime
        }
    }

    const conflicts = await prisma.appointment.findMany({
        where,
        include: {
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true
                }
            },
            service: {
                select: {
                    name: true
                }
            }
        }
    })

    return conflicts
}