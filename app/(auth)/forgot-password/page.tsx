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
    const [countdown, setCountdown] = useState(0)
    const [canResend, setCanResend] = useState(true)

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
        if (!validateEmail(email)) { setError('Digite um email válido'); return }
        if (!canResend) { showToast(`Aguarde ${countdown} segundos para reenviar`, 'warning'); return }
        setLoading(true)
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            })
            const data = await response.json()
            if (data.success) {
                setSent(true); setCanResend(false); setCountdown(60)
                showToast('Instruções enviadas! Verifique seu email.', 'success')
                if (data.devOnly?.resetUrl) {
                    console.log('🔗 Link de reset (DEV):', data.devOnly.resetUrl)
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
        if (canResend) { setSent(false); handleSubmit(new Event('submit') as any) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] py-8 sm:py-12 px-4 sm:px-6">
            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="scale-90 sm:scale-100"><Logo variant="header" /></div>
                    </div>
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="h-px w-6 bg-gold opacity-60" />
                        <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Recuperar acesso</span>
                        <div className="h-px w-6 bg-gold opacity-60" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Esqueceu sua senha?</h2>
                    <p className="text-sm sm:text-base text-white/40 px-2 sm:px-0">
                        Digite seu email e enviaremos instruções para redefinir sua senha.
                    </p>
                </div>

                {/* Card */}
                <motion.div
                    className="bg-[#141414] border border-white/8 rounded-xl shadow-2xl shadow-black/60 p-5 sm:p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-950/50 border border-red-700/30 text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="bg-blue-950/40 border-l-4 border-blue-600/60 border border-blue-800/30 rounded-lg p-3 sm:p-4">
                                <div className="flex items-start gap-3">
                                    <Clock size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs sm:text-sm text-blue-300/80">
                                        <p className="font-semibold text-blue-300 mb-1">Tempo de entrega:</p>
                                        <p>O email é processado instantaneamente e pode levar <strong className="text-blue-300">1-3 minutos</strong> para chegar. Verifique também sua caixa de spam.</p>
                                    </div>
                                </div>
                            </div>

                            <Input
                                id="email" type="email" label="Email"
                                placeholder="seu@email.com" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />

                            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                                Enviar Instruções
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 sm:py-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-950/60 border border-emerald-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-emerald-400" size={26} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Email Enviado!</h3>
                            <p className="text-sm sm:text-base text-white/50 mb-4 px-2">
                                Enviamos instruções para <strong className="text-white/80">{email}</strong>
                            </p>

                            <div className="bg-yellow-950/40 border border-yellow-800/30 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6 text-left">
                                <div className="flex items-start gap-2">
                                    <Clock size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs sm:text-sm text-yellow-300/80">
                                        <p className="font-semibold text-yellow-300">Aguarde 1-3 minutos</p>
                                        <p className="mt-1">O email está sendo processado e chegará em breve. Verifique também sua caixa de spam.</p>
                                    </div>
                                </div>
                            </div>

                            {!canResend ? (
                                <button disabled className="flex items-center justify-center gap-2 mx-auto text-xs sm:text-sm text-white/25 font-semibold cursor-not-allowed">
                                    <RefreshCw size={13} className="animate-spin" />
                                    Reenviar em {countdown}s
                                </button>
                            ) : (
                                <button onClick={handleResend} className="flex items-center justify-center gap-2 mx-auto text-gold hover:text-yellow-400 font-semibold text-xs sm:text-sm transition-colors">
                                    <RefreshCw size={13} />
                                    Reenviar email
                                </button>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/8">
                                <button onClick={() => { setSent(false); setEmail('') }} className="text-xs sm:text-sm text-white/30 hover:text-white/60 transition-colors">
                                    Tentar outro email
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 sm:mt-6 text-center border-t border-white/8 pt-5">
                        <Link href="/login" className="flex items-center justify-center gap-2 text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                            <ArrowLeft size={13} />
                            Voltar para o login
                        </Link>
                    </div>
                </motion.div>

                <div className="text-center mt-5 sm:mt-6">
                    <Link href="/" className="text-white/25 hover:text-white/60 text-sm transition-colors">← Voltar para o início</Link>
                </div>
            </motion.div>
        </div>
    )
}