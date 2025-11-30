// ==========================================
// app/(dashboard)/meus-agendamentos/page.tsx
// ==========================================

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Ban, Trash2 } from 'lucide-react'
import Navbar from '@/components/NavBar'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    service: {
        name: string
        price: number
        duration: number
    }
}

export default function MeusAgendamentosPage() {
    const { data: session, status: sessionStatus } = useSession()
    const router = useRouter()
    const { showToast } = useToast()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('upcoming')

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push('/login')
        } else if (sessionStatus === 'authenticated') {
            fetchAppointments()
        }
    }, [sessionStatus, router])

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/appointments')
            const data = await res.json()

            if (data.success) {
                setAppointments(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error)
            showToast('Erro ao carregar agendamentos', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelAppointment = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
            return
        }

        try {
            const res = await fetch(`/api/appointments?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                showToast('Agendamento cancelado com sucesso', 'success')
                fetchAppointments()
            } else {
                showToast(data.error || 'Erro ao cancelar', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao cancelar agendamento', 'error')
        }
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return {
                    label: 'Concluído',
                    icon: CheckCircle,
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-200'
                }
            case 'CONFIRMED':
                return {
                    label: 'Confirmado',
                    icon: CheckCircle,
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-700',
                    borderColor: 'border-blue-200'
                }
            case 'PENDING':
                return {
                    label: 'Pendente',
                    icon: Clock,
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-700',
                    borderColor: 'border-orange-200'
                }
            case 'CANCELLED':
                return {
                    label: 'Cancelado',
                    icon: XCircle,
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-200'
                }
            case 'NO_SHOW':
                return {
                    label: 'Não Compareceu',
                    icon: Ban,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    borderColor: 'border-gray-300'
                }
            default:
                return {
                    label: status,
                    icon: AlertCircle,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    borderColor: 'border-gray-300'
                }
        }
    }

    const getFilteredAppointments = () => {
        const now = new Date()

        return appointments.filter(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.time)

            switch (filterStatus) {
                case 'upcoming':
                    // Próximos (pendentes ou confirmados e data futura)
                    return (apt.status === 'PENDING' || apt.status === 'CONFIRMED') && aptDate >= now
                case 'past':
                    // Passados (todos com data passada)
                    return aptDate < now
                case 'completed':
                    return apt.status === 'COMPLETED'
                case 'cancelled':
                    return apt.status === 'CANCELLED'
                case 'no_show':
                    return apt.status === 'NO_SHOW'
                default:
                    return true
            }
        }).sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time)
            const dateB = new Date(b.date + 'T' + b.time)
            return dateB.getTime() - dateA.getTime()
        })
    }

    const filteredAppointments = getFilteredAppointments()
    const upcomingCount = appointments.filter(a => {
        const aptDate = new Date(a.date + 'T' + a.time)
        return (a.status === 'PENDING' || a.status === 'CONFIRMED') && aptDate >= new Date()
    }).length

    if (sessionStatus === 'loading' || loading) {
        return (
            <>
                <Navbar />
                <div className="h-20" />
                <div className="min-h-screen bg-beige flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando agendamentos...</p>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className="h-20" />

            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-charcoal mb-2">
                                Meus Agendamentos
                            </h1>
                            <p className="text-gray-600">
                                Gerencie seus horários agendados
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/agendar')}
                            variant="primary"
                        >
                            + Novo Agendamento
                        </Button>
                    </div>

                    {/* Alerta de próximos agendamentos */}
                    {upcomingCount > 0 && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                            <div>
                                <p className="text-blue-900 font-semibold">
                                    Você tem {upcomingCount} agendamento{upcomingCount > 1 ? 's' : ''} próximo{upcomingCount > 1 ? 's' : ''}
                                </p>
                                <p className="text-blue-700 text-sm">
                                    Não esqueça de comparecer ou cancelar com antecedência!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Filtros */}
                    <div className="flex gap-3 flex-wrap mb-6">
                        {[
                            { value: 'upcoming', label: 'Próximos', icon: '📅', count: upcomingCount },
                            { value: 'past', label: 'Passados', icon: '📋' },
                            { value: 'completed', label: 'Concluídos', icon: '✅' },
                            { value: 'cancelled', label: 'Cancelados', icon: '❌' },
                            { value: 'no_show', label: 'Não Compareci', icon: '🚫' }
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterStatus(filter.value)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filterStatus === filter.value
                                        ? 'bg-gradient-gold text-white shadow-lg'
                                        : 'bg-white text-charcoal hover:shadow-md'
                                    }`}
                            >
                                {filter.icon} {filter.label}
                                {filter.count !== undefined && filter.count > 0 && (
                                    <span className="ml-1 bg-white text-gold px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filter.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Lista de agendamentos */}
                    {filteredAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredAppointments.map(appointment => {
                                const statusInfo = getStatusInfo(appointment.status)
                                const StatusIcon = statusInfo.icon
                                const aptDate = new Date(appointment.date + 'T' + appointment.time)
                                const isPast = aptDate < new Date()
                                const canCancel = !isPast && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED')

                                return (
                                    <div
                                        key={appointment.id}
                                        className={`bg-white rounded-xl shadow p-6 border-2 ${statusInfo.borderColor}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-bold text-charcoal">
                                                        {appointment.service.name}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                        <StatusIcon size={14} />
                                                        {statusInfo.label}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={16} />
                                                        {aptDate.toLocaleDateString('pt-BR', {
                                                            weekday: 'long',
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={16} />
                                                        {appointment.time}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>{appointment.service.duration} min</span>
                                                </div>

                                                {appointment.notes && (
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        <strong>Observações:</strong> {appointment.notes}
                                                    </p>
                                                )}

                                                {canCancel && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(appointment.id)}
                                                        className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} />
                                                        Cancelar Agendamento
                                                    </button>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-gold block">
                                                    R$ {appointment.service.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <p className="text-6xl mb-4">📭</p>
                            <h3 className="text-2xl font-bold text-charcoal mb-2">
                                Nenhum agendamento
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Você não tem agendamentos nesta categoria
                            </p>
                            <Button
                                onClick={() => router.push('/agendar')}
                                variant="primary"
                            >
                                Fazer Novo Agendamento
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}