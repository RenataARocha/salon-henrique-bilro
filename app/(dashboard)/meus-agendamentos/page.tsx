// app/(dashboard)/meus-agendamentos/page.tsx 

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Ban, Tag, Percent, Calendar as CalendarIcon, FileText } from 'lucide-react'
import Navbar from '@/components/NavBar'
import RescheduleModal from '@/components/appointments/RescheduleModal'
import JustificationModal from '@/components/JustificationModal' // ✅ IMPORT DO MODAL
import { isAfter, subHours, parseISO } from 'date-fns'
import { motion } from 'framer-motion'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    justification?: string | null // ✅ CAMPO DE JUSTIFICATIVA
    justifiedAt?: Date | null // ✅ DATA DA JUSTIFICATIVA
    service: {
        name: string
        price: number
        duration: number
    }
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
    const [justifyAppointment, setJustifyAppointment] = useState<Appointment | null>(null) // ✅ ESTADO DO MODAL

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
                return { label: 'Concluído', icon: CheckCircle, bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' }
            case 'CONFIRMED':
                return { label: 'Confirmado', icon: CheckCircle, bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' }
            case 'PENDING':
                return { label: 'Pendente', icon: Clock, bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200' }
            case 'CANCELLED':
                return { label: 'Cancelado', icon: XCircle, bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' }
            case 'NO_SHOW':
                return { label: 'Não Compareceu', icon: Ban, bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' }
            default:
                return { label: status, icon: AlertCircle, bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' }
        }
    }

    const canReschedule = (appointment: Appointment) => {
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return false;

        try {
            const dateOnly = appointment.date.split('T')[0];
            const appointmentDateTime = parseISO(`${dateOnly}T${appointment.time}`);
            const limitTime = subHours(appointmentDateTime, 2);
            return isAfter(limitTime, new Date());
        } catch (error) {
            console.error('❌ Erro ao verificar reagendamento:', error);
            return false;
        }
    }

    // ✅ FUNÇÃO PARA VERIFICAR SE PODE JUSTIFICAR
    const canJustify = (appointment: Appointment) => {
        return appointment.status === 'NO_SHOW' && !appointment.justification
    }

    const handleRescheduleSuccess = () => {
        setRescheduleAppointment(null)
        fetchAppointments()
    }

    // ✅ HANDLER PARA SUCESSO DA JUSTIFICATIVA
    const handleJustificationSuccess = () => {
        setJustifyAppointment(null)
        fetchAppointments()
    }

    const stats = useMemo(() => ({
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length
    }), [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [appointments, filterStatus]);

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
                    <motion.div
                        className="flex items-center justify-between mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div>
                            <h1 className="text-4xl font-bold text-charcoal mb-2">
                                Meu Histórico
                            </h1>
                            <p className="text-gray-600">
                                Acompanhe todos os seus agendamentos
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/agendar')}
                            className="bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <CalendarIcon size={20} />
                            Novo Agendamento
                        </button>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-charcoal' },
                            { label: 'Concluídos', value: stats.completed, color: 'text-green-600' },
                            { label: 'Cancelados', value: stats.cancelled, color: 'text-red-600' },
                            { label: 'Não Compareceu', value: stats.noShow, color: 'text-gray-600' }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="bg-white rounded-xl p-6 shadow"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
                            >
                                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="flex gap-3 flex-wrap mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
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
                    </motion.div>

                    {filteredAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment, index) => {
                                const statusInfo = getStatusInfo(appointment.status)
                                const StatusIcon = statusInfo.icon

                                return (
                                    <motion.div
                                        key={appointment.id}
                                        className={`bg-white rounded-xl shadow p-6 border-2 ${statusInfo.borderColor}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-charcoal mb-2">
                                                    {appointment.service?.name || 'Serviço não identificado'}
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
                                                    <span>{appointment.service?.duration || 60} min</span>
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
                                                {appointment.couponId ? (
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-green-600">
                                                            R$ {(appointment.finalPrice ?? appointment.service?.price ?? 0).toFixed(2)}
                                                        </span>
                                                        <p className="text-xs text-gray-500 line-through">
                                                            R$ {(appointment.service?.price ?? 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-gold">
                                                        R$ {(appointment.service?.price ?? 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

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

                                        {/* ✅ MOSTRAR JUSTIFICATIVA SE EXISTIR */}
                                        {appointment.justification && (
                                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-blue-900 text-sm mb-1">
                                                            ✅ Justificativa Enviada
                                                        </p>
                                                        <p className="text-sm text-blue-800 mb-2">
                                                            {appointment.justification}
                                                        </p>
                                                        {appointment.justifiedAt && (
                                                            <p className="text-xs text-blue-600">
                                                                Enviada em {new Date(appointment.justifiedAt).toLocaleDateString('pt-BR')} às {new Date(appointment.justifiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
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

                                            {/* ✅ BOTÃO DE JUSTIFICAR FALTA */}
                                            {canJustify(appointment) && (
                                                <button
                                                    onClick={() => setJustifyAppointment(appointment)}
                                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                                                >
                                                    <FileText size={16} />
                                                    Justificar Falta
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
                                    </motion.div>
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

            {/* ✅ MODAL DE JUSTIFICATIVA */}
            {justifyAppointment && (
                <JustificationModal
                    appointmentId={justifyAppointment.id}
                    serviceName={justifyAppointment.service?.name || 'Serviço'}
                    date={justifyAppointment.date}
                    time={justifyAppointment.time}
                    onClose={() => setJustifyAppointment(null)}
                    onSuccess={handleJustificationSuccess}
                />
            )}
        </>
    )
}