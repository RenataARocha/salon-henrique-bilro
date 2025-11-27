'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
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

        setLoading(true)

        try {
            // TODO: Implementar registro
            console.log('Cadastro:', formData)

            // Simulação
            await new Promise(resolve => setTimeout(resolve, 1500))

            alert('Conta criada com sucesso! Faça login para continuar.')
            window.location.href = '/login'
        } catch (err) {
            setError('Erro ao criar conta. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
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

                {/* Formulário */}
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <div className="space-y-6">
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
                            helperText="Opcional - para lembretes de agendamento"
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
                            onClick={handleSubmit}
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full"
                        >
                            Cadastrar
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-gold hover:text-gold-dark font-semibold">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Link para voltar */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Voltar para o início
                    </Link>
                </div>
            </div>
        </div>
    )
}