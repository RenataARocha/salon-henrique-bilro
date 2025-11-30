'use client'

import { useState, useEffect } from 'react'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    justification?: string  // <- NOVO
    justifiedAt?: string     // <- NOVO
    user: {
        name: string
        email: string
        phone: string
    }
    service: {
        name: string
        price: number
        duration: number
    }
}

export default function AdminAgendamentosPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

    useEffect(() => {
        fetchAppointments()
    }, [filterStatus])

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const url = filterStatus === 'all'
                ? '/api/admin/appointments'
                : `/api/admin/appointments?status=${filterStatus}`

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setAppointments(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/appointments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Status atualizado!')
                fetchAppointments()
                setSelectedAppointment(null)
            } else {
                alert('❌ ' + data.error)
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao atualizar status')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-700'
            case 'PENDING':
                return 'bg-orange-100 text-orange-700'
            case 'CANCELLED':
                return 'bg-red-100 text-red-700'
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-700'
            case 'NO_SHOW':
                return 'bg-gray-100 text-gray-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'Confirmado'
            case 'PENDING':
                return 'Pendente'
            case 'CANCELLED':
                return 'Cancelado'
            case 'COMPLETED':
                return 'Concluído'
            case 'NO_SHOW':
                return 'Não Compareceu'
            default:
                return status
        }
    }

    const filteredAppointments = appointments.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time)
        const dateB = new Date(b.date + ' ' + b.time)
        return dateA.getTime() - dateB.getTime()
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-charcoal mb-2">Agendamentos</h1>
                    <p className="text-gray-600">Gerencie todos os agendamentos do salão</p>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap">
                {[
                    { value: 'all', label: 'Todos', icon: '📋' },
                    { value: 'PENDING', label: 'Pendentes', icon: '⏳' },
                    { value: 'CONFIRMED', label: 'Confirmados', icon: '✅' },
                    { value: 'COMPLETED', label: 'Concluídos', icon: '🎉' },
                    { value: 'NO_SHOW', label: 'Não Compareceu', icon: '🚫' },
                    { value: 'CANCELLED', label: 'Cancelados', icon: '❌' }
                ].map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${filterStatus === filter.value
                            ? 'bg-gradient-gold text-white shadow-lg'
                            : 'bg-white text-charcoal hover:shadow-md'
                            }`}
                    >
                        {filter.icon} {filter.label}
                    </button>
                ))}
            </div>

            {filteredAppointments.length > 0 ? (
                <div className="grid gap-4">
                    {filteredAppointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                            onClick={() => setSelectedAppointment(appointment)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-charcoal">
                                            {appointment.user.name}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                        {appointment.justification && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                📝 Com Justificativa
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 mb-1">Serviço</p>
                                            <p className="font-semibold text-charcoal">{appointment.service.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Data e Hora</p>
                                            <p className="font-semibold text-charcoal">
                                                {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Contato</p>
                                            <p className="font-semibold text-charcoal">{appointment.user.phone}</p>
                                        </div>
                                    </div>

                                    {appointment.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-sm text-gray-600">
                                                <strong>Obs:</strong> {appointment.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gold">
                                        R$ {appointment.service.price.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {appointment.service.duration} min
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <p className="text-6xl mb-4">📭</p>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">Nenhum agendamento</h3>
                    <p className="text-gray-600">
                        {filterStatus === 'all'
                            ? 'Não há agendamentos no momento'
                            : `Não há agendamentos com status "${getStatusLabel(filterStatus)}"`
                        }
                    </p>
                </div>
            )}

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-3xl font-bold text-charcoal">Detalhes do Agendamento</h2>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-beige rounded-lg p-4">
                                <h3 className="font-bold text-charcoal mb-3 text-lg">👤 Cliente</h3>
                                <div className="space-y-2">
                                    <p><strong>Nome:</strong> {selectedAppointment.user.name}</p>
                                    <p><strong>Email:</strong> {selectedAppointment.user.email}</p>
                                    <p><strong>Telefone:</strong> {selectedAppointment.user.phone}</p>
                                </div>
                            </div>

                            <div className="bg-beige rounded-lg p-4">
                                <h3 className="font-bold text-charcoal mb-3 text-lg">💇‍♀️ Serviço</h3>
                                <div className="space-y-2">
                                    <p><strong>Serviço:</strong> {selectedAppointment.service.name}</p>
                                    <p><strong>Valor:</strong> R$ {selectedAppointment.service.price.toFixed(2)}</p>
                                    <p><strong>Duração:</strong> {selectedAppointment.service.duration} minutos</p>
                                </div>
                            </div>

                            <div className="bg-beige rounded-lg p-4">
                                <h3 className="font-bold text-charcoal mb-3 text-lg">📅 Agendamento</h3>
                                <div className="space-y-2">
                                    <p><strong>Data:</strong> {new Date(selectedAppointment.date).toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</p>
                                    <p><strong>Horário:</strong> {selectedAppointment.time}</p>
                                    <p>
                                        <strong>Status:</strong>{' '}
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                                            {getStatusLabel(selectedAppointment.status)}
                                        </span>
                                    </p>
                                    {selectedAppointment.notes && (
                                        <p><strong>Observações:</strong> {selectedAppointment.notes}</p>
                                    )}
                                </div>
                            </div>

                            {/* JUSTIFICATIVA */}
                            {selectedAppointment.justification && (
                                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                                    <h3 className="font-bold text-charcoal mb-3 text-lg flex items-center gap-2">
                                        📝 Justificativa de Falta
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <strong>Enviada em:</strong>{' '}
                                            {selectedAppointment.justifiedAt
                                                ? new Date(selectedAppointment.justifiedAt).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Data não disponível'
                                            }
                                        </p>
                                        <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                                            <p className="text-gray-800">{selectedAppointment.justification}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <h3 className="font-bold text-charcoal mb-3">🚀 Ações Rápidas</h3>
                                <div className="flex gap-2">
                                    <a
                                        href={`https://wa.me/55${selectedAppointment.user.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-all text-center"
                                    >
                                        💬 WhatsApp
                                    </a>
                                    <a
                                        href={`mailto:${selectedAppointment.user.email}`}
                                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all text-center"
                                    >
                                        ✉️ Email
                                    </a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-charcoal mb-3">Alterar Status</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'PENDING')}
                                        disabled={selectedAppointment.status === 'PENDING'}
                                        className="bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ⏳ Pendente
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')}
                                        disabled={selectedAppointment.status === 'CONFIRMED'}
                                        className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ✅ Confirmar
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                                        disabled={selectedAppointment.status === 'COMPLETED'}
                                        className="bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        🎉 Concluído
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                                        disabled={selectedAppointment.status === 'NO_SHOW'}
                                        className="bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        🚫 Não Compareceu
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                                        disabled={selectedAppointment.status === 'CANCELLED'}
                                        className="bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
                                    >
                                        ❌ Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedAppointment(null)}
                            className="w-full mt-6 bg-gray-200 text-charcoal py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}