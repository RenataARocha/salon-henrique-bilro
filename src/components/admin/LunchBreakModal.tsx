// src/components/admin/LunchBreakModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
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
    const [loadingExisting, setLoadingExisting] = useState(true)
    const [error, setError] = useState('')

    const [startTime, setStartTime] = useState('12:00')
    const [endTime, setEndTime] = useState('13:00')
    const [selectedDays, setSelectedDays] = useState<number[]>([2, 3, 4, 5, 6]) // Ter-Sáb por padrão
    const [reason, setReason] = useState('Horário de Almoço')

    // ✅ NOVO: Verificar bloqueios existentes
    const [existingLunchDays, setExistingLunchDays] = useState<number[]>([])

    // ✅ Buscar bloqueios de almoço existentes ao abrir o modal
    useEffect(() => {
        fetchExistingLunchBreaks()
    }, [])

    const fetchExistingLunchBreaks = async () => {
        try {
            setLoadingExisting(true)
            const res = await fetch('/api/admin/blocked-times')
            const data = await res.json()

            if (data.success) {
                // Filtrar apenas bloqueios de almoço recorrentes
                const lunchBreaks = data.data.filter(
                    (block: any) => block.type === 'LUNCH_BREAK' && block.isRecurring
                )

                // Pegar os dias da semana que já têm almoço
                const existingDays = lunchBreaks.map((block: any) => block.dayOfWeek)
                setExistingLunchDays(existingDays)

                // Se encontrou bloqueios existentes, carregar o horário do primeiro
                if (lunchBreaks.length > 0) {
                    const first = lunchBreaks[0]
                    if (first.startTime) setStartTime(first.startTime)
                    if (first.endTime) setEndTime(first.endTime)
                    if (first.reason) setReason(first.reason)
                }
            }
        } catch (err) {
            console.error('Erro ao buscar bloqueios existentes:', err)
        } finally {
            setLoadingExisting(false)
        }
    }

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

        // ✅ FILTRAR: Apenas criar para dias que NÃO existem
        const daysToCreate = selectedDays.filter(day => !existingLunchDays.includes(day))

        if (daysToCreate.length === 0) {
            setError('Todos os dias selecionados já possuem horário de almoço cadastrado!')
            return
        }

        setLoading(true)

        try {
            // Criar bloqueio recorrente para cada dia que NÃO existe
            const promises = daysToCreate.map(dayOfWeek =>
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

            if (successCount > 0) {
                const skippedCount = selectedDays.length - daysToCreate.length
                let message = `✅ Horário de almoço criado para ${successCount} dia(s)!`

                if (skippedCount > 0) {
                    message += `\n⚠️ ${skippedCount} dia(s) já tinha(m) horário cadastrado.`
                }

                alert(message)
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

                    {/* ✅ NOVO: Aviso de bloqueios existentes */}
                    {existingLunchDays.length > 0 && !loadingExisting && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900 mb-1">
                                        Horários de almoço já cadastrados:
                                    </p>
                                    <p className="text-sm text-blue-800">
                                        {existingLunchDays.map(day => DAYS_OF_WEEK[day].short).join(', ')}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-2">
                                        💡 Você pode criar apenas para os dias que não têm horário
                                    </p>
                                </div>
                            </div>
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
                            {DAYS_OF_WEEK.map(day => {
                                const isSelected = selectedDays.includes(day.value)
                                const alreadyExists = existingLunchDays.includes(day.value)

                                return (
                                    <label
                                        key={day.value}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all relative ${isSelected
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : isSelected
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'

                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleDay(day.value)}
                                            className="sr-only"
                                            disabled={false}

                                        />
                                        <span className="font-semibold text-sm">
                                            {day.short}
                                        </span>
                                        {alreadyExists && (
                                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                                ✓
                                            </span>
                                        )}
                                    </label>
                                )
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {selectedDays.length} dia(s) selecionado(s) •
                            {existingLunchDays.length > 0 && ` ${existingLunchDays.length} já cadastrado(s)`}
                        </p>

                        <p className="text-xs text-gray-500 mt-2">
                            ✔️ Dias com ✓ já possuem horário cadastrado
                            ✏️ Você pode desmarcar se quiser removê-los depois
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
                    {selectedDays.filter(d => !existingLunchDays.includes(d)).length > 0 && startTime && endTime && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-green-900 mb-2">
                                ✅ Será criado para:
                            </p>
                            <div className="space-y-1">
                                {selectedDays
                                    .filter(d => !existingLunchDays.includes(d))
                                    .map(day => (
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
                            disabled={loading || loadingExisting}
                        >
                            {loading ? 'Criando...' : 'Criar Horário de Almoço'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}