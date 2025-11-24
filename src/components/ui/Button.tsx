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
    const baseStyles = 'rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800',
        secondary: 'bg-gray-800 text-white hover:bg-gray-900 active:bg-black',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        outline: 'border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 active:bg-yellow-100',
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