// src/components/SmartBookingButton.tsx
// Botão que redireciona para /agendar se logado, ou /register se não logado

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface SmartBookingButtonProps {
    children: ReactNode
    className?: string
    variant?: 'link' | 'button'
}

export default function SmartBookingButton({
    children,
    className = '',
    variant = 'button'
}: SmartBookingButtonProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()

        if (status === 'loading') {
            return // Aguarda carregar
        }

        // Se estiver logado, vai para agendar
        // Se não, vai para cadastro
        const destination = session ? '/agendar' : '/register'
        router.push(destination)
    }

    if (variant === 'link') {
        return (
            <a
                href="#"
                onClick={handleClick}
                className={className}
            >
                {children}
            </a>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={className}
        >
            {children}
        </button>
    )
}