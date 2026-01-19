// app/(auth)/forgot-password/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Clock, RefreshCw } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { validateEmail } from '@/lib/validation'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
    const { showToast } = useToast()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    // Contador regressivo para reenvio
    const [countdown, setCountdown] = useState(0)
    const [canResend, setCanResend] = useState(true)

    // Contador regressivo
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (countdown === 0 && !canResend) {
            setCanResend(true)
        }
    }, [countdown, canResend])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!validateEmail(email)) {
            setError('Digite um email válido')
            return
        }

        if (!canResend) {
            showToast(`Aguarde ${countdown} segundos para reenviar`, 'warning')
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
                setCanResend(false)
                setCountdown(60) // 60 segundos até poder reenviar
                showToast('Instruções enviadas! Verifique seu email.', 'success')

                // APENAS PARA DESENVOLVIMENTO
                if (data.devOnly?.resetUrl) {
                    console.log('🔗 Link de reset (DEV):', data.devOnly.resetUrl)
                    console.log('📋 Copie este link se o email demorar')
                }
            } else {
                setError(data.error || 'Erro ao enviar email')
                showToast(data.error || 'Erro ao enviar email', 'error')
            }
        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao processar solicitação')
            showToast('Erro ao processar solicitação', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = () => {
        if (canResend) {
            setSent(false)
            handleSubmit(new Event('submit') as any)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
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

                            {/* Aviso sobre tempo de entrega */}
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <div className="flex items-start gap-3">
                                    <Clock size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Tempo de entrega:</p>
                                        <p>O email é processado instantaneamente e pode levar <strong>1-3 minutos</strong> para chegar. Verifique também sua caixa de spam.</p>
                                    </div>
                                </div>
                            </div>

                            <Input
                                id="email"
                                type="email"
                                label="Email"
                                placeholder="seu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                            <p className="text-gray-600 mb-4">
                                Enviamos instruções para <strong>{email}</strong>
                            </p>

                            {/* Destaque sobre tempo de espera */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-2 text-left">
                                    <Clock size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold">Aguarde 1-3 minutos</p>
                                        <p className="mt-1">O email está sendo processado e chegará em breve. Verifique também sua caixa de spam.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Reenviar com Contador */}
                            {!canResend ? (
                                <button
                                    disabled
                                    className="flex items-center justify-center gap-2 mx-auto text-sm text-gray-400 font-semibold cursor-not-allowed"
                                >
                                    <RefreshCw size={16} className="animate-spin" />
                                    Reenviar em {countdown}s
                                </button>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    className="flex items-center justify-center gap-2 mx-auto text-gold hover:text-gold-dark font-semibold text-sm transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Reenviar email
                                </button>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setSent(false)
                                        setEmail('')
                                    }}
                                    className="text-sm text-gray-600 hover:text-charcoal transition-colors"
                                >
                                    Tentar outro email
                                </button>
                            </div>
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
            </motion.div>
        </div >
    )
}