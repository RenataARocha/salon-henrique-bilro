// scripts/test-email-queue.ts
// Executar com: npx ts-node scripts/test-email-queue.ts

import { queuePasswordResetEmail, getJobStatus, getEmailQueue } from '../lib/email/emailQueue'
import { checkEmailServiceHealth } from '../lib/email/resend'

async function testEmailQueue() {
    console.log('🧪 Iniciando testes da fila de emails...\n')

    // 1. Verificar saúde do serviço de email
    console.log('1️⃣ Verificando serviço de email...')
    const isHealthy = await checkEmailServiceHealth()
    console.log(isHealthy ? '✅ Serviço OK\n' : '❌ Serviço com problemas\n')

    // 2. Adicionar email de teste à fila
    console.log('2️⃣ Adicionando email de teste à fila...')
    const jobId = await queuePasswordResetEmail({
        email: 'teste@exemplo.com',
        resetUrl: 'http://localhost:3000/reset-password?token=abc123',
        userName: 'João Teste',
    })
    console.log(`✅ Job criado: ${jobId}\n`)

    // 3. Aguardar processamento
    console.log('3️⃣ Aguardando processamento...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 4. Verificar status
    console.log('4️⃣ Verificando status do job...')
    const status = await getJobStatus(jobId as string)
    console.log('Status:', JSON.stringify(status, null, 2))
    console.log()

    // 5. Estatísticas da fila
    console.log('5️⃣ Estatísticas da fila:')
    const queue = getEmailQueue()
    const jobCounts = await queue.getJobCounts()
    console.log('Jobs na fila:', jobCounts)
    console.log()

    console.log('✅ Testes concluídos!')
    process.exit(0)
}

testEmailQueue().catch((error) => {
    console.error('❌ Erro nos testes:', error)
    process.exit(1)
})

// ============================================
// FUNÇÕES DE MONITORAMENTO
// ============================================

export async function getQueueStats() {
    const queue = getEmailQueue()

    const [
        waiting,
        active,
        completed,
        failed,
        delayed,
    ] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ])

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    }
}

export async function getRecentJobs(limit = 10) {
    const queue = getEmailQueue()

    const [completedJobs, failedJobs] = await Promise.all([
        queue.getCompleted(0, limit - 1),
        queue.getFailed(0, limit - 1),
    ])

    return {
        completed: completedJobs.map(job => ({
            id: job.id,
            email: (job.data as any).email,
            completedAt: job.finishedOn,
        })),
        failed: failedJobs.map(job => ({
            id: job.id,
            email: (job.data as any).email,
            error: job.failedReason,
            attempts: job.attemptsMade,
        })),
    }
}

// Endpoint de API para monitoramento (opcional)
// app/api/admin/email-queue/route.ts
/*
import { NextResponse } from 'next/server'
import { getQueueStats, getRecentJobs } from '@/lib/email/emailQueue'

export async function GET() {
    const stats = await getQueueStats()
    const recent = await getRecentJobs(20)

    return NextResponse.json({
        stats,
        recent,
        timestamp: new Date().toISOString(),
    })
}
*/