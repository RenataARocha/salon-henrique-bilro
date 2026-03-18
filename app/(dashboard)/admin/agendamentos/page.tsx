'use client'

import { useState, useEffect, useMemo } from 'react'
import { Filter, X, Search, CheckSquare, Square, FileText, Link, ArrowLeft, Home } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import RescheduleModal from '@/components/appointments/RescheduleModal'
import { Calendar } from 'lucide-react'
import { motion } from 'framer-motion'


type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface Service {
    id: string
    name: string
    price: number
    duration: number
}

export interface ServiceCombo {
    id: string
    name: string
    services: Service[]
    originalPrice: number
    comboPrice: number
    discountPercent: number
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
    staffName?: string | null
    user: {
        name: string
        email: string
        phone: string
    }
    service?: Service
    combo?: ServiceCombo
    staffServices?: Array<{
        staff: {
            name: string
        }
    }>
}

type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

// Componente de Barra de Ações em Massa
function BulkActionsBar({
    selectedCount,
    onConfirm,
    onCancel,
    onComplete,
    onNoShow,
    onDelete,
    onReschedule,
    onClearSelection
}: {
    selectedCount: number
    onConfirm: () => void
    onCancel: () => void
    onComplete: () => void
    onNoShow: () => void
    onDelete: () => void
    onReschedule: () => void
    onClearSelection: () => void
}) {
    if (selectedCount === 0) return null




    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-white rounded-2xl shadow-2xl p-6 z-50 min-w-[700px] animate-slide-up">
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gold rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {selectedCount}
                    </div>
                    <span className="font-semibold">
                        {selectedCount} {selectedCount === 1 ? 'agendamento selecionado' : 'agendamentos selecionados'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* ✅ NOVO BOTÃO */}
                    {selectedCount === 1 && (
                        <button
                            onClick={onReschedule}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            title="Reagendar"
                        >
                            <Calendar size={18} />
                            Reagendar
                        </button>
                    )}

                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                        title="Confirmar selecionados"
                    >
                        ✅ Confirmar
                    </button>
                    <button
                        onClick={onComplete}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                        title="Concluir selecionados"
                    >
                        🎉 Concluir
                    </button>
                    <button
                        onClick={onNoShow}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                        title="Marcar como não compareceu"
                    >
                        🚫 Não Compareceu
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors"
                        title="Cancelar selecionados"
                    >
                        ❌ Cancelar
                    </button>
                    <div className="w-px h-8 bg-gray-600"></div>
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        title="EXCLUIR permanentemente selecionados"
                    >
                        🗑️ Excluir
                    </button>
                    <button
                        onClick={onClearSelection}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition-colors"
                        title="Limpar seleção"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ✅ MODAL DE DETALHES COM JUSTIFICATIVA
function AppointmentDetailsModal({
    appointment,
    onClose,
    getStatusColor,
    getStatusLabel
}: {
    appointment: Appointment
    onClose: () => void
    getStatusColor: (status: string) => string
    getStatusLabel: (status: string) => string
}) {
    const price = appointment.combo
        ? appointment.combo.comboPrice
        : appointment.service?.price ?? 0

    const duration = appointment.combo
        ? appointment.combo.services.reduce((total, s) => total + s.duration, 0)
        : appointment.service?.duration ?? 0


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-charcoal">Detalhes do Agendamento</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Cliente</p>
                                <p className="font-semibold text-charcoal text-lg">{appointment.user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
                                    {getStatusLabel(appointment.status)}
                                </span>

                                {appointment.status === 'COMPLETED' && appointment.staffName && (
                                    <p className="text-xs text-green-600 font-semibold mt-1 bg-green-50 px-2 py-1 rounded inline-block">
                                        👤 Executado por: {appointment.staffName}
                                    </p>
                                )}

                            </div>


                            <div>
                                <p className="text-sm text-gray-500 mb-1">Telefone</p>
                                <p className="font-semibold text-charcoal">{appointment.user.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <p className="font-semibold text-charcoal">{appointment.user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Serviço</p>
                                <p className="font-semibold text-charcoal">{appointment.service?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Valor</p>
                                <p className="text-2xl font-bold text-gold">
                                    R$ {price.toFixed(2)}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {duration} min
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Data</p>
                                <p className="font-semibold text-charcoal">
                                    {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Horário</p>
                                <p className="font-semibold text-charcoal">{appointment.time}</p>
                            </div>
                            {appointment.paymentMethod && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Pagamento</p>
                                    <p className="font-semibold text-charcoal">{appointment.paymentMethod}</p>
                                </div>
                            )}
                        </div>

                        {appointment.notes && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Observações</p>
                                <p className="text-charcoal bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
                            </div>
                        )}

                        {/* ✅ MOSTRAR JUSTIFICATIVA NO MODAL */}
                        {appointment.justification && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <p className="font-bold text-blue-900 mb-2">
                                            ✅ Justificativa da Cliente
                                        </p>
                                        <p className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 mb-2">
                                            {appointment.justification}
                                        </p>
                                        {appointment.justifiedAt && (
                                            <p className="text-xs text-blue-600">
                                                📅 Enviada em {new Date(appointment.justifiedAt).toLocaleDateString('pt-BR')} às {new Date(appointment.justifiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const normalizePaymentMethod = (value?: string) => {
    if (!value) return ''
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .toUpperCase()
}


// Componente Principal
export default function AdminAgendamentosPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null)

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


    // NOVO useEffect
    useEffect(() => {
        fetchAppointments()
        fetchServices()
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

    // Funções de Seleção
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAppointments.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAppointments.map(apt => apt.id)))
        }
    }

    const clearSelection = () => {
        setSelectedIds(new Set())
    }

    const handleOpenReschedule = (appointment: Appointment) => {
        setAppointmentToReschedule(appointment)
        setShowRescheduleModal(true)
    }

    const handleCloseReschedule = () => {
        setShowRescheduleModal(false)
        setAppointmentToReschedule(null)
    }

    const handleRescheduleSuccess = () => {
        fetchAppointments() // Recarregar lista
        handleCloseReschedule()
    }

    // Ações em Massa
    const handleBulkAction = async (action: AppointmentStatus) => {
        if (selectedIds.size === 0) return

        // ✅ VALIDAR: Só pode concluir CONFIRMED
        if (action === 'COMPLETED') {
            const selectedAppointments = appointments.filter(a => selectedIds.has(a.id))
            const invalidStatuses = selectedAppointments.filter(a =>
                a.status !== 'CONFIRMED'
            )

            if (invalidStatuses.length > 0) {
                alert(
                    `❌ Não é possível concluir estes agendamentos!\n\n` +
                    `${invalidStatuses.length} agendamento(s) com status inválido.\n\n` +
                    `Apenas agendamentos CONFIRMADOS podem ser concluídos.\n\n` +
                    `Status encontrados: ${[...new Set(invalidStatuses.map(a => getStatusLabel(a.status)))].join(', ')}`
                )
                return
            }
        }

        const confirmMessage = `Deseja realmente ${action === 'CONFIRMED' ? 'confirmar' :
            action === 'COMPLETED' ? 'concluir' :
                action === 'NO_SHOW' ? 'marcar como não compareceu' :
                    'cancelar'
            } ${selectedIds.size} agendamento(s)?`

        if (!confirm(confirmMessage)) return

        try {
            const promises = Array.from(selectedIds).map(id =>
                fetch(`/api/admin/appointments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: action })
                })
            )

            await Promise.all(promises)
            await fetchAppointments()
            setSelectedIds(new Set())
            alert(`${selectedIds.size} agendamento(s) atualizado(s) com sucesso!`)
        } catch (error) {
            console.error('Erro ao realizar ação em massa:', error)
            alert('Erro ao atualizar agendamentos')
        }
    }


    const handleBulkReschedule = () => {
        if (selectedIds.size !== 1) {
            alert('Selecione apenas 1 agendamento para reagendar')
            return
        }

        const appointmentId = Array.from(selectedIds)[0]
        const appointment = appointments.find(a => a.id === appointmentId)

        if (!appointment) return

        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            alert('Só é possível reagendar agendamentos pendentes ou confirmados')
            return
        }

        handleOpenReschedule(appointment)
    }

    // Excluir em Massa
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        // Confirmação robusta com aviso de perigo
        const firstConfirm = confirm(
            `⚠️ ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE ${selectedIds.size} agendamento(s)!\n\n` +
            `Esta ação NÃO PODE ser desfeita!\n\n` +
            `Os dados serão perdidos para sempre.\n\n` +
            `Deseja continuar?`
        )

        if (!firstConfirm) return

        // Segunda confirmação
        const secondConfirm = confirm(
            `🚨 ÚLTIMA CONFIRMAÇÃO!\n\n` +
            `Tem CERTEZA ABSOLUTA que deseja excluir ${selectedIds.size} agendamento(s)?\n\n` +
            `Digite OK mentalmente e clique em "OK" para confirmar.`
        )

        if (!secondConfirm) return

        try {
            const promises = Array.from(selectedIds).map(id =>
                fetch(`/api/admin/appointments/${id}`, {
                    method: 'DELETE'
                })
            )

            const results = await Promise.all(promises)

            // Verifica se todas as exclusões foram bem-sucedidas
            const failedCount = results.filter(r => !r.ok).length

            if (failedCount > 0) {
                alert(`⚠️ ${failedCount} agendamento(s) não puderam ser excluídos. Os demais foram removidos.`)
            } else {
                alert(`✅ ${selectedIds.size} agendamento(s) excluído(s) com sucesso!`)
            }

            await fetchAppointments()
            setSelectedIds(new Set())
        } catch (error) {
            console.error('Erro ao excluir agendamentos:', error)
            alert('❌ Erro ao excluir agendamentos. Tente novamente.')
        }
    }

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

        const filtered = appointments.filter(apt => {
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

                const payment = normalizePaymentMethod(apt.paymentMethod)
                if (!selectedPaymentMethods.includes(payment)) {
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
        const buildDateTime = (date: string, time: string) => {
            const [hour, minute] = time.split(':')
            const d = new Date(date)
            d.setHours(Number(hour), Number(minute), 0, 0)
            return d
        }


        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': {
                    return buildDateTime(a.date, a.time).getTime() -
                        buildDateTime(b.date, b.time).getTime()
                }
                case 'date-desc': {
                    return buildDateTime(b.date, b.time).getTime() -
                        buildDateTime(a.date, a.time).getTime()
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
            .reduce((sum, a) => {
                if (a.combo) return sum + a.combo.comboPrice
                return sum + (a.service?.price ?? 0)
            }, 0)

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
    const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId)

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
        <div className="min-h-screen bg-beige py-6 sm:py-8 px-3 sm:px-4 pb-32">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header */}
                <AdminHeader
                    title="Agendamentos"
                    description="Gerencie todos os agendamentos do salão"
                />

                {/* Barra de Busca e Controles */}
                <motion.div
                    className="bg-white rounded-xl p-4 shadow space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col sm:flex-row gap-3">
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
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors relative w-full sm:w-auto`}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Serviços ({selectedServices.length})
                                    </label>
                                    <div className="space-y-2 max-h-48 sm:max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Forma de Pagamento
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'PIX', label: '💳 PIX' },
                                            { value: 'CARTAO_DE_CREDITO', label: '💳 Cartão Crédito' }, // ✅ ADICIONAR _DE_
                                            { value: 'CARTAO_DE_DEBITO', label: '💳 Cartão Débito' },   // ✅ ADICIONAR _DE_
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
                </motion.div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-charcoal' },
                        { label: 'Pendentes', value: stats.pending, color: 'text-orange-600' },
                        { label: 'Confirmados', value: stats.confirmed, color: 'text-green-600' },
                        { label: 'Concluídos', value: stats.completed, color: 'text-blue-600' },
                        { label: 'Receita', value: `R$ ${stats.revenue.toFixed(2)}`, color: 'text-gold' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-white rounded-xl p-4 sm:p-6 shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                        >
                            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                            <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                                {stat.value}
                            </p>

                        </motion.div>
                    ))}
                </div>


                {/* Filtros de Período */}
                <motion.div
                    className="bg-white rounded-xl p-6 shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
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
                        ].map((filter, index) => (
                            <motion.button
                                key={filter.value}
                                onClick={() =>
                                    setFilterPeriod(filter.value as 'today' | 'week' | 'month' | 'all')
                                }
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${filterPeriod === filter.value
                                    ? 'bg-gradient-to-r from-gold to-yellow-600 text-white shadow-lg'
                                    : 'bg-beige text-charcoal hover:shadow-md'
                                    }`}
                            >
                                {filter.icon} {filter.label}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>


                {/* Filtros de Status */}
                <motion.div
                    className="flex gap-3 flex-wrap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {[
                        { value: 'all', label: 'Todos', icon: '📋' },
                        { value: 'PENDING', label: 'Pendentes', icon: '⏳' },
                        { value: 'CONFIRMED', label: 'Confirmados', icon: '✅' },
                        { value: 'COMPLETED', label: 'Concluídos', icon: '🎉' },
                        { value: 'NO_SHOW', label: 'Não Compareceu', icon: '🚫' },
                        { value: 'CANCELLED', label: 'Cancelados', icon: '❌' }
                    ].map((filter, index) => (
                        <motion.button
                            key={filter.value}
                            onClick={() => setFilterStatus(filter.value)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${filterStatus === filter.value
                                ? 'bg-gradient-to-r from-gold to-yellow-600 text-white shadow-lg'
                                : 'bg-white text-charcoal hover:shadow-md'
                                }`}
                        >
                            {filter.icon} {filter.label}
                        </motion.button>
                    ))}
                </motion.div>


                {/* Lista com Checkboxes */}
                {filteredAppointments.length > 0 ? (
                    <>
                        {/* Botão Selecionar Todos */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <p className="text-gray-600">
                                {filteredAppointments.length}{' '}
                                {filteredAppointments.length === 1
                                    ? 'agendamento encontrado'
                                    : 'agendamentos encontrados'}
                            </p>
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-gold hover:bg-gold hover:text-white transition-colors font-semibold"
                            >
                                {selectedIds.size === filteredAppointments.length ? (
                                    <>
                                        <CheckSquare size={20} /> Desmarcar Todos
                                    </>
                                ) : (
                                    <>
                                        <Square size={20} /> Selecionar Todos
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Lista */}

                        <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-2">
                            {filteredAppointments.map((apt, index) => {
                                const price = apt.combo
                                    ? apt.combo.comboPrice
                                    : apt.service?.price ?? 0

                                const duration = apt.combo
                                    ? apt.combo.services.reduce((total, s) => total + s.duration, 0)
                                    : apt.service?.duration ?? 0


                                return (
                                    <motion.div
                                        key={apt.id}
                                        className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${selectedIds.has(apt.id) ? 'ring-2 ring-gold' : ''
                                            }`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        {/* card */}
                                        <div
                                            key={apt.id}
                                            onClick={() => setSelectedAppointmentId(apt.id)}
                                            className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer ${selectedIds.has(apt.id) ? 'ring-2 ring-gold' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(apt.id)}
                                                        onChange={() => toggleSelection(apt.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="mt-1 rounded text-gold focus:ring-gold"
                                                    />

                                                    <div>
                                                        <p className="font-bold text-lg text-charcoal">
                                                            {apt.user.name}
                                                        </p>

                                                        <p className="text-sm text-gray-600">
                                                            {apt.combo ? (
                                                                <>🎁 <strong>Combo:</strong> {apt.combo.name}</>
                                                            ) : (
                                                                <>✂️ {apt.service?.name}</>
                                                            )}
                                                        </p>

                                                        {/* ✅ MOSTRAR FUNCIONÁRIO NOS CONCLUÍDOS */}
                                                        <p className="text-sm text-gray-500">
                                                            📅 {new Date(apt.date).toLocaleDateString('pt-BR')} • ⏰ {apt.time}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${getStatusColor(apt.status)}`}>
                                                        {getStatusLabel(apt.status)}
                                                    </span>

                                                    {apt.status === 'COMPLETED' && apt.staffName && (
                                                        <p className="text-xs text-green-600 font-semibold mt-1 bg-green-50 px-2 py-1 rounded inline-block">
                                                            👤 Executado por: {apt.staffName}
                                                        </p>
                                                    )}

                                                    <p className="text-lg font-bold text-gold">
                                                        R$ {price.toFixed(2)}
                                                    </p>


                                                    <p className="text-sm text-gray-500">
                                                        {duration} min
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ✅ BADGE DE JUSTIFICATIVA NO CARD */}
                                            {apt.justification && (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-blue-900 mb-1">
                                                                ✅ Cliente justificou a falta
                                                            </p>
                                                            <p className="text-xs text-blue-800 line-clamp-2">
                                                                {apt.justification}
                                                            </p>
                                                            {apt.justifiedAt && (
                                                                <p className="text-xs text-blue-600 mt-1">
                                                                    📅 {new Date(apt.justifiedAt).toLocaleDateString('pt-BR')} às {new Date(apt.justifiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </motion.div>

                                )
                            })}
                        </div>

                        {/* Modal */}
                        {selectedAppointment && (
                            <AppointmentDetailsModal
                                appointment={selectedAppointment}
                                onClose={() => setSelectedAppointmentId(null)}
                                getStatusColor={getStatusColor}
                                getStatusLabel={getStatusLabel}
                            />
                        )}

                        {/* Barra de Ações em Massa */}
                        <BulkActionsBar
                            selectedCount={selectedIds.size}
                            onConfirm={() => handleBulkAction('CONFIRMED')}
                            onCancel={() => handleBulkAction('CANCELLED')}
                            onComplete={() => handleBulkAction('COMPLETED')}
                            onNoShow={() => handleBulkAction('NO_SHOW')}
                            onDelete={handleBulkDelete}
                            onReschedule={handleBulkReschedule}
                            onClearSelection={clearSelection}
                        />
                    </>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-6xl mb-4">📭</p>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">
                            Nenhum agendamento
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? `Nenhum resultado encontrado para "${searchTerm}"`
                                : 'Não há agendamentos para os filtros selecionados'}
                        </p>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 text-gold hover:text-yellow-600 font-semibold"
                            >
                                Limpar todos os filtros
                            </button>
                        )}


                    </div>
                )}

                {/* Modal de Reagendamento */}
                {showRescheduleModal && appointmentToReschedule && (
                    <RescheduleModal
                        appointment={{
                            id: appointmentToReschedule.id,
                            date: appointmentToReschedule.date,
                            time: appointmentToReschedule.time,
                            service: appointmentToReschedule.service || {
                                name: appointmentToReschedule.combo?.name || 'Serviço',
                                duration:
                                    appointmentToReschedule.combo?.services.reduce(
                                        (sum, s) => sum + s.duration,
                                        0
                                    ) || 60
                            }
                        }}
                        onClose={handleCloseReschedule}
                        onSuccess={handleRescheduleSuccess}
                    />
                )}


                <style jsx global>{`
                @keyframes slide-up {
                    from {
                        transform: translate(-50%, 100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }

                .text-gold {
                    color: #D4AF37;
                }

                .bg-gold {
                    background-color: #D4AF37;
                }

                .border-gold {
                    border-color: #D4AF37;
                }

                .ring-gold {
                    --tw-ring-color: #D4AF37;
                }

                .hover\:text-gold:hover {
                    color: #D4AF37;
                }

                .hover\:bg-gold:hover {
                    background-color: #D4AF37;
                }

                .focus\:ring-gold:focus {
                    --tw-ring-color: #D4AF37;
                }

                .text-charcoal {
                    color: #2C2C2C;
                }

                .bg-charcoal {
                    background-color: #2C2C2C;
                }

                .bg-beige {
                    background-color: #F5F5DC;
                }
            `}</style>
            </div>
        </div >)
}