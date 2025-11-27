'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // TODO: Implementar autenticação com NextAuth
            console.log('Login:', formData)

            // Simulação (remover depois)
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Redirecionar após login
            window.location.href = '/agendar'
        } catch (err) {
            setError('Email ou senha incorretos')
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
                        Bem-vindo de volta!
                    </h2>
                    <p className="text-gray-400">
                        Entre com sua conta para agendar
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
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                                />
                                <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                            </label>
                            <a href="#" className="text-sm text-gold hover:text-gold-dark">
                                Esqueceu a senha?
                            </a>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full"
                        >
                            Entrar
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="text-gold hover:text-gold-dark font-semibold">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>

                    {/* Dados de teste */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold mb-2">🔐 Dados para teste:</p>
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                                <span className="font-semibold">Admin:</span> admin@henriquebilro.com / admin123
                            </p>
                            <p className="text-xs text-gray-500">
                                <span className="font-semibold">Cliente:</span> maria@example.com / cliente123
                            </p>
                        </div>
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