// components/admin/AppointmentDetailsModal.tsx
// ✅ CORREÇÃO: Importar corretamente e formatar datas

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, Calendar, Clock, DollarSign, MessageSquare, CheckCircle, XCircle, Ban, Edit3, ExternalLink, CalendarClock } from 'lucide-react'
import RescheduleModal from '@/components/appointments/RescheduleModal' // ✅ CORRIGIDO
import { formatDateBR } from '@/lib/dateUtils' // ✅ ADICIONAR

interface AppointmentDetailsModalProps {
    appointmentId: string
    onClose: () => void
    onUpdate: () => void
}

interface AppointmentDetails {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    internalNotes?: string
    paymentMethod?: string
    discountAmount: number
    finalPrice: number
    cancelReason?: string
    rescheduledFrom?: string
    createdAt: string
    service: {
        name: string
        price: number
        duration: number
        description: string
    }
    user: {
        name: string
        email: string
        phone?: string
        birthDate?: string
        image?: string
    }
    coupon?: {
        code: string
        description: string
    }
    statusHistory: Array<{
        status: string
        changedAt: string
        notes?: string
    }>
}

export default function AppointmentDetailsModal({ appointmentId, onClose, onUpdate }: AppointmentDetailsModalProps) {
    const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [internalNote, setInternalNote] = useState('')
    const [showNoteInput, setShowNoteInput] = useState(false)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)

    useEffect(() => {
        fetchAppointmentDetails()
    }, [appointmentId])

    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/appointments/${appointmentId}`)
            const data = await res.json()

            if (data.success) {
                setAppointment(data.data)
                setInternalNote(data.data.internalNotes || '')
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Confirma alterar status para ${getStatusLabel(newStatus)}?`)) return

        try {
            setActionLoading(true)
            const res = await fetch(`/api/admin/appointments/${appointmentId}/update-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const data = await res.json()

            if (data.success) {
                await fetchAppointmentDetails()
                onUpdate()
                alert('Status atualizado com sucesso!')
            } else {
                alert('Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao atualizar status')
        } finally {
            setActionLoading(false)
        }
    }

    const handleSaveInternalNote = async () => {
        try {
            setActionLoading(true)
            const res = await fetch(`/api/admin/appointments/${appointmentId}/internal-notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ internalNotes: internalNote })
            })

            const data = await res.json()

            if (data.success) {
                await fetchAppointmentDetails()
                setShowNoteInput(false)
                alert('Observação salva!')
            }
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            CONFIRMED: 'Confirmado',
            COMPLETED: 'Concluído',
            CANCELLED: 'Cancelado',
            NO_SHOW: 'Não Compareceu'
        }
        return labels[status] || status
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-orange-100 text-orange-700',
            CONFIRMED: 'bg-blue-100 text-blue-700',
            COMPLETED: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700',
            NO_SHOW: 'bg-gray-100 text-gray-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return null
        const birth = new Date(birthDate)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-4xl w-full">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-gold to-yellow-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{appointment.service.name}</h2>
                            <p className="text-white/90">Agendamento #{appointment.id.slice(-8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Coluna Esquerda - Informações do Cliente */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <User size={20} className="text-gold" />
                                    Informações do Cliente
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Nome</p>
                                        <p className="font-semibold">{appointment.user.name}</p>
                                    </div>

                                    {appointment.user.phone && (
                                        <div>
                                            <p className="text-sm text-gray-600">Telefone</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{appointment.user.phone}</p>
                                                <a
                                                    href={`https://wa.me/55${appointment.user.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm break-all">{appointment.user.email}</p>
                                            <a
                                                href={`mailto:${appointment.user.email}`}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    {appointment.user.birthDate && (
                                        <div>
                                            <p className="text-sm text-gray-600">Aniversário</p>
                                            <p className="font-semibold">
                                                {new Date(appointment.user.birthDate).toLocaleDateString('pt-BR')}
                                                {calculateAge(appointment.user.birthDate) && (
                                                    <span className="text-gray-600 ml-2">
                                                        ({calculateAge(appointment.user.birthDate)} anos)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-gold" />
                                    Observações
                                </h3>

                                {appointment.notes && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 mb-1">Cliente:</p>
                                        <p className="text-sm bg-white p-3 rounded-lg">{appointment.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-600">Notas Internas (Admin):</p>
                                        <button
                                            onClick={() => setShowNoteInput(!showNoteInput)}
                                            className="text-xs text-gold hover:text-gold-dark flex items-center gap-1"
                                        >
                                            <Edit3 size={14} />
                                            {showNoteInput ? 'Cancelar' : 'Editar'}
                                        </button>
                                    </div>

                                    {showNoteInput ? (
                                        <div>
                                            <textarea
                                                value={internalNote}
                                                onChange={(e) => setInternalNote(e.target.value)}
                                                className="w-full p-3 border rounded-lg text-sm"
                                                rows={3}
                                                placeholder="Ex: Cliente prefere café com leite, sempre chega 10min atrasada..."
                                            />
                                            <button
                                                onClick={handleSaveInternalNote}
                                                disabled={actionLoading}
                                                className="mt-2 bg-gold text-white px-4 py-2 rounded-lg text-sm hover:bg-gold-dark disabled:opacity-50"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm bg-white p-3 rounded-lg">
                                            {appointment.internalNotes || 'Sem observações internas'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita - Detalhes do Agendamento */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Calendar size={20} className="text-gold" />
                                    Detalhes do Agendamento
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Data e Horário</p>
                                        {/* ✅ USAR formatDateBR */}
                                        <p className="font-semibold">{formatDateBR(appointment.date)}</p>
                                        <p className="text-gold font-bold text-lg">{appointment.time}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">Duração</p>
                                        <p className="font-semibold">{appointment.service.duration} minutos</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </div>

                                    {appointment.rescheduledFrom && (
                                        <div>
                                            <p className="text-sm text-gray-600">Reagendado</p>
                                            <p className="text-sm text-orange-600">Este agendamento foi reagendado</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Valores */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <DollarSign size={20} className="text-gold" />
                                    Valores
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Valor do Serviço:</span>
                                        <span className="font-semibold">R$ {appointment.service.price.toFixed(2)}</span>
                                    </div>

                                    {appointment.coupon && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Desconto ({appointment.coupon.code}):</span>
                                            <span>- R$ {appointment.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span className="text-gold">R$ {appointment.finalPrice.toFixed(2)}</span>
                                    </div>

                                    {appointment.paymentMethod && (
                                        <div className="text-sm text-gray-600">
                                            Forma de pagamento: <span className="font-semibold">{appointment.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Histórico */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-gold" />
                                    Histórico
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Criado em:</span>
                                        <span className="font-semibold">{formatDateTime(appointment.createdAt)}</span>
                                    </div>

                                    {appointment.statusHistory && appointment.statusHistory.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-gray-600 mb-2">Mudanças de Status:</p>
                                            {appointment.statusHistory.map((history, index) => (
                                                <div key={index} className="text-xs text-gray-600 mb-1">
                                                    {formatDateTime(history.changedAt)} - {getStatusLabel(history.status)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-bold text-lg mb-4">Ações Rápidas</h3>

                        <div className="flex flex-wrap gap-3">
                            {appointment.status === 'PENDING' && (
                                <button
                                    onClick={() => handleStatusChange('CONFIRMED')}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                >
                                    <CheckCircle size={18} />
                                    Confirmar
                                </button>
                            )}

                            {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange('COMPLETED')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} />
                                        Marcar como Concluído
                                    </button>

                                    <button
                                        onClick={() => setShowRescheduleModal(true)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                                    >
                                        <CalendarClock size={18} />
                                        Reagendar
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange('NO_SHOW')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        <Ban size={18} />
                                        Não Compareceu
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange('CANCELLED')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                                    >
                                        <XCircle size={18} />
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Reagendamento */}
            {showRescheduleModal && appointment && (
                <RescheduleModal
                    appointment={{
                        id: appointment.id,
                        date: appointment.date,
                        time: appointment.time,
                        service: {
                            name: appointment.service.name,
                            duration: appointment.service.duration
                        },
                        user: {
                            name: appointment.user.name
                        }
                    }}
                    onClose={() => setShowRescheduleModal(false)}
                    onSuccess={() => {
                        setShowRescheduleModal(false)
                        fetchAppointmentDetails()
                        onUpdate()
                    }}
                />
            )}
        </div>
    )
}