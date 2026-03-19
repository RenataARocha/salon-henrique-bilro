'use client'

import { useState } from 'react'
import { X, FileText } from 'lucide-react'
import Button from './ui/Button'
import { useToast } from './ui/ToastContainer'

interface JustificationModalProps {
    appointmentId: string
    serviceName: string
    date: string
    time: string
    onClose: () => void
    onSuccess: () => void
}

export default function JustificationModal({
    appointmentId,
    serviceName,
    date,
    time,
    onClose,
    onSuccess
}: JustificationModalProps) {
    const { showToast } = useToast()
    const [justification, setJustification] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (justification.trim().length < 10) {
            showToast('A justificativa deve ter no mínimo 10 caracteres', 'error')
            return
        }
        setLoading(true)
        try {
            const response = await fetch('/api/appointments/justify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId, justification: justification.trim() })
            })
            const data = await response.json()
            if (data.success) { showToast('Justificativa enviada com sucesso!', 'success'); onSuccess(); onClose() }
            else showToast(data.error || 'Erro ao enviar justificativa', 'error')
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao enviar justificativa', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141414] border border-white/8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/60">

                {/* Header */}
                <div className="flex justify-between items-start p-5 sm:p-7 border-b border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-950/60 border border-blue-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-white">
                                Justificar Falta
                            </h2>
                            <p className="text-xs sm:text-sm text-white/40">
                                Explique o motivo da sua ausência
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8"
                        aria-label="Fechar"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Detalhes do agendamento */}
                <div className="px-5 sm:px-7 py-4 bg-white/3 border-b border-white/8">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                        Detalhes do Agendamento
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-white/35 text-xs mb-1">Serviço</p>
                            <p className="font-semibold text-white/80 text-xs sm:text-sm leading-tight">{serviceName}</p>
                        </div>
                        <div>
                            <p className="text-white/35 text-xs mb-1">Data</p>
                            <p className="font-semibold text-white/80 text-xs sm:text-sm">
                                {new Date(date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-white/35 text-xs mb-1">Horário</p>
                            <p className="font-semibold text-white/80 text-xs sm:text-sm">{time}</p>
                        </div>
                    </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                            Por que você não pôde comparecer? *
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Descreva o motivo da sua ausência (mínimo 10 caracteres)..."
                            rows={5}
                            required
                            className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all resize-none text-white placeholder:text-white/25 text-sm"
                            maxLength={500}
                        />
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-white/30">Mínimo 10 caracteres</p>
                            <p className={`text-xs transition-colors ${justification.length >= 450 ? 'text-orange-400' : 'text-white/30'
                                }`}>
                                {justification.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Aviso */}
                    <div className="bg-blue-950/40 border-l-4 border-blue-600/60 border border-blue-800/30 rounded-lg p-4">
                        <p className="text-xs text-blue-300/80">
                            <strong className="text-blue-300">📌 Importante:</strong>{' '}
                            Sua justificativa será analisada pela equipe do salão.
                            Justificativas honestas ajudam a manter um bom relacionamento e podem ser consideradas
                            em futuros agendamentos.
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-white/5 border border-white/10 text-white/70 py-3 rounded-lg font-semibold hover:bg-white/8 hover:text-white transition-all text-sm sm:text-base"
                        >
                            Cancelar
                        </button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            className="flex-1"
                        >
                            Enviar Justificativa
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}