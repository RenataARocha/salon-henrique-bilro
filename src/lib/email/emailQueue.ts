// lib/email/emailQueue.ts

import Bull, { Queue, Job } from 'bull'
import { sendPasswordResetEmail } from './resend'

// Tipos de jobs de email
export interface PasswordResetEmailJob {
    email: string
    resetUrl: string
    userName?: string
}

export type EmailJob = PasswordResetEmailJob

// Criar fila de emails
let emailQueue: Queue<EmailJob> | null = null

export function getEmailQueue(): Queue<EmailJob> {
    if (!emailQueue) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

        emailQueue = new Bull<EmailJob>('email-queue', redisUrl, {
            defaultJobOptions: {
                attempts: 3, // Tentar 3 vezes em caso de falha
                backoff: {
                    type: 'exponential',
                    delay: 2000, // 2s, 4s, 8s
                },
                removeOnComplete: 100, // Manter últimos 100 jobs completos
                removeOnFail: 500, // Manter últimos 500 jobs com falha
            },
        })

        // Processar jobs da fila
        emailQueue.process(async (job: Job<EmailJob>) => {
            const startTime = Date.now()
            console.log(`📧 Processando email job #${job.id}`)

            try {
                // Identificar tipo de email e enviar
                const jobData = job.data as PasswordResetEmailJob

                await sendPasswordResetEmail({
                    to: jobData.email,
                    resetUrl: jobData.resetUrl,
                    userName: jobData.userName,
                })

                const duration = Date.now() - startTime
                console.log(`✅ Email enviado com sucesso em ${duration}ms - Job #${job.id}`)

                return { success: true, duration }
            } catch (error) {
                const duration = Date.now() - startTime
                console.error(`❌ Erro ao enviar email - Job #${job.id}:`, error)
                console.error(`⏱️ Falha após ${duration}ms`)

                throw error // Re-lançar para Bull tentar novamente
            }
        })

        // Event listeners para monitoramento
        emailQueue.on('completed', (job, result) => {
            console.log(`✅ Job #${job.id} completado:`, result)
        })

        emailQueue.on('failed', (job, err) => {
            console.error(`❌ Job #${job?.id} falhou após todas tentativas:`, err.message)
        })

        emailQueue.on('error', (error) => {
            console.error('❌ Erro na fila de emails:', error)
        })

        console.log('✅ Fila de emails inicializada')
    }

    return emailQueue
}

// Adicionar email à fila
export async function queuePasswordResetEmail(data: PasswordResetEmailJob) {
    const queue = getEmailQueue()

    const job = await queue.add(data, {
        priority: 1, // Alta prioridade
        jobId: `reset-${data.email}-${Date.now()}`, // ID único
    })

    console.log(`📬 Email de reset adicionado à fila - Job #${job.id}`)

    return job.id
}

// Verificar status de um job
export async function getJobStatus(jobId: string) {
    const queue = getEmailQueue()
    const job = await queue.getJob(jobId)

    if (!job) {
        return { status: 'not_found' }
    }

    const state = await job.getState()

    return {
        status: state,
        progress: job.progress(),
        attempts: job.attemptsMade,
        data: job.data,
    }
}

// Limpar fila (útil para desenvolvimento)
export async function clearQueue() {
    const queue = getEmailQueue()
    await queue.empty()
    console.log('🗑️ Fila de emails limpa')
}