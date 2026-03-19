'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Ban, Tag, Percent, Calendar as CalendarIcon, FileText } from 'lucide-react'
import Navbar from '@/components/NavBar'
import RescheduleModal from '@/components/appointments/RescheduleModal'
import JustificationModal from '@/components/JustificationModal'
import { isAfter, subHours, parseISO } from 'date-fns'
import { motion } from 'framer-motion'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    justification?: string | null
    justifiedAt?: Date | null
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
    const [justifyAppointment, setJustifyAppointment] = useState<Appointment | null>(null)

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
            if (data.success) setAppointments(data.data)
        } catch (error) {
            console.error('Erro ao buscar histórico:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { label: 'Concluído', icon: CheckCircle, bgColor: 'bg-emerald-900/40', textColor: 'text-emerald-400', borderColor: 'border-emerald-800/40' }
            case 'CONFIRMED':
                return { label: 'Confirmado', icon: CheckCircle, bgColor: 'bg-blue-900/40', textColor: 'text-blue-400', borderColor: 'border-blue-800/40' }
            case 'PENDING':
                return { label: 'Pendente', icon: Clock, bgColor: 'bg-orange-900/40', textColor: 'text-orange-400', borderColor: 'border-orange-800/40' }
            case 'CANCELLED':
                return { label: 'Cancelado', icon: XCircle, bgColor: 'bg-red-900/40', textColor: 'text-red-400', borderColor: 'border-red-800/40' }
            case 'NO_SHOW':
                return { label: 'Não Compareceu', icon: Ban, bgColor: 'bg-white/8', textColor: 'text-white/50', borderColor: 'border-white/10' }
            default:
                return { label: status, icon: AlertCircle, bgColor: 'bg-white/8', textColor: 'text-white/50', borderColor: 'border-white/10' }
        }
    }

    const canCancel = (appointment: Appointment) => {
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return false
        try {
            const dateOnly = appointment.date.split('T')[0]
            const appointmentDateTime = parseISO(`${dateOnly}T${appointment.time}`)
            return isAfter(subHours(appointmentDateTime, 24), new Date())
        } catch { return false }
    }

    const handleCancel = async (appointmentId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return
        try {
            const res = await fetch(`/api/appointments?id=${appointmentId}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) { alert('✅ Agendamento cancelado!'); fetchAppointments() }
            else alert('❌ ' + (data.error || 'Erro ao cancelar'))
        } catch { alert('❌ Erro ao cancelar agendamento') }
    }

    const canReschedule = (appointment: Appointment) => {
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return false
        try {
            const dateOnly = appointment.date.split('T')[0]
            const appointmentDateTime = parseISO(`${dateOnly}T${appointment.time}`)
            return isAfter(subHours(appointmentDateTime, 2), new Date())
        } catch { return false }
    }

    const canJustify = (appointment: Appointment) =>
        appointment.status === 'NO_SHOW' && !appointment.justification

    const handleRescheduleSuccess = () => { setRescheduleAppointment(null); fetchAppointments() }
    const handleJustificationSuccess = () => { setJustifyAppointment(null); fetchAppointments() }

    const stats = useMemo(() => ({
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
    }), [appointments])

    const filteredAppointments = useMemo(() =>
        appointments
            .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [appointments, filterStatus]
    )

    // ── Loading ──────────────────────────────────────────────────────────────
    if (sessionStatus === 'loading' || loading) {
        return (
            <>
                <Navbar />
                <div className="h-20" />
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4" />
                        <p className="text-white/40">Carregando histórico...</p>
                    </div>
                </div>
            </>
        )
    }

    // ── Page ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <div className="h-20" />

            <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <motion.div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 mb-2">
                                <div className="h-px w-6 bg-gold opacity-60" />
                                <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Histórico</span>
                                <div className="h-px w-6 bg-gold opacity-60" />
                            </div>
                            <h1
                                className="text-3xl sm:text-4xl font-bold mb-1"
                                style={{
                                    background: 'linear-gradient(135deg, #fff 0%, #c9a84c 50%, #fff 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                Meu Histórico
                            </h1>
                            <p className="text-white/40 text-sm">Acompanhe todos os seus agendamentos</p>
                        </div>
                        <button
                            onClick={() => router.push('/agendar')}
                            className="bg-gradient-gold text-white px-5 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all flex items-center gap-2 self-start sm:self-auto text-sm sm:text-base"
                        >
                            <CalendarIcon size={18} />
                            Novo Agendamento
                        </button>
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-white' },
                            { label: 'Concluídos', value: stats.completed, color: 'text-emerald-400' },
                            { label: 'Cancelados', value: stats.cancelled, color: 'text-red-400' },
                            { label: 'Não Compareceu', value: stats.noShow, color: 'text-white/40' },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="bg-[#141414] border border-white/8 rounded-xl p-4 sm:p-5"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                            >
                                <p className="text-white/40 text-xs sm:text-sm mb-1">{stat.label}</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filtros */}
                    <motion.div
                        className="flex gap-2 flex-wrap mb-6"
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
                            { value: 'NO_SHOW', label: 'Não Compareceu', icon: '🚫' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterStatus(filter.value)}
                                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${filterStatus === filter.value
                                        ? 'bg-gradient-gold text-white shadow-lg shadow-gold/20'
                                        : 'bg-white/5 border border-white/10 text-white/60 hover:border-gold/40 hover:text-white'
                                    }`}
                            >
                                {filter.icon} {filter.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Lista de agendamentos */}
                    {filteredAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment, index) => {
                                const statusInfo = getStatusInfo(appointment.status)
                                const StatusIcon = statusInfo.icon

                                return (
                                    <motion.div
                                        key={appointment.id}
                                        className={`bg-[#141414] rounded-xl border-2 ${statusInfo.borderColor} p-4 sm:p-6`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        {/* Topo do card */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-tight">
                                                    {appointment.service?.name || 'Serviço não identificado'}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/50">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(appointment.date).toLocaleDateString('pt-BR', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {appointment.time}
                                                    </span>
                                                    <span className="text-white/25">•</span>
                                                    <span>{appointment.service?.duration || 60} min</span>
                                                </div>
                                                {appointment.notes && (
                                                    <p className="text-xs text-white/40 mt-2">
                                                        <strong className="text-white/60">Obs:</strong> {appointment.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status + Preço */}
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                    <StatusIcon size={12} />
                                                    <span className="hidden sm:inline">{statusInfo.label}</span>
                                                    <span className="sm:hidden">{statusInfo.label.split(' ')[0]}</span>
                                                </span>
                                                {appointment.couponId ? (
                                                    <div className="text-right">
                                                        <span className="text-lg sm:text-2xl font-bold text-emerald-400">
                                                            R$ {(appointment.finalPrice ?? appointment.service?.price ?? 0).toFixed(2)}
                                                        </span>
                                                        <p className="text-xs text-white/30 line-through">
                                                            R$ {(appointment.service?.price ?? 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg sm:text-2xl font-bold text-gold">
                                                        R$ {(appointment.service?.price ?? 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cupom */}
                                        {appointment.couponId && appointment.coupon && (
                                            <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-3 mb-3">
                                                <div className="flex items-start gap-2">
                                                    <Tag className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <p className="font-bold text-emerald-300 text-xs sm:text-sm">
                                                                Cupom: {appointment.coupon.code}
                                                            </p>
                                                            {appointment.coupon.discountType === 'PERCENTAGE' && (
                                                                <span className="text-xs bg-emerald-900/60 text-emerald-300 border border-emerald-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Percent size={10} /> {appointment.coupon.discountValue}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-emerald-400/70 mb-1">{appointment.coupon.description}</p>
                                                        <p className="text-xs text-emerald-400 font-semibold">
                                                            💰 Você economizou R$ {(appointment.discountAmount || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Justificativa */}
                                        {appointment.justification && (
                                            <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3 mb-3">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-blue-300 text-xs sm:text-sm mb-1">
                                                            ✅ Justificativa Enviada
                                                        </p>
                                                        <p className="text-xs text-blue-300/70 mb-1">{appointment.justification}</p>
                                                        {appointment.justifiedAt && (
                                                            <p className="text-xs text-blue-400/50">
                                                                Enviada em {new Date(appointment.justifiedAt).toLocaleDateString('pt-BR')} às{' '}
                                                                {new Date(appointment.justifiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Botões de ação */}
                                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/8">
                                            {canReschedule(appointment) && (
                                                <button
                                                    onClick={() => setRescheduleAppointment(appointment)}
                                                    className="flex items-center gap-1.5 text-xs sm:text-sm text-gold hover:text-yellow-400 font-semibold transition-colors"
                                                >
                                                    <CalendarIcon size={14} />
                                                    Reagendar
                                                </button>
                                            )}
                                            {canCancel(appointment) && (
                                                <button
                                                    onClick={() => handleCancel(appointment.id)}
                                                    className="flex items-center gap-1.5 text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
                                                >
                                                    <XCircle size={14} />
                                                    Cancelar
                                                </button>
                                            )}
                                            {canJustify(appointment) && (
                                                <button
                                                    onClick={() => setJustifyAppointment(appointment)}
                                                    className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                                >
                                                    <FileText size={14} />
                                                    Justificar Falta
                                                </button>
                                            )}
                                            {appointment.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => router.push('/agendar')}
                                                    className="text-xs sm:text-sm text-gold hover:text-yellow-400 font-semibold transition-colors"
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
                        <div className="bg-[#141414] border border-white/8 rounded-2xl p-10 sm:p-12 text-center">
                            <p className="text-5xl sm:text-6xl mb-4">📭</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Nenhum agendamento</h3>
                            <p className="text-white/40 mb-6 text-sm sm:text-base">
                                {filterStatus === 'all'
                                    ? 'Você ainda não tem agendamentos'
                                    : `Você não tem agendamentos com status "${getStatusInfo(filterStatus).label}"`
                                }
                            </p>
                            <button
                                onClick={() => router.push('/agendar')}
                                className="bg-gradient-gold text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all"
                            >
                                Fazer Primeiro Agendamento
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {rescheduleAppointment && (
                <RescheduleModal
                    appointment={rescheduleAppointment}
                    onClose={() => setRescheduleAppointment(null)}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
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