// components/ui/Input.tsx

'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', type = 'text', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false)
        const isPasswordField = type === 'password'
        const inputType = isPasswordField && showPassword ? 'text' : type

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={props.id}
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        type={inputType}
                        className={`
                            w-full px-4 py-3 
                            border rounded-lg 
                            focus:ring-2 focus:ring-gold focus:border-transparent
                            transition-all duration-200
                            ${error
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }
                            ${isPasswordField ? 'pr-12' : ''}
                            ${className}
                        `}
                        {...props}
                    />

                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-sm text-red-600 flex items-start gap-1">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </p>
                )}

                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input