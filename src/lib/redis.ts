// lib/redis.ts

import Redis from 'ioredis'

// Criar conexão Redis singleton
let redisClient: Redis | null = null

export function getRedisClient(): Redis {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            // Para Upstash ou Redis Cloud, use TLS:
            // tls: process.env.NODE_ENV === 'production' ? {} : undefined,
        })

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err)
        })

        redisClient.on('connect', () => {
            console.log('✅ Redis Connected')
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