'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Loader, CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AppointmentData {
    user: { name: string; email: string }
    service: { name: string; description: string }
    date: string
    canReview: boolean
}

export default function AvaliarPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')

    useEffect(() => {
        verificarToken()
    }, [token])

    const verificarToken = async () => {
        try {
            const response = await fetch(`/api/reviews/submit?token=${token}`)
            const result = await response.json()

            if (result.success) {
                setAppointmentData(result.data)
            } else {
                setError(result.error || 'Token inválido ou agendamento não encontrado')
            }
        } catch {
            setError('Erro ao verificar token')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            alert('Por favor, selecione uma avaliação de 1 a 5 estrelas')
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch('/api/reviews/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    rating,
                    comment: comment.trim() || null,
                    images: []
                })
            })

            const result = await response.json()

            if (result.success) {
                setSuccess(true)
            } else {
                alert(result.error || 'Erro ao enviar avaliação')
            }
        } catch {
            alert('Erro ao enviar avaliação')
        } finally {
            setSubmitting(false)
        }
    }

    const ratingLabels: Record<number, string> = {
        1: 'Ruim 😞',
        2: 'Regular 😐',
        3: 'Bom 👍',
        4: 'Muito bom 😊',
        5: 'Excelente! ⭐'
    }

    // ── Loading ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-light tracking-widest text-sm uppercase">Carregando...</p>
                </div>
            </div>
        )
    }

    // ── Erro ────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl"
                >
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-white mb-3">Oops!</h1>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-3 bg-gradient-gold text-white rounded-xl font-semibold hover:opacity-90 transition"
                    >
                        Voltar ao Início
                    </button>
                </motion.div>
            </div>
        )
    }

    // ── Sucesso ─────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#1a1a1a] border border-gold/20 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl"
                >
                    {/* Estrelas animadas */}
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Star className="w-8 h-8 fill-gold text-gold" />
                            </motion.div>
                        ))}
                    </div>

                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-white mb-3">Obrigada pelo feedback!</h1>
                    <p className="text-gray-400 mb-8">
                        Sua avaliação foi enviada com sucesso e será analisada em breve. ✨
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-3 bg-gradient-gold text-white rounded-xl font-semibold hover:opacity-90 transition"
                    >
                        Voltar ao Início
                    </button>
                </motion.div>
            </div>
        )
    }

    // ── Formulário principal ─────────────────────────────────
    return (
        <div className="min-h-screen bg-charcoal py-12 px-4">
            {/* Faixa dourada decorativa no topo */}
            <div className="h-1 bg-gradient-gold fixed top-0 left-0 right-0 z-50" />

            <div className="max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Logo / nome do salão */}
                    <div className="text-center mb-10">
                        <p className="text-gold tracking-[0.3em] text-xs uppercase font-semibold mb-2">
                            Henrique Bilro Cabeleireiros
                        </p>
                        <h1 className="text-3xl font-bold text-white leading-tight">
                            Como foi sua experiência?
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            Serviço:{' '}
                            <span className="text-gold font-semibold">
                                {appointmentData?.service.name}
                            </span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            {new Date(appointmentData?.date || '').toLocaleDateString('pt-BR', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Estrelas */}
                            <div className="text-center">
                                <label className="block text-sm font-semibold text-gray-300 mb-5 tracking-wide uppercase">
                                    Sua Avaliação
                                </label>
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-all duration-150 hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                size={44}
                                                className={`transition-colors duration-150 ${star <= (hoverRating || rating)
                                                        ? 'fill-gold text-gold drop-shadow-[0_0_8px_rgba(180,145,60,0.6)]'
                                                        : 'text-gray-600'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {(hoverRating || rating) > 0 && (
                                        <motion.p
                                            key={hoverRating || rating}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="mt-4 text-gold font-semibold text-sm"
                                        >
                                            {ratingLabels[hoverRating || rating]}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divisor */}
                            <div className="border-t border-white/5" />

                            {/* Comentário */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
                                    Comentário{' '}
                                    <span className="text-gray-500 normal-case font-normal">(opcional)</span>
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 resize-none transition"
                                    placeholder="O que você achou do atendimento, do resultado, do ambiente..."
                                />
                            </div>

                            {/* Botão */}
                            <button
                                type="submit"
                                disabled={submitting || rating === 0}
                                className="w-full py-4 bg-gradient-gold text-white text-base font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Avaliação'
                                )}
                            </button>

                            {rating === 0 && (
                                <p className="text-center text-gray-600 text-xs">
                                    Selecione pelo menos uma estrela para continuar
                                </p>
                            )}
                        </form>
                    </div>

                    <p className="text-center text-gray-600 text-xs mt-6">
                        Henrique Bilro Cabeleireiros · Av. Rio Doce, 3101 – Potengi, Natal/RN
                    </p>
                </motion.div>
            </div>
        </div>
    )
}