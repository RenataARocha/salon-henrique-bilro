// src/lib/auth.ts 

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios')
                }

                // 1. VERIFICAR SE É ADMIN (usando variáveis de ambiente)
                const adminEmail = process.env.ADMIN_EMAIL
                const adminPassword = process.env.ADMIN_PASSWORD
                const adminName = process.env.ADMIN_NAME || 'Admin'

                if (adminEmail && credentials.email === adminEmail) {
                    // Comparar senha diretamente (texto puro nas env vars)
                    if (credentials.password === adminPassword) {
                        return {
                            id: 'admin-' + adminEmail,
                            email: adminEmail,
                            name: adminName,
                            role: 'ADMIN'
                        }
                    }
                    throw new Error('Credenciais inválidas')
                }

                // 2. VERIFICAR USUÁRIOS NORMAIS NO BANCO
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password) {
                    throw new Error('Credenciais inválidas')
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    throw new Error('Credenciais inválidas')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60,
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
}