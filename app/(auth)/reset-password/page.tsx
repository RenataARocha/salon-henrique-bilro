'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, XCircle } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { validatePassword } from '@/lib/validation'
import { motion } from 'framer-motion'

// ── Shared layout wrapper ────────────────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] py-8 sm:py-12 px-4 sm:px-6">
            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="scale-90 sm:scale-100"><Logo variant="header" /></div>
                </div>
                {children}
            </motion.div>
        </div>
    )
}

// ── Main component ───────────────────────────────────────────────────────────
function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showToast } = useToast()
    const token = searchParams.get('token')

    const [validating, setValidating] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!token) { setValidating(false); return }
        validateToken()
    }, [token])

    const validateToken = async () => {
        try {
            const response = await fetch(`/api/auth/reset-password?token=${token}`)
            const data = await response.json()
            if (data.success) { setTokenValid(true); setUserEmail(data.data.email) }
            else showToast(data.error || 'Link inválido ou expirado', 'error')
        } catch (error) {
            console.error('Erro ao validar token:', error)
            showToast('Erro ao validar link', 'error')
        } finally {
            setValidating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: Record<string, string> = {}
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) newErrors.password = passwordValidation.message || 'Senha inválida'
        if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem'
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) { showToast('Corrija os erros no formulário', 'error'); return }
        setLoading(true)
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })
            const data = await response.json()
            if (data.success) {
                setSuccess(true)
                showToast('Senha redefinida com sucesso!', 'success')
                setTimeout(() => router.push('/login'), 3000)
            } else {
                showToast(data.error || 'Erro ao redefinir senha', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao redefinir senha', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Loading token validation
    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4" />
                    <p className="text-white/50">Validando link...</p>
                </div>
            </div>
        )
    }

    // Token inválido
    if (!token || !tokenValid) {
        return (
            <AuthShell>
                <motion.div
                    className="bg-[#141414] border border-white/8 rounded-xl shadow-2xl shadow-black/60 p-6 sm:p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-950/60 border border-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="text-red-400" size={26} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Link Inválido ou Expirado</h3>
                    <p className="text-sm sm:text-base text-white/40 mb-5 sm:mb-6 px-2">
                        Este link de redefinição de senha é inválido ou já expirou.
                    </p>
                    <Link href="/forgot-password" className="inline-block w-full sm:w-auto bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all">
                        Solicitar Novo Link
                    </Link>
                </motion.div>
            </AuthShell>
        )
    }

    // Sucesso
    if (success) {
        return (
            <AuthShell>
                <motion.div
                    className="bg-[#141414] border border-white/8 rounded-xl shadow-2xl shadow-black/60 p-6 sm:p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-950/60 border border-emerald-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-400" size={26} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Senha Redefinida!</h3>
                    <p className="text-sm sm:text-base text-white/40 mb-5 sm:mb-6 px-2">
                        Sua senha foi redefinida com sucesso. Você será redirecionado...
                    </p>
                    <Link href="/login" className="inline-block w-full sm:w-auto bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all">
                        Ir para Login
                    </Link>
                </motion.div>
            </AuthShell>
        )
    }

    // Formulário principal
    return (
        <AuthShell>
            <div className="text-center mb-5 sm:mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                    <div className="h-px w-6 bg-gold opacity-60" />
                    <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Nova senha</span>
                    <div className="h-px w-6 bg-gold opacity-60" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Redefinir Senha</h2>
                <p className="text-sm sm:text-base text-white/40 px-2">
                    Olá! Crie uma nova senha para <span className="text-white/60">{userEmail}</span>
                </p>
            </div>

            <motion.div
                className="bg-[#141414] border border-white/9 rounded-xl shadow-2xl shadow-black/60 p-5 sm:p-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-blue-950/40 border-l-4 border-blue-600/60 border border-blue-800/30 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-blue-300/80 flex items-start gap-2">
                            <Lock size={13} className="mt-0.5 flex-shrink-0 text-blue-400" />
                            <span>Escolha uma senha forte com no mínimo 6 caracteres.</span>
                        </p>
                    </div>

                    <Input id="password" type="password" label="Nova Senha" placeholder="Digite sua nova senha" required
                        value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />

                    <Input id="confirmPassword" type="password" label="Confirmar Nova Senha" placeholder="Digite novamente" required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />

                    <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                        Redefinir Senha
                    </Button>
                </form>
            </motion.div>

            <div className="text-center mt-5 sm:mt-6">
                <Link href="/login" className="text-white/25 hover:text-white/60 text-sm transition-colors">← Voltar para o login</Link>
            </div>
        </AuthShell>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-white/50">Carregando...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}