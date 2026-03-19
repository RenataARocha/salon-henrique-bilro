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
        if (selectedDate) fetchAvailableSlots(selectedDate)
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
                    setDateMessage({ type: 'info', text: `${data.data.length} ${data.data.length === 1 ? 'horário disponível' : 'horários disponíveis'}` })
                } else if (data.isHoliday) {
                    setDateMessage({ type: 'warning', text: data.message })
                } else if (data.isBlocked) {
                    setDateMessage({ type: 'error', text: data.message })
                } else {
                    setDateMessage({ type: 'info', text: data.message || 'Nenhum horário disponível para esta data' })
                }
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error)
            setDateMessage({ type: 'error', text: 'Erro ao buscar horários disponíveis' })
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) { showToast('Selecione data e horário', 'error'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/appointments/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId: appointment.id, newDate: selectedDate, newTime: selectedTime })
            })
            const data = await res.json()
            if (data.success) { showToast('✅ Agendamento reagendado com sucesso!', 'success'); onSuccess(); onClose() }
            else showToast(data.error || 'Erro ao reagendar', 'error')
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

    const currentDateForDisplay = formatDateBR(appointment.date)

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#141414] border border-white/8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-7 border-b border-white/8">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2">
                            <div className="h-px w-5 bg-gold opacity-60" />
                            <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Reagendamento</span>
                            <div className="h-px w-5 bg-gold opacity-60" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                            Reagendar Horário
                        </h2>
                        <p className="text-white/50 text-sm">{appointment.service.name}</p>
                        {appointment.user && (
                            <p className="text-xs text-white/30 mt-0.5">Cliente: {appointment.user.name}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-5 sm:p-7 space-y-5">
                    {/* Agendamento atual */}
                    <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">
                            📅 Agendamento Atual
                        </p>
                        <p className="text-blue-300 text-sm">
                            <span className="text-blue-400/70">Data:</span>{' '}
                            <strong>{currentDateForDisplay}</strong>
                            {' '}<span className="text-blue-400/70">às</span>{' '}
                            <strong>{appointment.time}</strong>
                        </p>
                    </div>

                    {/* Aviso */}
                    <div className="bg-orange-950/40 border-l-4 border-orange-600/60 border border-orange-800/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-orange-400 mt-0.5 flex-shrink-0" size={18} />
                        <div>
                            <p className="text-xs font-semibold text-orange-300 mb-0.5">⚠️ Atenção</p>
                            <p className="text-xs text-orange-300/70">
                                É necessário reagendar com pelo menos 2 horas de antecedência.
                            </p>
                        </div>
                    </div>

                    {/* Calendário */}
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-gold" />
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
                        <div className={`rounded-lg p-4 flex items-start gap-3 ${dateMessage.type === 'error' ? 'bg-red-950/50 border border-red-700/30' :
                                dateMessage.type === 'warning' ? 'bg-yellow-950/50 border border-yellow-700/30' :
                                    'bg-blue-950/50 border border-blue-700/30'
                            }`}>
                            <AlertCircle className={`flex-shrink-0 mt-0.5 ${dateMessage.type === 'error' ? 'text-red-400' :
                                    dateMessage.type === 'warning' ? 'text-yellow-400' :
                                        'text-blue-400'
                                }`} size={18} />
                            <p className={`text-sm font-medium ${dateMessage.type === 'error' ? 'text-red-300' :
                                    dateMessage.type === 'warning' ? 'text-yellow-300' :
                                        'text-blue-300'
                                }`}>
                                {dateMessage.text}
                            </p>
                        </div>
                    )}

                    {/* Horários */}
                    {selectedDate && (
                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-gold" />
                                Novo Horário
                            </label>
                            {loadingSlots ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                    {availableSlots.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`py-3 px-3 rounded-lg font-semibold transition-all text-base ${selectedTime === time
                                                    ? 'bg-gold text-white shadow-lg shadow-gold/30'
                                                    : 'bg-white/5 border border-white/10 text-white/70 hover:border-gold/50 hover:text-white'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white/4 rounded-lg">
                                    <p className="text-white/40 text-sm">Nenhum horário disponível para esta data</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white/5 border border-white/10 text-white/70 py-3 rounded-lg font-semibold hover:bg-white/8 hover:text-white transition-all text-sm sm:text-base"
                        >
                            Cancelar
                        </button>
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
        </div>
    )
}