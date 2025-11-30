// ==========================================
// src/lib/masks.ts - Funções de Máscara
// ==========================================

export const phoneMask = (value: string): string => {
    if (!value) return ''

    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')

    // Aplica máscara progressivamente
    if (numbers.length <= 2) {
        return `(${numbers}`
    } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
        // Celular com 9 dígitos
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
}

export const cpfMask = (value: string): string => {
    if (!value) return ''

    const numbers = value.replace(/\D/g, '')

    if (numbers.length <= 3) {
        return numbers
    } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    } else {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
    }
}

export const cepMask = (value: string): string => {
    if (!value) return ''

    const numbers = value.replace(/\D/g, '')

    if (numbers.length <= 5) {
        return numbers
    } else {
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
    }
}

export const removeMask = (value: string): string => {
    return value.replace(/\D/g, '')
}