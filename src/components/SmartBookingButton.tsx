// src/components/SmartBookingButton.tsx

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface SmartBookingButtonProps {
    children: ReactNode
    variant?: 'button' | 'link'
    className?: string
}

export default function SmartBookingButton({
    children,
    variant = 'button',
    className = '',
}: SmartBookingButtonProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    const handleClick = () => {
        // Se está carregando, não faz nada
        if (status === 'loading') {
            return
        }

        // Se está logado, vai para agendamento
        if (session) {
            router.push('/agendar')
        } else {
            // Se NÃO está logado, vai para login
            router.push('/login')
        }
    }

    if (variant === 'link') {
        return (
            <button
                onClick={handleClick}
                className={className}
                disabled={status === 'loading'}
            >
                {status === 'loading' ? 'Carregando...' : children}
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={className}
            disabled={status === 'loading'}
        >
            {status === 'loading' ? 'Carregando...' : children}
        </button>
    )
}