// components/appointments/RescheduleModal.tsx
// ✅ VERSÃO FINAL COM TIMEZONE CORRETO

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'
import SmartCalendar from '@/components/SmartCalendar'
import { dbDateToCalendar, formatDateBR } from '@/lib/dateUtils'

interface Appointment {
    id: string
    date: string
    time: string
    service: {
        name: string
        duration: number
    }
    user?: {
        name: string
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
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [dateMessage, setDateMessage] = useState<{
        type: 'info' | 'warning' | 'error'
        text: string
    } | null>(null)

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots(selectedDate)
        }
    }, [selectedDate])

    const fetchAvailableSlots = async (date: string) => {
        try {
            setLoadingSlots(true)
            setDateMessage(null)
            setSelectedTime('')

            const res = await fetch(`/api/available-slots?date=${date}`)
            const data = await res.json()

            if (data.success) {
                setAvailableSlots(data.data)

                if (data.data.length > 0) {
                    setDateMessage({
                        type: 'info',
                        text: `${data.data.length} ${data.data.length === 1 ? 'horário disponível' : 'horários disponíveis'}`
                    })
                } else if (data.isHoliday) {
                    setDateMessage({
                        type: 'warning',
                        text: data.message
                    })
                } else if (data.isBlocked) {
                    setDateMessage({
                        type: 'error',
                        text: data.message
                    })
                } else {
                    setDateMessage({
                        type: 'info',
                        text: data.message || 'Nenhum horário disponível para esta data'
                    })
                }
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error)
            setDateMessage({
                type: 'error',
                text: 'Erro ao buscar horários disponíveis'
            })
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) {
            showToast('Selecione data e horário', 'error')
            return
        }

        setLoading(true)

        try {
            console.log('🔄 Enviando reagendamento:', {
                appointmentId: appointment.id,
                newDate: selectedDate,
                newTime: selectedTime
            })

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
                showToast('✅ Agendamento reagendado com sucesso!', 'success')
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

    const getMinDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    }

    const getMaxDate = () => {
        const maxDate = new Date()
        maxDate.setMonth(maxDate.getMonth() + 2)
        return maxDate.toISOString().split('T')[0]
    }

    // ✅ CONVERTER DATA DO BANCO PARA EXIBIÇÃO CORRETA
    const currentDateForDisplay = formatDateBR(appointment.date)

    console.log('📅 Data do agendamento atual:', {
        raw: appointment.date,
        formatted: currentDateForDisplay
    })

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
                        {appointment.user && (
                            <p className="text-sm text-gray-500 mt-1">
                                Cliente: {appointment.user.name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Agendamento Atual */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                        📅 Agendamento Atual
                    </p>
                    <p className="text-blue-700">
                        <strong>Data:</strong> {currentDateForDisplay}
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

                {/* Calendário */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-gold" />
                        Nova Data
                    </label>
                    <SmartCalendar
                        onDateSelect={(date) => setSelectedDate(date)}
                        selectedDate={selectedDate}
                        minDate={getMinDate()}
                        maxDate={getMaxDate()}
                    />
                </div>

                {/* Mensagem */}
                {dateMessage && selectedDate && (
                    <div className={`rounded-lg p-4 flex items-start gap-3 mb-6 ${dateMessage.type === 'error' ? 'bg-red-50 border-2 border-red-200' :
                            dateMessage.type === 'warning' ? 'bg-yellow-50 border-2 border-yellow-200' :
                                'bg-blue-50 border-2 border-blue-200'
                        }`}>
                        <AlertCircle className={`flex-shrink-0 mt-0.5 ${dateMessage.type === 'error' ? 'text-red-600' :
                                dateMessage.type === 'warning' ? 'text-yellow-600' :
                                    'text-blue-600'
                            }`} size={20} />
                        <p className={`text-sm font-medium ${dateMessage.type === 'error' ? 'text-red-800' :
                                dateMessage.type === 'warning' ? 'text-yellow-800' :
                                    'text-blue-800'
                            }`}>
                            {dateMessage.text}
                        </p>
                    </div>
                )}

                {/* Horários */}
                {selectedDate && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-gold" />
                            Novo Horário
                        </label>
                        {loadingSlots ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                            </div>
                        ) : availableSlots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-3">
                                {availableSlots.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`p-4 rounded-xl border-2 font-bold transition-all ${selectedTime === time
                                                ? 'border-gold bg-gold text-white'
                                                : 'border-gray-200 hover:border-gold hover:bg-beige'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
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