// lib/dateUtils.ts

/**
 * Garante que qualquer entrada (Date ou String) vire uma string YYYY-MM-DD segura.
 */
function normalizeToDateString(date: Date | string): string {
    if (typeof date === 'string') {
        return date.split('T')[0];
    }
    // Se for objeto Date, pegamos os componentes UTC para evitar offset local
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Para SALVAR no banco de dados (sempre Meio-dia UTC)
 */
export function parseDateSafe(date: string): Date {
    const dateOnly = date.split('T')[0];
    // Usamos 12:00 para que, mesmo que haja um erro de timezone de +-10h, 
    // a data continue caindo no mesmo dia do calendário.
    return new Date(`${dateOnly}T12:00:00.000Z`);
}

/**
 * Para EXIBIR em inputs de calendário (YYYY-MM-DD)
 */
export function formatDateToInput(date: Date | string): string {
    return normalizeToDateString(date);
}

/**
 * A "Mágica" para exibir na tela (pt-BR) sem nunca errar o dia
 */
export function formatDateBR(date: Date | string): string {
    const dateOnly = normalizeToDateString(date);
    // Criamos um objeto de data puramente para formatação, travado em UTC
    const dateObj = new Date(`${dateOnly}T12:00:00.000Z`);

    return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        timeZone: 'UTC', // <-- ESSENCIAL
    });
}

export function dbDateToCalendar(dateString: string): string {
    return normalizeToDateString(dateString);
}