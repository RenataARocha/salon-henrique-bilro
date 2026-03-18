// app/(dashboard)/admin/aniversariantes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Gift, Mail, MessageCircle, ChevronLeft, ChevronRight, Cake, TrendingUp, Clock } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import BirthdayOfferModal from '@/components/admin/BirthdayOfferModal'
import { motion } from 'framer-motion'

interface Birthday {
    id: string
    name: string
    email: string
    phone?: string
    birthDate: string
    birthDay: number
    birthMonth: number
    age: number
    daysUntil: number
    isPast: boolean
    isToday: boolean
    clientSince: string
    totalAppointments: number
    lastAppointment?: {
        date: string
        service: {
            name: string
        } | null
        combo: {
            name: string
        } | null
    }
}

interface Stats {
    total: number
    upcoming: number
    today: number
    thisWeek: number
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function AniversariantesPage() {
    const [birthdays, setBirthdays] = useState<Birthday[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, today: 0, thisWeek: 0 })
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null)
    const [showOfferModal, setShowOfferModal] = useState(false)

    useEffect(() => {
        fetchBirthdays()
    }, [currentMonth, currentYear])

    const fetchBirthdays = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/birthdays?month=${currentMonth}&year=${currentYear}`)
            const data = await res.json()

            if (data.success) {
                setBirthdays(data.data)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePreviousMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const handleSendOffer = (birthday: Birthday) => {
        setSelectedBirthday(birthday)
        setShowOfferModal(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    const getDaysText = (daysUntil: number) => {
        if (daysUntil === 0) return 'É HOJE! 🎉'
        if (daysUntil === 1) return 'Amanhã'
        if (daysUntil < 0) return 'Já passou'
        if (daysUntil <= 7) return `Em ${daysUntil} dias`
        return `Dia ${Math.abs(daysUntil)}`
    }

    const getBadgeColor = (daysUntil: number) => {
        if (daysUntil === 0) return 'bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse'
        if (daysUntil > 0 && daysUntil <= 3) return 'bg-orange-100 text-orange-700'
        if (daysUntil > 3 && daysUntil <= 7) return 'bg-yellow-100 text-yellow-700'
        return 'bg-gray-100 text-gray-600'
    }

    // ✅ FUNÇÃO PARA PEGAR NOME DO SERVIÇO/COMBO
    const getServiceName = (lastAppointment: Birthday['lastAppointment']) => {
        if (!lastAppointment) return '-'
        if (lastAppointment.service?.name) return lastAppointment.service.name
        if (lastAppointment.combo?.name) return lastAppointment.combo.name
        return 'Serviço não identificado'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-6 sm:py-8 px-3 sm:px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-16 sm:py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold mx-auto mb-3 sm:mb-4"></div>
                            <p className="text-sm sm:text-base text-gray-600">
                                Carregando aniversariantes...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <AdminHeader
                    title="Aniversariantes do Mês"
                    description="Envie ofertas especiais para clientes aniversariantes"
                />

                {/* Seletor de Mês */}
                <motion.div
                    className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between gap-2">

                        <button
                            onClick={handlePreviousMonth}
                            className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="sm:w-[24px] sm:h-[24px]" />
                        </button>

                        <div className="text-center flex-1">
                            <h2 className="text-lg sm:text-3xl font-bold text-charcoal flex items-center gap-2 sm:gap-3 justify-center flex-wrap">
                                <Cake className="text-gold" size={22} />
                                <span>
                                    {MONTHS[currentMonth - 1]} {currentYear}
                                </span>
                            </h2>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="sm:w-[24px] sm:h-[24px]" />
                        </button>
                    </div>
                </motion.div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                    {[
                        { icon: Calendar, label: 'Total no Mês', value: stats.total, color: 'blue' },
                        { icon: Gift, label: 'Hoje', value: stats.today, color: 'pink' },
                        { icon: Clock, label: 'Próximos 7 Dias', value: stats.thisWeek, color: 'orange' },
                        { icon: TrendingUp, label: 'A Enviar', value: stats.upcoming, color: 'green' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                <stat.icon
                                    className={`text-${stat.color}-500`}
                                    size={18}
                                />
                                <p className="text-xs sm:text-sm text-gray-600">
                                    {stat.label}
                                </p>
                            </div>

                            <p
                                className={`text-xl sm:text-3xl font-bold text-${stat.color === 'pink'
                                    ? 'pink'
                                    : stat.color === 'orange'
                                        ? 'orange'
                                        : stat.color === 'green'
                                            ? 'green'
                                            : 'charcoal'
                                    }-600`}
                            >
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Lista de Aniversariantes */}
                {birthdays.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
                        <Cake size={48} className="sm:w-[64px] sm:h-[64px] mx-auto text-gray-300 mb-3 sm:mb-4" />

                        <h3 className="text-lg sm:text-2xl font-bold text-charcoal mb-1 sm:mb-2">
                            Nenhum aniversariante este mês
                        </h3>

                        <p className="text-sm sm:text-base text-gray-600">
                            Não há clientes com aniversário em {MONTHS[currentMonth - 1]}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:gap-4">
                        {birthdays.map((birthday, index) => (
                            <motion.div
                                key={birthday.id}
                                className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all ${birthday.isToday ? 'ring-2 sm:ring-4 ring-pink-500 ring-opacity-50' : ''
                                    }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                                    {/* Infos */}
                                    <div className="flex-1">
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3">

                                            <div className="text-2xl sm:text-4xl">🎂</div>

                                            <div>
                                                <h3 className="text-base sm:text-xl font-bold text-charcoal flex flex-wrap items-center gap-2">
                                                    {birthday.name}

                                                    {birthday.isToday && (
                                                        <span className="text-[10px] sm:text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 sm:px-3 py-1 rounded-full animate-pulse">
                                                            HOJE! 🎉
                                                        </span>
                                                    )}
                                                </h3>

                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    {birthday.birthDay}/{birthday.birthMonth} - {birthday.age} anos
                                                </p>
                                            </div>
                                        </div>

                                        {/* Infos extras */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">

                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                                                    Cliente desde
                                                </p>
                                                <p className="font-semibold text-sm sm:text-base">
                                                    {new Date(birthday.clientSince).getFullYear()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                                                    Total de atendimentos
                                                </p>
                                                <p className="font-semibold text-sm sm:text-base">
                                                    {birthday.totalAppointments}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                                                    Último agendamento
                                                </p>
                                                <p className="font-semibold text-sm sm:text-base">
                                                    {birthday.lastAppointment
                                                        ? new Date(birthday.lastAppointment.date).toLocaleDateString('pt-BR')
                                                        : 'Nunca'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Último serviço */}
                                        {birthday.lastAppointment && (
                                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                                                Último serviço:{' '}
                                                <span className="font-semibold">
                                                    {getServiceName(birthday.lastAppointment)}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Ações */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 sm:gap-3">

                                        <span
                                            className={`text-center sm:text-left inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${getBadgeColor(birthday.daysUntil)}`}
                                        >
                                            {getDaysText(birthday.daysUntil)}
                                        </span>

                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleSendOffer(birthday)}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                                            >
                                                <Gift size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                Criar Oferta
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Oferta */}
            {showOfferModal && selectedBirthday && (
                <BirthdayOfferModal
                    birthday={selectedBirthday}
                    onClose={() => {
                        setShowOfferModal(false)
                        setSelectedBirthday(null)
                    }}
                    onSuccess={() => {
                        setShowOfferModal(false)
                        setSelectedBirthday(null)
                        fetchBirthdays()
                    }}
                />
            )}
        </div>
    )
}