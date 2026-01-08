// components/admin/BlockedTimeForm.tsx - CORRIGIDO

'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BlockedTime {
    id: string
    type: string
    date?: string
    startTime?: string
    endTime?: string
    dayOfWeek?: number
    isRecurring: boolean
    reason: string
    description?: string
    startDate?: string
    endDate?: string
}

interface Props {
    onClose: () => void
    onSuccess: () => void
    editData?: BlockedTime | null
}

const BLOCK_TYPES = [
    { value: 'LUNCH_BREAK', label: '🍽️ Horário de Almoço' },
    { value: 'DAY_OFF', label: '📅 Folga/Descanso' },
    { value: 'HOLIDAY', label: '🎉 Feriado' },
    { value: 'VACATION', label: '✈️ Férias' },
    { value: 'MAINTENANCE', label: '🔧 Manutenção' },
    { value: 'SPECIAL_EVENT', label: '📚 Evento Especial' },
    { value: 'OTHER', label: '📝 Outro Motivo' }
]

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
]

export default function BlockedTimeForm({ onClose, onSuccess, editData }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [type, setType] = useState(editData?.type || 'DAY_OFF')
    const [isRecurring, setIsRecurring] = useState(editData?.isRecurring || false)
    const [reason, setReason] = useState(editData?.reason || '')
    const [description, setDescription] = useState(editData?.description || '')

    // Pontual
    const [date, setDate] = useState(editData?.date?.split('T')[0] || '')
    const [startTime, setStartTime] = useState(editData?.startTime || '')
    const [endTime, setEndTime] = useState(editData?.endTime || '')

    // Recorrente
    const [dayOfWeek, setDayOfWeek] = useState<number>(editData?.dayOfWeek ?? 0)
    const [recurringStartTime, setRecurringStartTime] = useState(editData?.startTime || '')
    const [recurringEndTime, setRecurringEndTime] = useState(editData?.endTime || '')
    const [startDate, setStartDate] = useState(editData?.startDate?.split('T')[0] || '')
    const [endDate, setEndDate] = useState(editData?.endDate?.split('T')[0] || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // ✅ VALIDAÇÃO SIMPLIFICADA - Apenas motivo obrigatório
        if (!reason.trim()) {
            setError('Por favor, informe o motivo do bloqueio')
            return
        }

        setLoading(true)

        try {
            const payload: any = {
                type,
                reason: reason.trim(),
                description: description.trim() || undefined,
                isRecurring
            }

            if (isRecurring) {
                // Bloqueio Recorrente
                payload.dayOfWeek = dayOfWeek
                payload.startTime = recurringStartTime || undefined
                payload.endTime = recurringEndTime || undefined
                payload.startDate = startDate || undefined
                payload.endDate = endDate || undefined
            } else {
                // Bloqueio Pontual
                payload.date = date || undefined
                payload.startTime = startTime || undefined
                payload.endTime = endTime || undefined
            }

            const url = editData
                ? `/api/admin/blocked-times/${editData.id}`
                : '/api/admin/blocked-times'

            const res = await fetch(url, {
                method: editData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (data.success) {
                alert(editData ? 'Bloqueio atualizado!' : 'Bloqueio criado!')
                if (onSuccess) {
                    onSuccess() // Recarrega a lista
                }
                onClose() // Fecha o modal
            } else {
                setError(data.error || 'Erro ao salvar bloqueio')
            }
        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao salvar bloqueio')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ✅ HEADER FIXO */}
                <div className="sticky top-0 bg-gradient-gold text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {editData ? 'Editar Bloqueio' : 'Novo Bloqueio de Horário'}
                        </h2>
                        <p className="text-white/90 text-sm mt-1">
                            Configure horários indisponíveis
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        type="button"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Erro */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Tipo de Bloqueio */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Tipo de Bloqueio *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            required
                        >
                            {BLOCK_TYPES.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recorrente? */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="mt-1 w-5 h-5 text-gold rounded focus:ring-gold"
                            />
                            <div>
                                <p className="font-semibold text-charcoal">Bloqueio Recorrente</p>
                                <p className="text-sm text-gray-600">
                                    Se repete toda semana no mesmo dia (ex: almoço toda terça-feira)
                                </p>
                            </div>
                        </label>
                    </div>

                    {!isRecurring ? (
                        // ===== BLOQUEIO PONTUAL =====
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold text-charcoal flex items-center gap-2">
                                <Calendar size={20} className="text-gold" />
                                Bloqueio Pontual (Data Específica)
                            </h3>

                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-2">
                                    Data (opcional)
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Deixe vazio para bloquear o dia inteiro
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Horário Início (opcional)
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Horário Fim (opcional)
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Deixe vazio para bloquear o dia inteiro (00:00 - 23:59)
                            </p>
                        </div>
                    ) : (
                        // ===== BLOQUEIO RECORRENTE =====
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold text-charcoal flex items-center gap-2">
                                <Clock size={20} className="text-gold" />
                                Bloqueio Recorrente (Repete Toda Semana)
                            </h3>

                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-2">
                                    Dia da Semana *
                                </label>
                                <select
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    required
                                >
                                    {DAYS_OF_WEEK.map(d => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Horário Início (opcional)
                                    </label>
                                    <input
                                        type="time"
                                        value={recurringStartTime}
                                        onChange={(e) => setRecurringStartTime(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Horário Fim (opcional)
                                    </label>
                                    <input
                                        type="time"
                                        value={recurringEndTime}
                                        onChange={(e) => setRecurringEndTime(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-2">
                                    📅 Período de Validade (opcional)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-blue-800 mb-1">
                                            Válido de:
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-800 mb-1">
                                            Até:
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-blue-700 mt-2">
                                    Se não preencher, o bloqueio vale para sempre
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Motivo */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Motivo *
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Folga, Feriado de Natal, Almoço..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalhes adicionais..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none resize-none"
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : editData ? 'Atualizar' : 'Criar Bloqueio'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}