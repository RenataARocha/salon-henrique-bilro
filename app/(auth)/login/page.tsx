'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/Logo'
import { useToast } from '@/components/ui/ToastContainer'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const router = useRouter()
    const { showToast } = useToast()
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
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false
            })

            if (result?.error) {
                setError('Email ou senha incorretos')
                showToast('Email ou senha incorretos', 'error')
                setLoading(false)
                return
            }

            if (result?.ok) {
                showToast('Login realizado com sucesso!', 'success')

                const sessionResponse = await fetch('/api/auth/session')
                const session = await sessionResponse.json()

                if (session?.user?.role === 'ADMIN') {
                    router.push('/admin')
                } else {
                    router.push('/agendar')
                }

                router.refresh()
            }
        } catch (err) {
            console.error('Erro no login:', err)
            setError('Erro ao fazer login. Tente novamente.')
            showToast('Erro ao fazer login. Tente novamente.', 'error')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center 
bg-[#0a0a0a] 
bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] 
py-8 sm:py-12 px-4 sm:px-6">
            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="text-center mb-6 sm:mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="scale-90 sm:scale-100">
                            <Logo variant="header" />
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Bem-vindo de volta!
                    </h2>

                    <p className="text-sm sm:text-base text-gray-400">
                        Entre com sua conta para agendar
                    </p>
                </motion.div>

                <motion.div
                    className="bg-white rounded-xl shadow-2xl p-5 sm:p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {error && (
                            <motion.div
                                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                                role="alert"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                {error}
                            </motion.div>
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

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Lembrar-me
                                </span>
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-sm text-gold hover:text-gold-dark font-semibold transition-colors"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full"
                        >
                            Entrar
                        </Button>
                    </form>

                    <div className="mt-5 sm:mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Não tem uma conta?{' '}
                            <Link
                                href="/register"
                                className="text-gold hover:text-gold-dark font-semibold"
                            >
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    className="text-center mt-5 sm:mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Link
                        href="/"
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        ← Voltar para o início
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}