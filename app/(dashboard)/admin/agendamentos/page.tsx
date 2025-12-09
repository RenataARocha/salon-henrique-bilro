// app/(dashboard)/admin/agendamentos/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    justification?: string
    justifiedAt?: string
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
    const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

    useEffect(() => {
        fetchAppointments()
    }, [])

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/appointments')
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

    // Logo no início da função getFilteredAppointments:
    console.log('Total appointments:', appointments.length)
    console.log('Filter period:', filterPeriod)
    console.log('Filter status:', filterStatus)

    const getFilteredAppointments = () => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        today.setHours(0, 0, 0, 0)

        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        monthStart.setHours(0, 0, 0, 0)

        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)

        return appointments
            .filter(apt => {
                // Filtro de status
                if (filterStatus !== 'all' && apt.status !== filterStatus) return false

                // Se o filtro de período é "all", não filtrar por data
                if (filterPeriod === 'all') return true

                // Parse da data do agendamento
                const aptDate = new Date(apt.date)

                switch (filterPeriod) {
                    case 'today':
                        return aptDate.toDateString() === today.toDateString()
                    case 'week':
                        return aptDate >= weekStart && aptDate <= weekEnd
                    case 'month':
                        return aptDate >= monthStart && aptDate <= monthEnd
                    default:
                        return true
                }
            })
            .sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time)
                const dateB = new Date(b.date + 'T' + b.time)
                return dateA.getTime() - dateB.getTime()
            })
    }

    const getStatusColor = (status: string) => {
        const colors = {
            CONFIRMED: 'bg-green-100 text-green-700',
            PENDING: 'bg-orange-100 text-orange-700',
            CANCELLED: 'bg-red-100 text-red-700',
            COMPLETED: 'bg-blue-100 text-blue-700',
            NO_SHOW: 'bg-gray-100 text-gray-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            CONFIRMED: 'Confirmado',
            PENDING: 'Pendente',
            CANCELLED: 'Cancelado',
            COMPLETED: 'Concluído',
            NO_SHOW: 'Não Compareceu'
        }
        return labels[status] || status
    }

    const filteredAppointments = getFilteredAppointments()

    const stats = {
        total: filteredAppointments.length,
        pending: filteredAppointments.filter(a => a.status === 'PENDING').length,
        confirmed: filteredAppointments.filter(a => a.status === 'CONFIRMED').length,
        revenue: filteredAppointments
            .filter(a => a.status === 'COMPLETED')
            .reduce((sum, a) => sum + a.service.price, 0)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-charcoal mb-2">Agendamentos</h1>
                    <p className="text-gray-600">Gerencie todos os agendamentos do salão</p>
                </div>

                {/* Estatísticas */}
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Total</p>
                        <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Pendentes</p>
                        <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Confirmados</p>
                        <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Receita</p>
                        <p className="text-3xl font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Filtros de Período */}
                <div className="bg-white rounded-xl p-6 shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-gold" />
                        <h3 className="font-bold text-charcoal">Período</h3>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {[
                            { value: 'today', label: 'Hoje', icon: '📅' },
                            { value: 'week', label: 'Esta Semana', icon: '📆' },
                            { value: 'month', label: 'Este Mês', icon: '🗓️' },
                            { value: 'all', label: 'Todos', icon: '📋' }
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterPeriod(filter.value as any)}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${filterPeriod === filter.value
                                    ? 'bg-gradient-gold text-white shadow-lg'
                                    : 'bg-beige text-charcoal hover:shadow-md'
                                    }`}
                            >
                                {filter.icon} {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtros de Status */}
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

                {/* Lista */}
                {filteredAppointments.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => setSelectedAppointment(apt)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-bold text-charcoal">{apt.user.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                                                {getStatusLabel(apt.status)}
                                            </span>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Serviço</p>
                                                <p className="font-semibold text-charcoal">{apt.service.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Data e Hora</p>
                                                <p className="font-semibold text-charcoal">
                                                    {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Contato</p>
                                                <p className="font-semibold text-charcoal">{apt.user.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gold">R$ {apt.service.price.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">{apt.service.duration} min</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-6xl mb-4">📭</p>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">Nenhum agendamento</h3>
                        <p className="text-gray-600">Não há agendamentos para o filtro selecionado</p>
                    </div>
                )}

                {/* Modal */}
                {selectedAppointment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppointment(null)}>
                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setSelectedAppointment(null)} className="float-right text-gray-400 hover:text-gray-600 text-2xl">×</button>
                            <h2 className="text-3xl font-bold text-charcoal mb-6">Detalhes</h2>

                            <div className="space-y-4">
                                <div className="bg-beige rounded-lg p-4">
                                    <h3 className="font-bold mb-2">👤 Cliente</h3>
                                    <p><strong>Nome:</strong> {selectedAppointment.user.name}</p>
                                    <p><strong>Email:</strong> {selectedAppointment.user.email}</p>
                                    <p><strong>Telefone:</strong> {selectedAppointment.user.phone}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(selectedAppointment.id, status)}
                                            disabled={selectedAppointment.status === status}
                                            className={`py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${status === 'PENDING' ? 'bg-orange-500 hover:bg-orange-600' :
                                                status === 'CONFIRMED' ? 'bg-green-500 hover:bg-green-600' :
                                                    status === 'COMPLETED' ? 'bg-blue-500 hover:bg-blue-600' :
                                                        status === 'NO_SHOW' ? 'bg-gray-500 hover:bg-gray-600' :
                                                            'bg-red-500 hover:bg-red-600'
                                                } text-white`}
                                        >
                                            {getStatusLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}