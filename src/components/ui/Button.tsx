import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'rounded-md font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-gradient-gold text-white hover:shadow-lg active:shadow-md',
        secondary: 'bg-charcoal text-white hover:bg-charcoal-light active:bg-black',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        outline: 'border-2 border-gold text-gold hover-bg-gold hover:text-white',
    }

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Carregando...
                </div>
            ) : (
                children
            )}
        </button>
    )
}