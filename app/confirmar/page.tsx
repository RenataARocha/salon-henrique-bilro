'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ConfirmarAgendamento() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [appointment, setAppointment] = useState<any>(null)

    useEffect(() => {
        if (id && token) {
            confirmar()
        } else {
            setStatus('error')
        }
    }, [id, token])

    async function confirmar() {
        try {
            const res = await fetch(`/api/appointments/confirm?id=${id}&token=${token}`, {
                method: 'POST'
            })
            const data = await res.json()

            if (data.success) {
                setAppointment(data.appointment)
                setStatus('success')
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

    if (status === 'loading') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.emoji}>⏳</div>
                    <h2 style={styles.title}>Confirmando...</h2>
                </div>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.emoji}>❌</div>
                    <h2 style={styles.title}>Link inválido</h2>
                    <p style={styles.text}>Este link já foi usado ou expirou.</p>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.emoji}>✅</div>
                <h2 style={styles.title}>Presença Confirmada!</h2>
                {appointment && (
                    <div style={styles.info}>
                        <p style={styles.text}>Obrigada, <strong>{appointment.userName}</strong>!</p>
                        <p style={styles.text}>📅 {appointment.date} às {appointment.time}</p>
                        <p style={styles.text}>💅 {appointment.service}</p>
                        <p style={styles.text}>📍 Henrique Bilro Cabeleireiros</p>
                    </div>
                )}
                <p style={styles.footer}>Te esperamos! 💕</p>
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    emoji: { fontSize: '64px', marginBottom: '20px' },
    title: { fontSize: '24px', color: '#333', marginBottom: '20px' },
    info: {
        background: '#f8f9fa',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px'
    },
    text: { color: '#555', margin: '8px 0', fontSize: '16px' },
    footer: { color: '#888', fontSize: '14px' }
}