// src/lib/email/emailQueue.ts - VERSÃO BULLMQ (compatível Next.js)

import { Queue, Worker, Job } from 'bullmq'
import { sendPasswordResetEmail } from './resend'

// Tipos de jobs de email
export interface PasswordResetEmailJob {
    email: string
    resetUrl: string
    userName?: string
}

export type EmailJob = PasswordResetEmailJob

// Configuração de conexão Redis
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    // TLS obrigatório para Upstash
    tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
    maxRetriesPerRequest: null, // IMPORTANTE para BullMQ
}

// Fila de emails
let emailQueue: Queue<EmailJob> | null = null
let emailWorker: Worker<EmailJob> | null = null

export function getEmailQueue(): Queue<EmailJob> {
    if (!emailQueue) {
        emailQueue = new Queue<EmailJob>('email-queue', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: {
                    count: 100,
                },
                removeOnFail: {
                    count: 500,
                },
            },
        })

        console.log('✅ Fila de emails inicializada (BullMQ)')
    }

    return emailQueue
}

// Worker para processar jobs (só no servidor)
export function getEmailWorker(): Worker<EmailJob> {
    if (!emailWorker) {
        emailWorker = new Worker<EmailJob>(
            'email-queue',
            async (job: Job<EmailJob>) => {
                const startTime = Date.now()
                console.log(`📧 Processando email job #${job.id}`)

                try {
                    const jobData = job.data

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

                    throw error
                }
            },
            { connection }
        )

        // Event listeners
        emailWorker.on('completed', (job) => {
            console.log(`✅ Job #${job.id} completado`)
        })

        emailWorker.on('failed', (job, err) => {
            console.error(`❌ Job #${job?.id} falhou:`, err.message)
        })

        console.log('✅ Worker de emails inicializado')
    }

    return emailWorker
}

// Adicionar email à fila
export async function queuePasswordResetEmail(data: PasswordResetEmailJob) {
    try {
        const queue = getEmailQueue()

        const job = await queue.add('password-reset', data, {
            priority: 1,
            jobId: `reset-${data.email}-${Date.now()}`,
        })

        console.log(`📬 Email de reset adicionado à fila - Job #${job.id}`)

        // Iniciar worker se não estiver rodando
        if (!emailWorker) {
            getEmailWorker()
        }

        return job.id
    } catch (error) {
        console.error('❌ Erro ao adicionar job à fila:', error)
        throw error
    }
}

// Verificar status de um job
export async function getJobStatus(jobId: string) {
    try {
        const queue = getEmailQueue()
        const job = await queue.getJob(jobId)

        if (!job) {
            return { status: 'not_found' }
        }

        const state = await job.getState()

        return {
            status: state,
            progress: job.progress,
            attempts: job.attemptsMade,
            data: job.data,
        }
    } catch (error) {
        console.error('Erro ao buscar status do job:', error)
        return { status: 'error' }
    }
}

// Limpar fila (desenvolvimento)
export async function clearQueue() {
    try {
        const queue = getEmailQueue()
        await queue.obliterate({ force: true })
        console.log('🗑️ Fila de emails limpa')
    } catch (error) {
        console.error('Erro ao limpar fila:', error)
    }
}

// Fechar conexões (cleanup)
export async function closeQueue() {
    if (emailQueue) {
        await emailQueue.close()
        emailQueue = null
    }
    if (emailWorker) {
        await emailWorker.close()
        emailWorker = null
    }
}