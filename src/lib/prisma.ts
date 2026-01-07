// src/lib/prisma.ts - SINGLETON OTIMIZADO PARA VERCEL

import { PrismaClient } from '@prisma/client'

// Declaração global para evitar múltiplas instâncias
declare global {
    var prisma: PrismaClient | undefined
}

// Singleton: Criar apenas UMA instância do Prisma
export const prisma =
    global.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        // IMPORTANTE: Configurações para Vercel
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

// Em desenvolvimento, salvar na variável global para hot-reload
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

// Fechar conexões ao finalizar (importante para serverless)
process.on('beforeExit', async () => {
    await prisma.$disconnect()
})