// src/lib/auth.ts - VERSÃO FINAL SEM ARQUIVOS

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
                    return null
                }

                console.log('🔐 Tentando login:', credentials.email)

                // 1️⃣ VERIFICAR SE É ADMIN (variáveis de ambiente)
                const adminEmail = process.env.ADMIN_EMAIL
                const adminPassword = process.env.ADMIN_PASSWORD
                const adminName = process.env.ADMIN_NAME || 'Admin'

                if (adminEmail && credentials.email === adminEmail) {
                    console.log('👑 Login de Admin detectado')

                    if (credentials.password === adminPassword) {
                        console.log('✅ Admin autenticado com sucesso')
                        return {
                            id: 'admin-' + adminEmail,
                            email: adminEmail,
                            name: adminName,
                            role: 'ADMIN'
                        }
                    }

                    console.log('❌ Senha do admin incorreta')
                    return null
                }

                // 2️⃣ VERIFICAR USUÁRIOS NO BANCO
                console.log('👤 Verificando usuário no banco...')

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password) {
                    console.log('❌ Usuário não encontrado')
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    console.log('❌ Senha incorreta')
                    return null
                }

                console.log('✅ Usuário autenticado:', user.email)

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
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true, // ← ATIVAR LOGS PARA DEBUG
}