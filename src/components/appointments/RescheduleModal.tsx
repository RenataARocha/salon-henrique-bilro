// src/components/appointments/RescheduleModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'

interface Appointment {
    id: string
    date: string
    time: string
    service: {
        name: string
        duration: number
    }
}

interface RescheduleModalProps {
    appointment: Appointment
    onClose: () => void
    onSuccess: () => void
}

export default function RescheduleModal({ appointment, onClose, onSuccess }: RescheduleModalProps) {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [availableDates, setAvailableDates] = useState<string[]>([])
    const [availableTimes, setAvailableTimes] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [loadingDates, setLoadingDates] = useState(true)
    const [loadingTimes, setLoadingTimes] = useState(false)

    useEffect(() => {
        fetchAvailableDates()
    }, [])

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableTimes(selectedDate)
        }
    }, [selectedDate])

    const fetchAvailableDates = async () => {
        try {
            setLoadingDates(true)
            // Gerar próximos 30 dias
            const dates: string[] = []
            const today = new Date()

            for (let i = 1; i <= 30; i++) {
                const date = new Date(today)
                date.setDate(today.getDate() + i)
                dates.push(date.toISOString().split('T')[0])
            }

            setAvailableDates(dates)
        } catch (error) {
            console.error('Erro ao buscar datas:', error)
        } finally {
            setLoadingDates(false)
        }
    }

    const fetchAvailableTimes = async (date: string) => {
        try {
            setLoadingTimes(true)
            const res = await fetch(`/api/available-slots?date=${date}`)
            const data = await res.json()
            if (data.success) {
                setAvailableTimes(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error)
        } finally {
            setLoadingTimes(false)
        }
    }

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) {
            showToast('Selecione data e horário', 'error')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/appointments/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    newDate: selectedDate,
                    newTime: selectedTime
                })
            })

            const data = await res.json()

            if (data.success) {
                showToast('Agendamento reagendado com sucesso!', 'success')
                onSuccess()
                onClose()
            } else {
                showToast(data.error || 'Erro ao reagendar', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao reagendar agendamento', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-charcoal mb-2">
                            Reagendar Horário
                        </h2>
                        <p className="text-gray-600">
                            {appointment.service.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Informações do Agendamento Atual */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                        📅 Agendamento Atual
                    </p>
                    <p className="text-blue-700">
                        <strong>Data:</strong> {new Date(appointment.date).toLocaleDateString('pt-BR')}
                        {' '}<strong>às</strong> {appointment.time}
                    </p>
                </div>

                {/* Aviso */}
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <AlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-sm text-orange-900 font-semibold mb-1">
                            ⚠️ Atenção
                        </p>
                        <p className="text-sm text-orange-800">
                            É necessário reagendar com pelo menos 2 horas de antecedência.
                        </p>
                    </div>
                </div>

                {/* Seleção de Data */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-gold" />
                        Nova Data
                    </label>
                    {loadingDates ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                            {availableDates.slice(0, 15).map((date) => {
                                const dateObj = new Date(date + 'T00:00:00')
                                const isSelected = selectedDate === date

                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                ? 'border-gold bg-gold text-white'
                                                : 'border-gray-200 hover:border-gold hover:bg-beige'
                                            }`}
                                    >
                                        <p className="text-xs font-semibold">
                                            {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                                        </p>
                                        <p className="text-lg font-bold">
                                            {dateObj.getDate()}
                                        </p>
                                        <p className="text-xs">
                                            {dateObj.toLocaleDateString('pt-BR', { month: 'short' })}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Seleção de Horário */}
                {selectedDate && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-gold" />
                            Novo Horário
                        </label>
                        {loadingTimes ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                            </div>
                        ) : availableTimes.length > 0 ? (
                            <div className="grid grid-cols-4 gap-3">
                                {availableTimes.map((time) => {
                                    const isSelected = selectedTime === time

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-4 rounded-xl border-2 font-bold transition-all ${isSelected
                                                    ? 'border-gold bg-gold text-white'
                                                    : 'border-gray-200 hover:border-gold hover:bg-beige'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                Nenhum horário disponível para esta data
                            </p>
                        )}
                    </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleReschedule}
                        loading={loading}
                        disabled={!selectedDate || !selectedTime}
                        className="flex-1"
                    >
                        Confirmar Reagendamento
                    </Button>
                </div>
            </div>
        </div>
    )
}