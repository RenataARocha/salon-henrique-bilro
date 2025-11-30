// src/components/JustificationModal.tsx

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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appointmentId,
                    justification: justification.trim()
                })
            })

            const data = await response.json()

            if (data.success) {
                showToast('Justificativa enviada com sucesso!', 'success')
                onSuccess()
                onClose()
            } else {
                showToast(data.error || 'Erro ao enviar justificativa', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao enviar justificativa', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal">
                                Justificar Falta
                            </h2>
                            <p className="text-sm text-gray-600">
                                Explique o motivo da sua ausência
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Informações do Agendamento */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-charcoal mb-3">Detalhes do Agendamento:</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600 mb-1">Serviço</p>
                            <p className="font-semibold text-charcoal">{serviceName}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 mb-1">Data</p>
                            <p className="font-semibold text-charcoal">
                                {new Date(date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 mb-1">Horário</p>
                            <p className="font-semibold text-charcoal">{time}</p>
                        </div>
                    </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Por que você não pôde comparecer? *
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Descreva o motivo da sua ausência (mínimo 10 caracteres)..."
                            rows={6}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                Mínimo 10 caracteres
                            </p>
                            <p className="text-xs text-gray-500">
                                {justification.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Aviso */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>📌 Importante:</strong> Sua justificativa será analisada pela equipe do salão.
                            Justificativas honestas ajudam a manter um bom relacionamento e podem ser consideradas
                            em futuros agendamentos.
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-charcoal py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
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