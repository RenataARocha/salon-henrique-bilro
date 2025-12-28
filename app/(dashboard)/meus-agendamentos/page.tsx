// app/(dashboard)/meus-agendamentos/page.tsx 

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Ban, Tag, Percent } from 'lucide-react'
import Navbar from '@/components/NavBar'
import RescheduleModal from '@/components/appointments/RescheduleModal'
import { Calendar as CalendarIcon } from 'lucide-react'

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
    // ✅ NOVOS CAMPOS DE CUPOM
    couponId?: string | null
    discountAmount?: number
    finalPrice?: number | null
    coupon?: {
        code: string
        description: string
        discountType: string
        discountValue: number
    } | null
}

export default function HistoricoPage() {
    const { data: session, status: sessionStatus } = useSession()
    const router = useRouter()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null)

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
            console.error('Erro ao buscar histórico:', error)
        } finally {
            setLoading(false)
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

    const canReschedule = (appointment: Appointment) => {
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            return false
        }

        try {
            const dateOnly = appointment.date.split('T')[0]
            const timeOnly = appointment.time.substring(0, 5)
            const appointmentDateTime = new Date(`${dateOnly}T${timeOnly}:00`)
            const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

            if (isNaN(appointmentDateTime.getTime())) {
                console.error('❌ Data inválida:', appointment)
                return false
            }

            return appointmentDateTime > minTime
        } catch (error) {
            console.error('❌ Erro ao verificar reagendamento:', error, appointment)
            return false
        }
    }

    const handleRescheduleSuccess = () => {
        setRescheduleAppointment(null)
        fetchAppointments()
    }

    const filteredAppointments = appointments
        .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const stats = {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length
    }

    if (sessionStatus === 'loading' || loading) {
        return (
            <>
                <Navbar />
                <div className="h-20" />
                <div className="min-h-screen bg-beige flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando histórico...</p>
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
                    <h1 className="text-4xl font-bold text-charcoal mb-2">
                        Meu Histórico
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Acompanhe todos os seus agendamentos
                    </p>

                    {/* Estatísticas */}
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow">
                            <p className="text-gray-600 text-sm mb-1">Total</p>
                            <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow">
                            <p className="text-gray-600 text-sm mb-1">Concluídos</p>
                            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow">
                            <p className="text-gray-600 text-sm mb-1">Cancelados</p>
                            <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow">
                            <p className="text-gray-600 text-sm mb-1">Não Compareceu</p>
                            <p className="text-3xl font-bold text-gray-600">{stats.noShow}</p>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-3 flex-wrap mb-6">
                        {[
                            { value: 'all', label: 'Todos', icon: '📋' },
                            { value: 'COMPLETED', label: 'Concluídos', icon: '✅' },
                            { value: 'CONFIRMED', label: 'Confirmados', icon: '🔵' },
                            { value: 'PENDING', label: 'Pendentes', icon: '⏳' },
                            { value: 'CANCELLED', label: 'Cancelados', icon: '❌' },
                            { value: 'NO_SHOW', label: 'Não Compareceu', icon: '🚫' }
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
                            </button>
                        ))}
                    </div>

                    {/* Lista de agendamentos */}
                    {filteredAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredAppointments.map(appointment => {
                                const statusInfo = getStatusInfo(appointment.status)
                                const StatusIcon = statusInfo.icon

                                return (
                                    <div key={appointment.id} className={`bg-white rounded-xl shadow p-6 border-2 ${statusInfo.borderColor}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-charcoal mb-2">
                                                    {appointment.service.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={16} />
                                                        {new Date(appointment.date).toLocaleDateString('pt-BR', {
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
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        <strong>Obs:</strong> {appointment.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                    <StatusIcon size={14} />
                                                    {statusInfo.label}
                                                </span>
                                                {/* ✅ MOSTRAR VALOR COM CUPOM */}
                                                {appointment.couponId ? (
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-green-600">
                                                            R$ {(appointment.finalPrice || appointment.service.price).toFixed(2)}
                                                        </span>
                                                        <p className="text-xs text-gray-500 line-through">
                                                            R$ {appointment.service.price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-gold">
                                                        R$ {appointment.service.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ✅ BADGE DO CUPOM */}
                                        {appointment.couponId && appointment.coupon && (
                                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mb-3">
                                                <div className="flex items-start gap-2">
                                                    <Tag className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-green-900 text-sm">
                                                                Cupom: {appointment.coupon.code}
                                                            </p>
                                                            {appointment.coupon.discountType === 'PERCENTAGE' && (
                                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Percent size={10} /> {appointment.coupon.discountValue}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-green-700 mb-1">
                                                            {appointment.coupon.description}
                                                        </p>
                                                        <p className="text-xs text-green-600 font-semibold">
                                                            💰 Você economizou R$ {(appointment.discountAmount || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Botões de ação */}
                                        <div className="flex gap-3 mt-4">
                                            {canReschedule(appointment) && (
                                                <button
                                                    onClick={() => setRescheduleAppointment(appointment)}
                                                    className="flex items-center gap-2 text-sm text-gold hover:text-gold-dark font-semibold transition-colors cursor-pointer"
                                                >
                                                    <CalendarIcon size={16} />
                                                    Reagendar
                                                </button>
                                            )}

                                            {appointment.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => router.push('/agendar')}
                                                    className="text-sm text-gold hover:text-gold-dark font-semibold"
                                                >
                                                    Agendar novamente →
                                                </button>
                                            )}
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
                                {filterStatus === 'all'
                                    ? 'Você ainda não tem agendamentos'
                                    : `Você não tem agendamentos com status "${getStatusInfo(filterStatus).label}"`
                                }
                            </p>
                            <button
                                onClick={() => router.push('/agendar')}
                                className="bg-gradient-gold text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                            >
                                Fazer Primeiro Agendamento
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Reagendamento */}
            {rescheduleAppointment && (
                <RescheduleModal
                    appointment={rescheduleAppointment}
                    onClose={() => setRescheduleAppointment(null)}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
        </>
    )
}