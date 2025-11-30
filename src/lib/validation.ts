// ==========================================
// src/lib/validation.ts
// ==========================================

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const validatePassword = (
    password: string
): { valid: boolean; message?: string } => {
    if (!password || password.trim().length === 0) {
        return { valid: false, message: "A senha não pode estar vazia" };
    }

    if (password.length < 8) {
        return { valid: false, message: "A senha deve ter no mínimo 8 caracteres" };
    }

    if (password.length > 50) {
        return {
            valid: false,
            message: "A senha deve ter no máximo 50 caracteres"
        };
    }

    // Letra maiúscula
    if (!/[A-Z]/.test(password)) {
        return {
            valid: false,
            message: "A senha deve conter ao menos 1 letra maiúscula"
        };
    }

    // Letra minúscula
    if (!/[a-z]/.test(password)) {
        return {
            valid: false,
            message: "A senha deve conter ao menos 1 letra minúscula"
        };
    }

    // Número
    if (!/[0-9]/.test(password)) {
        return {
            valid: false,
            message: "A senha deve conter ao menos 1 número"
        };
    }

    // Caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
        return {
            valid: false,
            message: "A senha deve conter ao menos 1 caractere especial"
        };
    }

    return { valid: true };
};


export const validatePhone = (phone: string): boolean => {
    // Remove máscara e verifica se tem 10 ou 11 dígitos
    const numbers = phone.replace(/\D/g, '')
    return numbers.length === 10 || numbers.length === 11
}

export const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '')

    if (numbers.length !== 11) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false

    // Validação dos dígitos verificadores
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(numbers.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(numbers.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.substring(10, 11))) return false

    return true
}

export const validateName = (name: string): { valid: boolean; message?: string } => {
    if (name.trim().length < 3) {
        return { valid: false, message: 'Nome deve ter no mínimo 3 caracteres' }
    }
    if (name.trim().length > 100) {
        return { valid: false, message: 'Nome deve ter no máximo 100 caracteres' }
    }
    // Verifica se tem pelo menos nome e sobrenome
    if (!name.trim().includes(' ')) {
        return { valid: false, message: 'Digite seu nome completo' }
    }
    return { valid: true }
}

export const validateBirthDate = (date: string): { valid: boolean; message?: string } => {
    const birthDate = new Date(date)
    const today = new Date()

    // Calcula idade
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    if (age < 16) {
        return { valid: false, message: 'Você deve ter pelo menos 16 anos' }
    }

    if (age > 120) {
        return { valid: false, message: 'Data de nascimento inválida' }
    }

    return { valid: true }
}