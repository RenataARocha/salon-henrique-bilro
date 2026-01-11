// src/components/admin/LunchBreakModal.tsx
// Modal para criar horário de almoço em múltiplos dias

'use client'

import { useState } from 'react'
import { X, Clock, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
    onClose: () => void
    onSuccess: () => void
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
]

export default function LunchBreakModal({ onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [startTime, setStartTime] = useState('12:00')
    const [endTime, setEndTime] = useState('13:00')
    const [selectedDays, setSelectedDays] = useState<number[]>([2, 3, 4, 5, 6]) // Ter-Sáb por padrão
    const [reason, setReason] = useState('Horário de Almoço')

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day))
        } else {
            setSelectedDays([...selectedDays, day].sort())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (selectedDays.length === 0) {
            setError('Selecione pelo menos um dia da semana')
            return
        }

        if (!startTime || !endTime) {
            setError('Informe o horário de início e fim do almoço')
            return
        }

        if (startTime >= endTime) {
            setError('O horário de início deve ser antes do horário de fim')
            return
        }

        setLoading(true)

        try {
            // Criar bloqueio recorrente para cada dia selecionado
            const promises = selectedDays.map(dayOfWeek =>
                fetch('/api/admin/blocked-times', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'LUNCH_BREAK',
                        dayOfWeek: dayOfWeek,
                        startTime: startTime,
                        endTime: endTime,
                        isRecurring: true,
                        reason: reason
                    })
                })
            )

            const results = await Promise.all(promises)
            const successCount = results.filter(r => r.ok).length
            const failCount = results.length - successCount

            if (successCount > 0) {
                alert(`✅ Horário de almoço criado para ${successCount} dia(s)!${failCount > 0 ? `\n⚠️ ${failCount} já existiam.` : ''}`)
                onSuccess()
                onClose()
            } else {
                setError('Erro ao criar horários de almoço')
            }
        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao criar horários de almoço')
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
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
                    <div>
                        <h2 className="text-2xl font-bold">🍽️ Horário de Almoço</h2>
                        <p className="text-white/90 text-sm mt-1">
                            Configure o horário de almoço para múltiplos dias
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
                            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Horários */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Início do Almoço *
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Fim do Almoço *
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                                required
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Dica:</strong> Durante este período, nenhum agendamento poderá ser feito nos dias selecionados.
                        </p>
                    </div>

                    {/* Dias da Semana */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-3">
                            Aplicar nos Dias *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {DAYS_OF_WEEK.map(day => (
                                <label
                                    key={day.value}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedDays.includes(day.value)
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day.value)}
                                        onChange={() => toggleDay(day.value)}
                                        className="sr-only"
                                    />
                                    <span className="font-semibold text-sm">
                                        {day.short}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {selectedDays.length} dia(s) selecionado(s)
                        </p>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Motivo (opcional)
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Horário de Almoço"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Preview */}
                    {selectedDays.length > 0 && startTime && endTime && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-green-900 mb-2">
                                ✅ Resumo do que será criado:
                            </p>
                            <div className="space-y-1">
                                {selectedDays.map(day => (
                                    <p key={day} className="text-sm text-green-800">
                                        • {DAYS_OF_WEEK[day].label}: {startTime} - {endTime}
                                    </p>
                                ))}
                            </div>
                            <p className="text-xs text-green-700 mt-3">
                                🔄 Este bloqueio se repetirá automaticamente toda semana
                            </p>
                        </div>
                    )}

                    {/* Atalhos Rápidos */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">⚡ Atalhos Rápidos:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                                className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm hover:border-orange-300 transition-colors"
                            >
                                Segunda a Sexta
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedDays([2, 3, 4, 5, 6])}
                                className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm hover:border-orange-300 transition-colors"
                            >
                                Terça a Sábado
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6])}
                                className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm hover:border-orange-300 transition-colors"
                            >
                                Segunda a Sábado
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedDays([])}
                                className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm hover:border-red-300 transition-colors"
                            >
                                Limpar
                            </button>
                        </div>
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
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                            disabled={loading}
                        >
                            {loading ? 'Criando...' : 'Criar Horário de Almoço'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}