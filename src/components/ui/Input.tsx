// src/components/ui/Input.tsx

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-3 border rounded-lg
                            focus:ring-2 focus:ring-yellow-600 focus:border-transparent
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            transition-all duration-200
                            ${error ? 'border-red-500' : 'border-gray-300'}
                            ${icon ? 'pl-11' : ''}
                            ${className}
                        `}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
                        {...props}
                    />
                </div>
                {error && (
                    <p id={`${props.id}-error`} className="mt-2 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${props.id}-helper`} className="mt-2 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input