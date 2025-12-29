'use client'

import { useState, useEffect, useMemo } from 'react'
import { Filter, X, Search } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import AppointmentDetailsModal from '@/components/admin/AppointmentDetailsModal'

type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

interface Service {
    id: string
    name: string
    price: number
    duration: number
}

interface Appointment {
    id: string
    date: string
    time: string
    status: AppointmentStatus
    notes?: string
    justification?: string
    justifiedAt?: string
    paymentMethod?: string
    serviceId?: string
    user: {
        name: string
        email: string
        phone: string
    }
    service: {
        id?: string
        name: string
        price: number
        duration: number
    }
}

type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

export default function AdminAgendamentosPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    // Filtros
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string[]>([])
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<SortOption>('date-desc')

    // UI
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    useEffect(() => {
        fetchAppointments()
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services')
            const data = await res.json()
            if (data.success) {
                setServices(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar serviços:', error)
        }
    }

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

    const getTimeOfDay = (time: string): string => {
        const hour = parseInt(time.split(':')[0])
        if (hour >= 6 && hour < 12) return 'morning'
        if (hour >= 12 && hour < 18) return 'afternoon'
        return 'evening'
    }

    const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
        if (array.includes(item)) {
            setArray(array.filter(i => i !== item))
        } else {
            setArray([...array, item])
        }
    }

    const clearAllFilters = () => {
        setSearchTerm('')
        setFilterStatus('all')
        setFilterPeriod('all')
        setSelectedServices([])
        setSelectedTimeOfDay([])
        setSelectedPaymentMethods([])
        setSortBy('date-desc')
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (searchTerm) count++
        if (filterStatus !== 'all') count++
        if (filterPeriod !== 'all') count++
        if (selectedServices.length > 0) count++
        if (selectedTimeOfDay.length > 0) count++
        if (selectedPaymentMethods.length > 0) count++
        return count
    }

    // UseMemo para forçar re-render quando sortBy mudar
    const filteredAppointments = useMemo(() => {
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

        let filtered = appointments.filter(apt => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                const matchName = apt.user.name.toLowerCase().includes(search)
                const matchPhone = apt.user.phone.includes(search)
                const matchEmail = apt.user.email.toLowerCase().includes(search)
                const matchId = apt.id.toLowerCase().includes(search)

                if (!matchName && !matchPhone && !matchEmail && !matchId) {
                    return false
                }
            }

            if (filterStatus !== 'all' && apt.status !== filterStatus) return false

            if (selectedServices.length > 0) {
                const serviceId = apt.serviceId || apt.service?.id
                if (!serviceId || !selectedServices.includes(serviceId)) {
                    return false
                }
            }

            if (selectedTimeOfDay.length > 0) {
                const timeOfDay = getTimeOfDay(apt.time)
                if (!selectedTimeOfDay.includes(timeOfDay)) {
                    return false
                }
            }

            if (selectedPaymentMethods.length > 0) {
                if (!apt.paymentMethod) return false
                const normalizedPayment = apt.paymentMethod.toUpperCase()
                if (!selectedPaymentMethods.includes(normalizedPayment)) {
                    return false
                }
            }

            if (filterPeriod !== 'all') {
                const aptDate = new Date(apt.date)

                switch (filterPeriod) {
                    case 'today':
                        if (aptDate.toDateString() !== today.toDateString()) return false
                        break
                    case 'week':
                        if (aptDate < weekStart || aptDate > weekEnd) return false
                        break
                    case 'month':
                        if (aptDate < monthStart || aptDate > monthEnd) return false
                        break
                }
            }

            return true
        })

        // Ordenação
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': {
                    const dateA = new Date(a.date + 'T' + a.time)
                    const dateB = new Date(b.date + 'T' + b.time)
                    return dateA.getTime() - dateB.getTime()
                }
                case 'date-desc': {
                    const dateA = new Date(a.date + 'T' + a.time)
                    const dateB = new Date(b.date + 'T' + b.time)
                    return dateB.getTime() - dateA.getTime()
                }
                case 'price-asc':
                    return (a.service?.price || 0) - (b.service?.price || 0)
                case 'price-desc':
                    return (b.service?.price || 0) - (a.service?.price || 0)
                case 'name-asc':
                    return a.user.name.localeCompare(b.user.name)
                case 'name-desc':
                    return b.user.name.localeCompare(a.user.name)
                default:
                    return 0
            }
        })

        return sorted
    }, [appointments, searchTerm, filterStatus, filterPeriod, selectedServices, selectedTimeOfDay, selectedPaymentMethods, sortBy])

    const stats = useMemo(() => ({
        total: filteredAppointments.length,
        pending: filteredAppointments.filter(a => a.status === 'PENDING').length,
        confirmed: filteredAppointments.filter(a => a.status === 'CONFIRMED').length,
        completed: filteredAppointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: filteredAppointments.filter(a => a.status === 'CANCELLED').length,
        revenue: filteredAppointments
            .filter(a => a.status === 'COMPLETED')
            .reduce((sum, a) => sum + a.service.price, 0)
    }), [filteredAppointments])

    const getStatusColor = (status: string): string => {
        const colors: Record<AppointmentStatus, string> = {
            CONFIRMED: 'bg-green-100 text-green-700',
            PENDING: 'bg-orange-100 text-orange-700',
            CANCELLED: 'bg-red-100 text-red-700',
            COMPLETED: 'bg-blue-100 text-blue-700',
            NO_SHOW: 'bg-gray-100 text-gray-700'
        }
        return colors[status as AppointmentStatus] || 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status: string): string => {
        const labels: Record<AppointmentStatus, string> = {
            CONFIRMED: 'Confirmado',
            PENDING: 'Pendente',
            CANCELLED: 'Cancelado',
            COMPLETED: 'Concluído',
            NO_SHOW: 'Não Compareceu'
        }
        return labels[status as AppointmentStatus] || status
    }

    const activeFiltersCount = getActiveFiltersCount()

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
                <AdminHeader
                    title="Agendamentos"
                    description="Gerencie todos os agendamentos do salão"
                    showBackButton={true}
                />

                {/* Barra de Busca e Controles */}
                <div className="bg-white rounded-xl p-4 shadow space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nome, telefone, email ou ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors relative ${showAdvancedFilters ? 'bg-gold text-white border-gold' : 'hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={20} />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                        >
                            <option value="date-desc">📅 Mais Recentes</option>
                            <option value="date-asc">📅 Mais Antigas</option>
                            <option value="price-desc">💰 Maior Valor</option>
                            <option value="price-asc">💰 Menor Valor</option>
                            <option value="name-asc">🔤 Nome A-Z</option>
                            <option value="name-desc">🔤 Nome Z-A</option>
                        </select>
                    </div>

                    {/* Filtros Avançados */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-charcoal">Filtros Avançados</h3>
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                                    >
                                        <X size={16} />
                                        Limpar Todos
                                    </button>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Filtro de Serviços */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Serviços ({selectedServices.length})
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                                        {services.length === 0 ? (
                                            <p className="text-sm text-gray-500 p-2">Nenhum serviço cadastrado</p>
                                        ) : (
                                            services.map(service => (
                                                <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.includes(service.id)}
                                                        onChange={() => toggleArrayItem(selectedServices, setSelectedServices, service.id)}
                                                        className="rounded text-gold focus:ring-gold"
                                                    />
                                                    <span className="text-sm">{service.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Filtro de Período do Dia */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Período do Dia
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'morning', label: '🌅 Manhã (6h-12h)' },
                                            { value: 'afternoon', label: '☀️ Tarde (12h-18h)' },
                                            { value: 'evening', label: '🌙 Noite (18h-23h)' }
                                        ].map(time => (
                                            <label key={time.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTimeOfDay.includes(time.value)}
                                                    onChange={() => toggleArrayItem(selectedTimeOfDay, setSelectedTimeOfDay, time.value)}
                                                    className="rounded text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm">{time.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Filtro de Pagamento */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Forma de Pagamento
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'PIX', label: '💳 PIX' },
                                            { value: 'CARTAO_CREDITO', label: '💳 Cartão Crédito' },
                                            { value: 'CARTAO_DEBITO', label: '💳 Cartão Débito' },
                                            { value: 'DINHEIRO', label: '💵 Dinheiro' }
                                        ].map(payment => (
                                            <label key={payment.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPaymentMethods.includes(payment.value)}
                                                    onChange={() => toggleArrayItem(selectedPaymentMethods, setSelectedPaymentMethods, payment.value)}
                                                    className="rounded text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm">{payment.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estatísticas */}
                <div className="grid md:grid-cols-5 gap-6">
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
                        <p className="text-gray-600 text-sm mb-1">Concluídos</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
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
                                onClick={() => setFilterPeriod(filter.value as 'today' | 'week' | 'month' | 'all')}
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
                                onClick={() => setSelectedAppointmentId(apt.id)}
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
                        <p className="text-gray-600">
                            {searchTerm
                                ? `Nenhum resultado encontrado para "${searchTerm}"`
                                : 'Não há agendamentos para os filtros selecionados'
                            }
                        </p>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 text-gold hover:text-gold-dark font-semibold"
                            >
                                Limpar todos os filtros
                            </button>
                        )}
                    </div>
                )}

                {selectedAppointmentId && (
                    <AppointmentDetailsModal
                        appointmentId={selectedAppointmentId}
                        onClose={() => setSelectedAppointmentId(null)}
                        onUpdate={fetchAppointments}
                    />
                )}
            </div>
        </div>
    )
}