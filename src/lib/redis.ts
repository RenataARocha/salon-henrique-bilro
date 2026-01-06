// lib/redis.ts

import Redis from 'ioredis'

// Criar conexão Redis singleton
let redisClient: Redis | null = null

export function getRedisClient(): Redis {
    if (!redisClient) {
        // Configuração para Upstash (precisa de TLS)
        const host = process.env.REDIS_HOST || 'localhost'
        const port = parseInt(process.env.REDIS_PORT || '6379')
        const password = process.env.REDIS_PASSWORD

        redisClient = new Redis({
            host,
            port,
            password,
            maxRetriesPerRequest: null, // IMPORTANTE: null para BullMQ
            enableReadyCheck: false,
            // TLS é obrigatório para Upstash
            tls: host.includes('upstash.io') ? {} : undefined,
            // Não tentar reconectar infinitamente
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('❌ Redis: Máximo de tentativas atingido')
                    return null // Para de tentar
                }
                return Math.min(times * 200, 2000) // Espera crescente
            },
        })

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err.message)
        })

        redisClient.on('connect', () => {
            console.log('✅ Redis Connected')
        })

        redisClient.on('ready', () => {
            console.log('✅ Redis Ready')
        })
    }

    return redisClient
}

// Utilitário para rate limiting
export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
    const redis = getRedisClient()
    const current = await redis.incr(key)

    if (current === 1) {
        await redis.expire(key, windowSeconds)
    }

    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)

    return { allowed, remaining }
}

// Limpar conexão ao finalizar
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
}