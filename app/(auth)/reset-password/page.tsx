// app/(auth)/reset-password/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, XCircle } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { validatePassword } from '@/lib/validation'

export default function ResetPasswordPage() {
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
        if (!token) {
            setValidating(false)
            return
        }

        validateToken()
    }, [token])

    const validateToken = async () => {
        try {
            const response = await fetch(`/api/auth/reset-password?token=${token}`)
            const data = await response.json()

            if (data.success) {
                setTokenValid(true)
                setUserEmail(data.data.email)
            } else {
                showToast(data.error || 'Link inválido ou expirado', 'error')
            }
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

        // Validar senha
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) {
            newErrors.password = passwordValidation.message || 'Senha inválida'
        }

        // Confirmar senha
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem'
        }

        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) {
            showToast('Corrija os erros no formulário', 'error')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
                showToast('Senha redefinida com sucesso!', 'success')

                // Redirecionar para login após 3 segundos
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
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

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-white">Validando link...</p>
                </div>
            </div>
        )
    }

    if (!token || !tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <Logo variant="header" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-charcoal mb-2">
                            Link Inválido ou Expirado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Este link de redefinição de senha é inválido ou já expirou.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="inline-block bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Solicitar Novo Link
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <Logo variant="header" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-charcoal mb-2">
                            Senha Redefinida!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em instantes...
                        </p>
                        <Link
                            href="/login"
                            className="inline-block bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Ir para Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-charcoal py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <Logo variant="header" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Redefinir Senha
                    </h2>
                    <p className="text-gray-400">
                        Olá! Crie uma nova senha para {userEmail}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                            <p className="text-sm text-blue-800 flex items-start gap-2">
                                <Lock size={16} className="mt-0.5 flex-shrink-0" />
                                <span>Escolha uma senha forte com no mínimo 6 caracteres.</span>
                            </p>
                        </div>

                        <Input
                            id="password"
                            type="password"
                            label="Nova Senha"
                            placeholder="Digite sua nova senha"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                        />

                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirmar Nova Senha"
                            placeholder="Digite novamente"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={errors.confirmPassword}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full"
                        >
                            Redefinir Senha
                        </Button>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    )
}