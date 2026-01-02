// src/components/admin/RescheduleModal.tsx

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'

interface RescheduleModalProps {
    appointment: {
        id: string
        date: string
        time: string
        service: {
            name: string
            duration: number
        }
        user: {
            name: string
        }
    }
    onClose: () => void
    onSuccess: () => void
}

export default function RescheduleModal({ appointment, onClose, onSuccess }: RescheduleModalProps) {
    const [selectedDate, setSelectedDate] = useState('')
    const [availableTimes, setAvailableTimes] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingTimes, setLoadingTimes] = useState(false)

    // Data mínima é hoje
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableTimes()
        }
    }, [selectedDate])

    const fetchAvailableTimes = async () => {
        try {
            setLoadingTimes(true)
            setSelectedTime('')

            const res = await fetch(`/api/appointments/available-times?date=${selectedDate}`)
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
            alert('Selecione data e horário')
            return
        }

        try {
            setLoading(true)

            const res = await fetch('/api/admin/appointments/reschedule', {
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
                alert('✅ Agendamento reagendado com sucesso!')
                onSuccess()
            } else {
                alert('❌ ' + (data.message || 'Erro ao reagendar'))
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao reagendar')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">📅 Reagendar</h2>
                            <p className="text-white/90">{appointment.user.name} • {appointment.service.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Informação do agendamento atual */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={20} className="text-orange-600" />
                            <p className="font-semibold text-orange-800">Agendamento Atual</p>
                        </div>
                        <p className="text-sm text-orange-700">
                            {formatDate(appointment.date)} às {appointment.time}
                        </p>
                    </div>

                    {/* Seleção de nova data */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-charcoal mb-2">
                            <Calendar className="inline mr-2" size={16} />
                            Nova Data
                        </label>
                        <input
                            type="date"
                            min={today}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 outline-none text-lg"
                        />
                    </div>

                    {/* Seleção de novo horário */}
                    {selectedDate && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                <Clock className="inline mr-2" size={16} />
                                Novo Horário
                            </label>

                            {loadingTimes ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600">Carregando horários...</p>
                                </div>
                            ) : availableTimes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border-2 border-gray-200 rounded-xl">
                                    {availableTimes.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${selectedTime === time
                                                ? 'bg-purple-500 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <p className="text-gray-600">Nenhum horário disponível para esta data</p>
                                    <p className="text-sm text-gray-500 mt-1">Tente outra data</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview da mudança */}
                    {selectedDate && selectedTime && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={20} className="text-green-600" />
                                <p className="font-semibold text-green-800">Novo Agendamento</p>
                            </div>
                            <p className="text-sm text-green-700">
                                {formatDate(selectedDate)} às {selectedTime}
                            </p>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 text-charcoal rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleReschedule}
                            disabled={!selectedDate || !selectedTime || loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Reagendando...' : 'Confirmar Reagendamento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}