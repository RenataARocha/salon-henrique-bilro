// ==========================================
// app/(auth)/register/page.tsx - COM DATA DE NASCIMENTO
// ==========================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: '', // <- NOVO
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validações
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres')
            return
        }

        // Validar idade (opcional - mínimo 18 anos)
        if (formData.birthDate) {
            const birthDate = new Date(formData.birthDate)
            const today = new Date()
            const age = today.getFullYear() - birthDate.getFullYear()

            if (age < 16) {
                setError('Você deve ter pelo menos 16 anos para se cadastrar')
                return
            }
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    birthDate: formData.birthDate || null,
                    password: formData.password
                })
            })

            const data = await response.json()

            if (data.success) {
                alert('✅ Conta criada com sucesso! Faça login para continuar.')
                router.push('/login')
            } else {
                setError(data.error || 'Erro ao criar conta. Tente novamente.')
            }
        } catch (err) {
            setError('Erro ao criar conta. Tente novamente.')
            console.error('Erro:', err)
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
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">
                                {error}
                            </div>
                        )}

                        <Input
                            id="name"
                            type="text"
                            label="Nome Completo"
                            placeholder="Seu nome"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />

                        <Input
                            id="phone"
                            type="tel"
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            helperText="Opcional - para lembretes"
                        />

                        {/* NOVO CAMPO - DATA DE NASCIMENTO */}
                        <Input
                            id="birthDate"
                            type="date"
                            label="Data de Nascimento"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            helperText="Para oferecermos descontos especiais no seu aniversário! 🎂"
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="Mínimo 6 caracteres"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />

                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirmar Senha"
                            placeholder="Digite a senha novamente"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
