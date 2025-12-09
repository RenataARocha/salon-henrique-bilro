// src/lib/admin-credentials.ts

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const CREDENTIALS_PATH = join(process.cwd(), 'admin-credentials.json')

interface AdminCredentials {
    email: string
    password: string
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
    try {
        if (!existsSync(CREDENTIALS_PATH)) {
            // Criar arquivo padrão se não existir
            const defaultCreds = {
                email: 'admin@henriquebilro.com',
                password: await bcrypt.hash('admin123', 10)
            }
            writeFileSync(CREDENTIALS_PATH, JSON.stringify(defaultCreds, null, 2))
            return defaultCreds
        }

        const data = readFileSync(CREDENTIALS_PATH, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Erro ao ler credenciais admin:', error)
        throw error
    }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
    try {
        const creds = await getAdminCredentials()

        if (email !== creds.email) return false

        return await bcrypt.compare(password, creds.password)
    } catch (error) {
        console.error('Erro ao verificar credenciais:', error)
        return false
    }
}

export async function updateAdminCredentials(newEmail?: string, newPassword?: string): Promise<void> {
    const currentCreds = await getAdminCredentials()

    const updatedCreds = {
        email: newEmail || currentCreds.email,
        password: newPassword ? await bcrypt.hash(newPassword, 10) : currentCreds.password
    }

    writeFileSync(CREDENTIALS_PATH, JSON.stringify(updatedCreds, null, 2))
}