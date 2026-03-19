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
import { motion } from 'framer-motion'

export default function RegisterPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', birthDate: '', password: '', confirmPassword: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}
        const nameValidation = validateName(formData.name)
        if (!nameValidation.valid) newErrors.name = nameValidation.message || 'Nome inválido'
        if (!validateEmail(formData.email)) newErrors.email = 'Email inválido'
        if (formData.phone && !validatePhone(formData.phone)) newErrors.phone = 'Telefone inválido'
        if (formData.birthDate) {
            const birthValidation = validateBirthDate(formData.birthDate)
            if (!birthValidation.valid) newErrors.birthDate = birthValidation.message || 'Data inválida'
        }
        const passwordValidation = validatePassword(formData.password)
        if (!passwordValidation.valid) newErrors.password = passwordValidation.message || 'Senha inválida'
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) { showToast('Por favor, corrija os erros no formulário', 'error'); return }
        setLoading(true)
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setTimeout(() => router.push('/login'), 1500)
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] py-8 sm:py-12 px-4 sm:px-6">
            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <motion.div
                    className="text-center mb-6 sm:mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="scale-90 sm:scale-100"><Logo variant="header" /></div>
                    </div>
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="h-px w-6 bg-gold opacity-60" />
                        <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Novo cadastro</span>
                        <div className="h-px w-6 bg-gold opacity-60" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Crie sua conta</h2>
                    <p className="text-sm sm:text-base text-white/40 px-2 sm:px-0">
                        Cadastre-se para agendar seus horários
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="bg-[#141414] border border-white/8 rounded-xl shadow-2xl shadow-black/60 p-5 sm:p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <Input id="name" type="text" label="Nome Completo" placeholder="João Silva" required
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} />

                        <Input id="email" type="email" label="Email" placeholder="joao@email.com" required
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} />

                        <PhoneInput id="phone" label="Telefone" placeholder="(00) 00000-0000"
                            value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })}
                            helperText="Opcional - para lembretes" />

                        <Input id="birthDate" type="date" label="Data de Nascimento"
                            value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            helperText="Para descontos especiais no seu aniversário! 🎂" error={errors.birthDate} />

                        <Input id="password" type="password" label="Senha" placeholder="Mínimo 6 caracteres" required
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={errors.password} />

                        <Input id="confirmPassword" type="password" label="Confirmar Senha" placeholder="Digite a senha novamente" required
                            value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} error={errors.confirmPassword} />

                        <div className="flex items-start gap-2.5">
                            <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded accent-gold flex-shrink-0" />
                            <label className="text-xs sm:text-sm text-white/50 leading-relaxed">
                                Aceito os{' '}
                                <a href="#" className="text-gold hover:text-yellow-400 font-semibold transition-colors">termos de uso</a>
                                {' '}e{' '}
                                <a href="#" className="text-gold hover:text-yellow-400 font-semibold transition-colors">política de privacidade</a>
                            </label>
                        </div>

                        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                            Cadastrar
                        </Button>
                    </form>

                    <div className="mt-5 pt-5 border-t border-white/8 text-center">
                        <p className="text-sm text-white/40">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-gold hover:text-yellow-400 font-semibold transition-colors">Entrar</Link>
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    className="text-center mt-5 sm:mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Link href="/" className="text-white/25 hover:text-white/60 text-sm transition-colors">← Voltar para o início</Link>
                </motion.div>
            </motion.div>
        </div>
    )
}