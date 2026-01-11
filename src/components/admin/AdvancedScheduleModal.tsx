// src/components/admin/AdvancedScheduleModal.tsx
// Modal avançado para criar horários com múltiplas opções

'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertTriangle, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { isHoliday, getHolidayWarning } from '@/lib/holidays'

interface Props {
    onClose: () => void
    onSuccess: () => void
    initialDay?: number
    currentMonth?: Date
}

type CreationMode = 'recurring' | 'single-date' | 'all-in-month'

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
]

export default function AdvancedScheduleModal({ onClose, onSuccess, initialDay = 1, currentMonth = new Date() }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [mode, setMode] = useState<CreationMode>('recurring')
    const [selectedDay, setSelectedDay] = useState(initialDay)
    const [timeSlot, setTimeSlot] = useState('')
    const [specificDate, setSpecificDate] = useState('')

    // Controle de feriados
    const [detectedHolidays, setDetectedHolidays] = useState<Date[]>([])
    const [createOnHolidays, setCreateOnHolidays] = useState(false)

    // Calcular datas que serão afetadas
    const getAffectedDates = () => {
        const dates: Date[] = []

        if (mode === 'single-date' && specificDate) {
            dates.push(new Date(specificDate))
        } else if (mode === 'all-in-month') {
            // Todas as ocorrências do dia selecionado no mês atual
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)

            for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                if (d.getDay() === selectedDay) {
                    dates.push(new Date(d))
                }
            }
        }

        return dates
    }

    // Detectar feriados nas datas afetadas
    useEffect(() => {
        const dates = getAffectedDates()
        const holidays = dates.filter(date => isHoliday(date))
        setDetectedHolidays(holidays)

        // Se detectou feriados, desmarcar "criar em feriados"
        if (holidays.length > 0) {
            setCreateOnHolidays(false)
        }
    }, [mode, selectedDay, specificDate, currentMonth])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!timeSlot) {
            setError('Por favor, selecione um horário')
            return
        }

        // Validar feriados
        if (detectedHolidays.length > 0 && !createOnHolidays) {
            setError(`⚠️ Existem ${detectedHolidays.length} feriado(s) nas datas selecionadas. Marque a opção "Criar mesmo em feriados" para continuar.`)
            return
        }

        setLoading(true)

        try {
            if (mode === 'recurring') {
                // Criar horário recorrente (modo padrão)
                const res = await fetch('/api/admin/slots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dayOfWeek: selectedDay,
                        timeSlot: timeSlot
                    })
                })

                const data = await res.json()

                if (data.success) {
                    alert('✅ Horário recorrente criado com sucesso!')
                    onSuccess()
                    onClose()
                } else {
                    setError(data.error || 'Erro ao criar horário')
                }
            } else {
                // Criar horários para datas específicas (em lote)
                const dates = getAffectedDates()

                // Filtrar feriados se não quiser criar neles
                const datesToCreate = createOnHolidays
                    ? dates
                    : dates.filter(d => !isHoliday(d))

                if (datesToCreate.length === 0) {
                    setError('Nenhuma data válida para criar horários')
                    return
                }

                // Criar em lote
                const res = await fetch('/api/admin/slots/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        timeSlot: timeSlot,
                        dates: datesToCreate.map(d => d.toISOString().split('T')[0])
                    })
                })

                const data = await res.json()

                if (data.success) {
                    alert(`✅ ${data.created} horário(s) criado(s) com sucesso!${data.skipped > 0 ? `\n⚠️ ${data.skipped} já existiam.` : ''}`)
                    onSuccess()
                    onClose()
                } else {
                    setError(data.error || 'Erro ao criar horários')
                }
            }
        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao criar horário')
        } finally {
            setLoading(false)
        }
    }

    const affectedDates = getAffectedDates()
    const hasHolidays = detectedHolidays.length > 0

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-gold to-yellow-600 text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
                    <div>
                        <h2 className="text-2xl font-bold">Criar Horário</h2>
                        <p className="text-white/90 text-sm mt-1">
                            Escolha como deseja criar o horário
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

                    {/* Modo de Criação */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-3">
                            Como deseja criar o horário?
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="recurring"
                                    checked={mode === 'recurring'}
                                    onChange={(e) => setMode(e.target.value as CreationMode)}
                                    className="mt-1 w-5 h-5 text-gold focus:ring-gold"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal flex items-center gap-2">
                                        🔄 Recorrente (Toda Semana)
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        O horário se repete automaticamente toda semana neste dia
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="single-date"
                                    checked={mode === 'single-date'}
                                    onChange={(e) => setMode(e.target.value as CreationMode)}
                                    className="mt-1 w-5 h-5 text-gold focus:ring-gold"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal flex items-center gap-2">
                                        📅 Data Específica (Pontual)
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Criar apenas para uma data específica (não se repete)
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="all-in-month"
                                    checked={mode === 'all-in-month'}
                                    onChange={(e) => setMode(e.target.value as CreationMode)}
                                    className="mt-1 w-5 h-5 text-gold focus:ring-gold"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal flex items-center gap-2">
                                        📆 Todas as Ocorrências do Mês
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Criar para todas as ocorrências deste dia no mês atual
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Dia da Semana */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Dia da Semana
                        </label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(Number(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            disabled={mode === 'single-date'}
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Data Específica (apenas se modo single-date) */}
                    {mode === 'single-date' && (
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Data Específica
                            </label>
                            <input
                                type="date"
                                value={specificDate}
                                onChange={(e) => setSpecificDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                required
                            />
                        </div>
                    )}

                    {/* Horário */}
                    <div>
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            Horário *
                        </label>
                        <input
                            type="time"
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none text-lg font-semibold"
                            required
                        />
                    </div>

                    {/* Preview das Datas Afetadas */}
                    {affectedDates.length > 0 && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Info size={16} />
                                {mode === 'recurring'
                                    ? 'Este horário será criado para:'
                                    : `${affectedDates.length} data(s) serão criadas:`
                                }
                            </p>

                            {mode === 'recurring' ? (
                                <p className="text-sm text-blue-800">
                                    🔄 Toda {DAYS_OF_WEEK[selectedDay].label} (repete toda semana automaticamente)
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {affectedDates.slice(0, 5).map((date, idx) => {
                                        const holiday = isHoliday(date)
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-2 rounded ${holiday ? 'bg-red-100' : 'bg-white'
                                                    }`}
                                            >
                                                <span className="text-sm font-semibold text-blue-900">
                                                    {date.toLocaleDateString('pt-BR', {
                                                        weekday: 'long',
                                                        day: '2-digit',
                                                        month: 'long'
                                                    })}
                                                </span>
                                                {holiday && (
                                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-semibold">
                                                        🎉 {holiday.name}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {affectedDates.length > 5 && (
                                        <p className="text-xs text-blue-700">
                                            + {affectedDates.length - 5} mais...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alerta de Feriados */}
                    {hasHolidays && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold text-yellow-900">
                                        ⚠️ {detectedHolidays.length} Feriado(s) Detectado(s)
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        {detectedHolidays.map((date, idx) => {
                                            const holiday = isHoliday(date)
                                            return (
                                                <p key={idx} className="text-sm text-yellow-800">
                                                    • {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {holiday?.name}
                                                </p>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createOnHolidays}
                                    onChange={(e) => setCreateOnHolidays(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-gold rounded focus:ring-gold"
                                />
                                <div>
                                    <p className="font-semibold text-yellow-900">Criar mesmo em feriados</p>
                                    <p className="text-sm text-yellow-700">
                                        Marque esta opção se deseja criar horários mesmo nos dias de feriado
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

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
                            {loading ? 'Criando...' : 'Criar Horário'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}