// ==========================================
// src/components/ui/PhoneInput.tsx
// ==========================================

import { InputHTMLAttributes, forwardRef } from 'react'
import { phoneMask } from '@/lib/masks'

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    label?: string
    error?: string
    helperText?: string
    value: string
    onChange: (value: string) => void
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ label, error, helperText, className = '', value, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const masked = phoneMask(e.target.value)
            onChange(masked)
        }

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="tel"
                    value={value}
                    onChange={handleChange}
                    maxLength={15} // (00) 00000-0000
                    className={`
                        w-full px-4 py-3 border rounded-lg
                        focus:ring-2 focus:ring-gold focus:border-transparent
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        transition-all duration-200
                        ${error ? 'border-red-500' : 'border-gray-300'}
                        ${className}
                    `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
                    {...props}
                />
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

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput