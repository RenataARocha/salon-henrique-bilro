// src/components/admin/BlockedTimeForm.tsx 


import { useState } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'

interface BlockedTimeFormProps {
    onClose: () => void
    onSuccess: () => void
    editData?: any
}

const BLOCKED_TIME_TYPES = [
    { value: 'LUNCH_BREAK', label: '🍽️ Horário de Almoço', icon: '🍽️' },
    { value: 'DAY_OFF', label: '📅 Folga/Descanso', icon: '📅' },
    { value: 'HOLIDAY', label: '🎉 Feriado', icon: '🎉' },
    { value: 'VACATION', label: '✈️ Férias', icon: '✈️' },
    { value: 'MAINTENANCE', label: '🔧 Manutenção', icon: '🔧' },
    { value: 'SPECIAL_EVENT', label: '📚 Evento Especial', icon: '📚' },
    { value: 'OTHER', label: '📝 Outro', icon: '📝' }
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

export default function BlockedTimeForm({ onClose, onSuccess, editData }: BlockedTimeFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [conflictingAppointments, setConflictingAppointments] = useState<any[]>([])

    const [formData, setFormData] = useState({
        type: editData?.type || 'DAY_OFF',
        isRecurring: editData?.isRecurring || false,
        date: editData?.date ? new Date(editData.date).toISOString().split('T')[0] : '',
        dayOfWeek: editData?.dayOfWeek ?? '',
        startTime: editData?.startTime || '',
        endTime: editData?.endTime || '',
        reason: editData?.reason || '',
        description: editData?.description || '',
        startDate: editData?.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : '',
        endDate: editData?.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setConflictingAppointments([])

        // Validações
        if (!formData.type || !formData.reason) {
            setError('Tipo e motivo são obrigatórios')
            return
        }

        if (formData.isRecurring && formData.dayOfWeek === '') {
            setError('Selecione o dia da semana para bloqueios recorrentes')
            return
        }

        if (!formData.isRecurring && !formData.date) {
            setError('Selecione a data para bloqueios pontuais')
            return
        }

        try {
            setLoading(true)

            const url = editData
                ? `/api/admin/blocked-times/${editData.id}`
                : '/api/admin/blocked-times'

            const method = editData ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    dayOfWeek: formData.dayOfWeek !== '' ? parseInt(formData.dayOfWeek) : null
                })
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.conflictingAppointments) {
                    setConflictingAppointments(data.conflictingAppointments)
                    setError(data.message)
                } else {
                    setError(data.message || 'Erro ao salvar bloqueio')
                }
                return
            }

            alert(editData ? 'Bloqueio atualizado!' : 'Bloqueio criado com sucesso!')
            onSuccess()
            onClose()

        } catch (err) {
            console.error('Erro:', err)
            setError('Erro ao salvar bloqueio')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelConflictingAppointments = async () => {
        if (!confirm(`Deseja cancelar ${conflictingAppointments.length} agendamento(s) conflitante(s)?`)) {
            return
        }

        try {
            setLoading(true)

            // Cancelar cada agendamento
            for (const apt of conflictingAppointments) {
                await fetch(`/api/admin/appointments/${apt.id}/update-status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'CANCELLED',
                        cancelReason: `Horário bloqueado: ${formData.reason}`
                    })
                })
            }

            // Tentar criar o bloqueio novamente
            await handleSubmit(new Event('submit') as any)

        } catch (err) {
            console.error('Erro ao cancelar agendamentos:', err)
            setError('Erro ao cancelar agendamentos')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-gold to-yellow-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                {editData ? 'Editar Bloqueio' : 'Novo Bloqueio de Horário'}
                            </h2>
                            <p className="text-white/90">Configure horários indisponíveis</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Erro */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-red-800 font-semibold">{error}</p>

                                {conflictingAppointments.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-sm text-red-700 mb-2">
                                            Agendamentos conflitantes:
                                        </p>
                                        <div className="space-y-2">
                                            {conflictingAppointments.map(apt => (
                                                <div key={apt.id} className="bg-white rounded p-2 text-sm">
                                                    <p className="font-semibold">{apt.clientName}</p>
                                                    <p className="text-gray-600">{apt.serviceName} - {apt.time}</p>
                                                    <p className="text-gray-500">{apt.clientPhone}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCancelConflictingAppointments}
                                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                        >
                                            Cancelar Agendamentos e Bloquear
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tipo de Bloqueio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Bloqueio *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                            required
                        >
                            {BLOCKED_TIME_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bloqueio Recorrente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isRecurring}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    isRecurring: e.target.checked,
                                    date: e.target.checked ? '' : formData.date,
                                    dayOfWeek: e.target.checked ? formData.dayOfWeek : ''
                                })}
                                className="rounded text-gold focus:ring-gold w-5 h-5"
                            />
                            <div>
                                <p className="font-semibold text-gray-900">Bloqueio Recorrente</p>
                                <p className="text-sm text-gray-600">
                                    Se repetir toda semana (ex: toda segunda-feira)
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Data ou Dia da Semana */}
                    {formData.isRecurring ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dia da Semana *
                            </label>
                            <select
                                value={formData.dayOfWeek}
                                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                                required
                            >
                                <option value="">Selecione o dia</option>
                                {DAYS_OF_WEEK.map(day => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Data *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                                required
                            />
                        </div>
                    )}

                    {/* Horário */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={16} className="inline mr-1" />
                                Horário Início
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                            />
                            <p className="text-xs text-gray-500 mt-1">Deixe vazio para dia todo</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horário Fim
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                            />
                        </div>
                    </div>

                    {/* Período de Validade (para recorrentes) */}
                    {formData.isRecurring && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Válido de
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Até
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                                />
                            </div>
                        </div>
                    )}

                    {/* Motivo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo *
                        </label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Ex: Horário de almoço, Feriado, Manutenção..."
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes adicionais..."
                            rows={3}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50 font-semibold"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold-dark font-semibold disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Criar Bloqueio')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}