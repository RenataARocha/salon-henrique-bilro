// lib/admin-auth.ts

export const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL || 'admin@henriquebilro.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: process.env.ADMIN_NAME || 'Rosie'
}

export function isAdminCredentials(email: string, password: string): boolean {
    return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password
}