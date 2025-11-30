'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import PhoneInput from '@/components/ui/PhoneInput'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { validateEmail, validatePassword, validateName, validateBirthDate, validatePhone } from '@/lib/validation'
import { removeMask } from '@/lib/masks'

export default function RegisterPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        // Validar nome
        const nameValidation = validateName(formData.name)
        if (!nameValidation.valid) {
            newErrors.name = nameValidation.message || 'Nome inválido'
        }

        // Validar email
        if (!validateEmail(formData.email)) {
            newErrors.email = 'Email inválido'
        }

        // Validar telefone (se preenchido)
        if (formData.phone && !validatePhone(formData.phone)) {
            newErrors.phone = 'Telefone inválido'
        }

        // Validar data de nascimento (se preenchida)
        if (formData.birthDate) {
            const birthValidation = validateBirthDate(formData.birthDate)
            if (!birthValidation.valid) {
                newErrors.birthDate = birthValidation.message || 'Data inválida'
            }
        }

        // Validar senha
        const passwordValidation = validatePassword(formData.password)
        if (!passwordValidation.valid) {
            newErrors.password = passwordValidation.message || 'Senha inválida'
        }

        // Confirmar senha
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            showToast('Por favor, corrija os erros no formulário', 'error')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone ? removeMask(formData.phone) : null,
                    birthDate: formData.birthDate || null,
                    password: formData.password
                })
            })

            const data = await response.json()

            if (data.success) {
                showToast('✅ Conta criada com sucesso!', 'success')
                setTimeout(() => {
                    router.push('/login')
                }, 1500)
            } else {
                showToast(data.error || 'Erro ao criar conta', 'error')
            }
        } catch (err) {
            console.error('Erro:', err)
            showToast('Erro ao criar conta. Tente novamente.', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <Logo variant="header" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Crie sua conta
                    </h2>
                    <p className="text-gray-400">
                        Cadastre-se para agendar seus horários
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            id="name"
                            type="text"
                            label="Nome Completo"
                            placeholder="João Silva"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                        />

                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="joao@email.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                        />

                        <PhoneInput
                            id="phone"
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value })}
                            helperText="Opcional - para lembretes"
                        />

                        <Input
                            id="birthDate"
                            type="date"
                            label="Data de Nascimento"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            helperText="Para descontos especiais no seu aniversário! 🎂"
                            error={errors.birthDate}
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="Mínimo 6 caracteres"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                        />

                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirmar Senha"
                            placeholder="Digite a senha novamente"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            error={errors.confirmPassword}
                        />

                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                required
                                className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold mt-1"
                            />
                            <label className="ml-2 text-sm text-gray-600">
                                Aceito os{' '}
                                <a href="#" className="text-gold hover:text-gold-dark font-semibold">
                                    termos de uso
                                </a>{' '}
                                e{' '}
                                <a href="#" className="text-gold hover:text-gold-dark font-semibold">
                                    política de privacidade
                                </a>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full"
                        >
                            Cadastrar
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-gold hover:text-gold-dark font-semibold">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Voltar para o início
                    </Link>
                </div>
            </div>
        </div>
    )
}