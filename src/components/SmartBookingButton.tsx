'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'

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
    const [loading, setLoading] = useState(false)

    const handleClick = () => {
        if (status === 'loading' || loading) return

        setLoading(true)

        if (session) {
            router.push('/agendar')
        } else {
            router.push('/login')
        }
    }

    if (variant === 'link') {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`inline-block ${className}`}
                disabled={status === 'loading' || loading}
            >
                {(status === 'loading' || loading) ? 'Redirecionando...' : children}
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={`${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={status === 'loading' || loading}
        >
            {(status === 'loading' || loading) ? 'Redirecionando...' : children}
        </button>
    )
}