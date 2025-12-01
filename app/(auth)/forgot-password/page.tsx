// app/(auth)/forgot-password/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { validateEmail } from '@/lib/validation'

export default function ForgotPasswordPage() {
    const { showToast } = useToast()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!validateEmail(email)) {
            setError('Digite um email válido')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            })

            const data = await response.json()

            if (data.success) {
                setSent(true)
                showToast('Instruções enviadas! Verifique seu email.', 'success')

                // APENAS PARA DESENVOLVIMENTO - REMOVER EM PRODUÇÃO
                if (data.devOnly?.resetUrl) {
                    console.log('🔗 Link de reset (DEV):', data.devOnly.resetUrl)
                }
            } else {
                setError(data.error || 'Erro ao enviar email')
            }
        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao processar solicitação')
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
                        Esqueceu sua senha?
                    </h2>
                    <p className="text-gray-400">
                        Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-2xl p-8">
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={loading}
                                className="w-full"
                            >
                                Enviar Instruções
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-charcoal mb-2">
                                Email Enviado!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Se existe uma conta associada a <strong>{email}</strong>, você receberá um email com instruções para redefinir sua senha.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Não recebeu? Verifique sua caixa de spam ou aguarde alguns minutos.
                            </p>
                            <button
                                onClick={() => {
                                    setSent(false)
                                    setEmail('')
                                }}
                                className="text-gold hover:text-gold-dark font-semibold text-sm"
                            >
                                Tentar outro email
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center space-y-3">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-charcoal transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Voltar para o login
                        </Link>
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