// lib/holidays.ts - Sistema de Feriados Brasileiros

/**
 * Feriados Nacionais e Estaduais do Rio Grande do Norte
 * Atualizado para 2025-2026
 */

interface Holiday {
    date: string // formato: "YYYY-MM-DD"
    name: string
    type: 'national' | 'state' | 'municipal'
    description?: string
}

// Feriados fixos (mesmo dia todo ano)
const FIXED_HOLIDAYS: Omit<Holiday, 'date'>[] = [
    { name: 'Confraternização Universal', type: 'national', description: 'Ano Novo' },
    { name: 'Tiradentes', type: 'national' },
    { name: 'Dia do Trabalho', type: 'national' },
    { name: 'Independência do Brasil', type: 'national' },
    { name: 'Nossa Senhora Aparecida', type: 'national', description: 'Padroeira do Brasil' },
    { name: 'Finados', type: 'national' },
    { name: 'Proclamação da República', type: 'national' },
    { name: 'Consciência Negra', type: 'national' },
    { name: 'Natal', type: 'national' },

    // RN
    { name: 'Mártires de Cunhaú e Uruaçu', type: 'state', description: 'Feriado estadual RN' },
    { name: 'Dia de São Pedro', type: 'municipal', description: 'Padroeiro de São Gonçalo do Amarante' }
]

// Feriados móveis (calculados com base na Páscoa)
const MOVABLE_HOLIDAYS_2025: Holiday[] = [
    { date: '2025-03-03', name: 'Carnaval', type: 'national', description: 'Segunda de Carnaval' },
    { date: '2025-03-04', name: 'Carnaval', type: 'national', description: 'Terça de Carnaval' },
    { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'national' },
    { date: '2025-04-20', name: 'Páscoa', type: 'national' },
    { date: '2025-06-19', name: 'Corpus Christi', type: 'national' },
]

const MOVABLE_HOLIDAYS_2026: Holiday[] = [
    { date: '2026-02-16', name: 'Carnaval', type: 'national', description: 'Segunda de Carnaval' },
    { date: '2026-02-17', name: 'Carnaval', type: 'national', description: 'Terça de Carnaval' },
    { date: '2026-04-03', name: 'Sexta-feira Santa', type: 'national' },
    { date: '2026-04-05', name: 'Páscoa', type: 'national' },
    { date: '2026-06-04', name: 'Corpus Christi', type: 'national' },
]

// Combinar todos os feriados
export const ALL_HOLIDAYS: Holiday[] = [
    // Fixos 2025
    { date: '2025-01-01', name: 'Confraternização Universal', type: 'national', description: 'Ano Novo' },
    { date: '2025-04-21', name: 'Tiradentes', type: 'national' },
    { date: '2025-05-01', name: 'Dia do Trabalho', type: 'national' },
    { date: '2025-09-07', name: 'Independência do Brasil', type: 'national' },
    { date: '2025-10-03', name: 'Mártires de Cunhaú e Uruaçu', type: 'state', description: 'Feriado RN' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
    { date: '2025-11-02', name: 'Finados', type: 'national' },
    { date: '2025-11-15', name: 'Proclamação da República', type: 'national' },
    { date: '2025-11-20', name: 'Consciência Negra', type: 'national' },
    { date: '2025-12-25', name: 'Natal', type: 'national' },
    { date: '2025-06-29', name: 'Dia de São Pedro', type: 'municipal', description: 'São Gonçalo do Amarante' },

    // Fixos 2026
    { date: '2026-01-01', name: 'Confraternização Universal', type: 'national', description: 'Ano Novo' },
    { date: '2026-04-21', name: 'Tiradentes', type: 'national' },
    { date: '2026-05-01', name: 'Dia do Trabalho', type: 'national' },
    { date: '2026-09-07', name: 'Independência do Brasil', type: 'national' },
    { date: '2026-10-03', name: 'Mártires de Cunhaú e Uruaçu', type: 'state', description: 'Feriado RN' },
    { date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
    { date: '2026-11-02', name: 'Finados', type: 'national' },
    { date: '2026-11-15', name: 'Proclamação da República', type: 'national' },
    { date: '2026-11-20', name: 'Consciência Negra', type: 'national' },
    { date: '2026-12-25', name: 'Natal', type: 'national' },
    { date: '2026-06-29', name: 'Dia de São Pedro', type: 'municipal', description: 'São Gonçalo do Amarante' },

    // Móveis
    ...MOVABLE_HOLIDAYS_2025,
    ...MOVABLE_HOLIDAYS_2026
]

/**
 * Verifica se uma data é feriado
 * EXPORTADO CORRETAMENTE
 */
export function isHoliday(date: Date): Holiday | null {
    const dateStr = date.toISOString().split('T')[0]
    return ALL_HOLIDAYS.find(h => h.date === dateStr) || null
}

/**
 * Obtém o nome do feriado se a data for feriado
 */
export function getHolidayName(date: Date): string | null {
    const holiday = isHoliday(date)
    return holiday ? holiday.name : null
}

/**
 * Verifica se uma data é feriado nacional
 */
export function isNationalHoliday(date: Date): boolean {
    const holiday = isHoliday(date)
    return holiday?.type === 'national'
}

/**
 * Obtém todos os feriados de um mês específico
 */
export function getHolidaysInMonth(year: number, month: number): Holiday[] {
    return ALL_HOLIDAYS.filter(holiday => {
        const holidayDate = new Date(holiday.date)
        return holidayDate.getFullYear() === year && holidayDate.getMonth() === month
    })
}

/**
 * Obtém todos os feriados entre duas datas
 */
export function getHolidaysBetween(startDate: Date, endDate: Date): Holiday[] {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]

    return ALL_HOLIDAYS.filter(holiday => {
        return holiday.date >= start && holiday.date <= end
    })
}

/**
 * Formata um feriado para exibição
 */
export function formatHoliday(holiday: Holiday): string {
    const typeLabel = {
        national: '🇧🇷 Nacional',
        state: '📍 Estadual (RN)',
        municipal: '🏙️ Municipal'
    }

    const date = new Date(holiday.date)
    const dateStr = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    return `${holiday.name} - ${dateStr} (${typeLabel[holiday.type]})`
}

/**
 * Gera mensagem de aviso para feriado
 */
export function getHolidayWarning(date: Date): string | null {
    const holiday = isHoliday(date)
    if (!holiday) return null

    const emoji = holiday.type === 'national' ? '🎉' :
        holiday.type === 'state' ? '📍' : '🏙️'

    return `${emoji} Feriado: ${holiday.name}${holiday.description ? ` (${holiday.description})` : ''}`
}

/**
 * Verifica se deve mostrar alerta ao criar horário nesta data
 */
export function shouldWarnAboutDate(date: Date): {
    shouldWarn: boolean
    message: string | null
    holiday: Holiday | null
} {
    const holiday = isHoliday(date)

    if (holiday) {
        return {
            shouldWarn: true,
            message: `⚠️ Esta data é feriado (${holiday.name}). Tem certeza que deseja criar horários disponíveis?`,
            holiday
        }
    }

    return {
        shouldWarn: false,
        message: null,
        holiday: null
    }
}