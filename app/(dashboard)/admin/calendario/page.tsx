// app/(dashboard)/admin/calendario/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, List, Grid, AlertCircle, X } from 'lucide-react'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    user: {
        name: string
        phone: string
    }
    service: {
        name: string
        price: number
        duration: number
    }
}

type ViewMode = 'day' | 'week' | 'month'

export default function CalendarViewPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

    useEffect(() => {
        fetchAppointments()
    }, [currentDate, viewMode])

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

    // Funções de navegação
    const goToPrevious = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() - 1)
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7)
        } else {
            newDate.setMonth(newDate.getMonth() - 1)
        }
        setCurrentDate(newDate)
    }

    const goToNext = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + 1)
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // Obter dias da semana
    const getWeekDays = () => {
        const start = new Date(currentDate)
        start.setDate(start.getDate() - start.getDay())

        const days = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(start)
            day.setDate(start.getDate() + i)
            days.push(day)
        }
        return days
    }

    // Obter dias do mês
    const getMonthDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const days = []
        const startDay = firstDay.getDay()

        // Dias do mês anterior
        for (let i = startDay - 1; i >= 0; i--) {
            const day = new Date(firstDay)
            day.setDate(day.getDate() - (i + 1))
            days.push({ date: day, isCurrentMonth: false })
        }

        // Dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true })
        }

        // Dias do próximo mês
        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) {
            const day = new Date(lastDay)
            day.setDate(lastDay.getDate() + i)
            days.push({ date: day, isCurrentMonth: false })
        }

        return days
    }

    // Filtrar agendamentos por data
    const getAppointmentsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        return appointments.filter(apt => apt.date === dateStr)
    }

    // Obter taxa de ocupação
    const getOccupancyRate = (date: Date) => {
        const apts = getAppointmentsForDate(date)
        const maxSlots = 10 // Assumindo 10 horários por dia
        return Math.round((apts.length / maxSlots) * 100)
    }

    // Cores de status
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            CONFIRMED: 'bg-green-500',
            PENDING: 'bg-orange-500',
            CANCELLED: 'bg-red-500',
            COMPLETED: 'bg-blue-500',
            NO_SHOW: 'bg-gray-500'
        }
        return colors[status] || 'bg-gray-500'
    }

    // Drag & Drop handlers
    const handleDragStart = (apt: Appointment) => {
        setDraggedAppointment(apt)
    }

    const handleDrop = async (newDate: Date, newTime: string) => {
        if (!draggedAppointment) return

        const confirmMove = confirm(
            `Reagendar ${draggedAppointment.user.name} de ${new Date(draggedAppointment.date).toLocaleDateString('pt-BR')} ${draggedAppointment.time} para ${newDate.toLocaleDateString('pt-BR')} ${newTime}?`
        )

        if (confirmMove) {
            try {
                await fetch(`/api/admin/appointments/${draggedAppointment.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: newDate.toISOString().split('T')[0],
                        time: newTime
                    })
                })
                await fetchAppointments()
                alert('Agendamento reagendado com sucesso!')
            } catch (error) {
                alert('Erro ao reagendar')
            }
        }

        setDraggedAppointment(null)
    }

    // Renderizar visualização diária
    const renderDayView = () => {
        const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h às 20h
        const dateAppointments = getAppointmentsForDate(currentDate)

        return (
            <div className="bg-white rounded-xl shadow">
                <div className="grid grid-cols-[80px_1fr] divide-x">
                    <div className="p-4 bg-gray-50">
                        <p className="font-semibold text-center text-charcoal">Horário</p>
                    </div>
                    <div className="p-4 bg-gray-50">
                        <p className="font-semibold text-center text-charcoal">
                            {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {hours.map(hour => {
                    const timeSlots = ['00', '30']
                    return timeSlots.map(minutes => {
                        const time = `${hour.toString().padStart(2, '0')}:${minutes}`
                        const slotAppointments = dateAppointments.filter(apt => apt.time === time)

                        return (
                            <div
                                key={time}
                                className="grid grid-cols-[80px_1fr] divide-x border-t hover:bg-gray-50 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(currentDate, time)}
                            >
                                <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                                    {time}
                                </div>
                                <div className="p-2 min-h-[60px]">
                                    {slotAppointments.map(apt => (
                                        <div
                                            key={apt.id}
                                            draggable
                                            onDragStart={() => handleDragStart(apt)}
                                            onClick={() => setSelectedAppointment(apt)}
                                            className={`${getStatusColor(apt.status)} text-white p-2 rounded mb-1 cursor-move hover:opacity-90 transition-opacity`}
                                        >
                                            <p className="font-semibold text-sm">{apt.user.name}</p>
                                            <p className="text-xs opacity-90">{apt.service.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                })}
            </div>
        )
    }

    // Renderizar visualização semanal
    const renderWeekView = () => {
        const weekDays = getWeekDays()
        const hours = Array.from({ length: 13 }, (_, i) => i + 8)

        return (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
                <div className="grid grid-cols-8 divide-x min-w-[800px]">
                    <div className="p-4 bg-gray-50 sticky left-0">
                        <p className="font-semibold text-charcoal">Horário</p>
                    </div>
                    {weekDays.map((day, index) => {
                        const isToday = day.toDateString() === new Date().toDateString()
                        return (
                            <div key={index} className={`p-4 text-center ${isToday ? 'bg-gold text-white' : 'bg-gray-50'}`}>
                                <p className="font-semibold">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                <p className="text-2xl font-bold">{day.getDate()}</p>
                            </div>
                        )
                    })}
                </div>

                {hours.map(hour => {
                    const time = `${hour.toString().padStart(2, '0')}:00`
                    return (
                        <div key={hour} className="grid grid-cols-8 divide-x border-t min-w-[800px]">
                            <div className="p-2 bg-gray-50 text-center text-sm text-gray-600 sticky left-0">
                                {time}
                            </div>
                            {weekDays.map((day, index) => {
                                const dayApts = getAppointmentsForDate(day).filter(apt => apt.time.startsWith(time.split(':')[0]))
                                return (
                                    <div
                                        key={index}
                                        className="p-1 min-h-[60px] hover:bg-gray-50 transition-colors"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(day, time)}
                                    >
                                        {dayApts.map(apt => (
                                            <div
                                                key={apt.id}
                                                draggable
                                                onDragStart={() => handleDragStart(apt)}
                                                onClick={() => setSelectedAppointment(apt)}
                                                className={`${getStatusColor(apt.status)} text-white p-1 rounded mb-1 cursor-move hover:opacity-90 transition-opacity text-xs`}
                                            >
                                                <p className="font-semibold truncate">{apt.user.name}</p>
                                                <p className="opacity-90 truncate">{apt.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        )
    }

    // Renderizar visualização mensal
    const renderMonthView = () => {
        const monthDays = getMonthDays()
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

        return (
            <div className="bg-white rounded-xl shadow">
                <div className="grid grid-cols-7 divide-x border-b">
                    {weekDays.map(day => (
                        <div key={day} className="p-4 text-center font-semibold text-charcoal bg-gray-50">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-y">
                    {monthDays.map(({ date, isCurrentMonth }, index) => {
                        const dayApts = getAppointmentsForDate(date)
                        const occupancy = getOccupancyRate(date)
                        const isToday = date.toDateString() === new Date().toDateString()

                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] p-2 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''} ${isToday ? 'bg-gold/10 ring-2 ring-gold' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                                onClick={() => {
                                    setCurrentDate(date)
                                    setViewMode('day')
                                }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-semibold ${isToday ? 'text-gold' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {dayApts.length > 0 && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${occupancy > 80 ? 'bg-red-100 text-red-700' :
                                            occupancy > 50 ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {dayApts.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {dayApts.slice(0, 3).map(apt => (
                                        <div
                                            key={apt.id}
                                            className={`${getStatusColor(apt.status)} text-white text-xs p-1 rounded truncate`}
                                        >
                                            {apt.time} - {apt.user.name}
                                        </div>
                                    ))}
                                    {dayApts.length > 3 && (
                                        <p className="text-xs text-gray-500">+{dayApts.length - 3} mais</p>
                                    )}
                                </div>

                                {occupancy > 0 && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${occupancy > 80 ? 'bg-red-500' :
                                                    occupancy > 50 ? 'bg-orange-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${occupancy}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando calendário...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">📅 Calendário</h1>
                        <p className="text-gray-600">Visualização completa dos agendamentos</p>
                    </div>

                    {/* Controles de visualização */}
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-lg shadow p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-2 rounded font-semibold transition-colors ${viewMode === 'day' ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <List size={20} className="inline mr-2" />
                                Dia
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-4 py-2 rounded font-semibold transition-colors ${viewMode === 'week' ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Grid size={20} className="inline mr-2" />
                                Semana
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-2 rounded font-semibold transition-colors ${viewMode === 'month' ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Calendar size={20} className="inline mr-2" />
                                Mês
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navegação */}
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goToPrevious}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-charcoal">
                                {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                {viewMode === 'week' && `Semana de ${getWeekDays()[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${getWeekDays()[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                {viewMode === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                onClick={goToToday}
                                className="mt-2 text-sm text-gold hover:text-yellow-600 font-semibold"
                            >
                                Ir para hoje
                            </button>
                        </div>

                        <button
                            onClick={goToNext}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Legenda */}
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm">Confirmado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <span className="text-sm">Pendente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm">Concluído</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm">Cancelado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-500 rounded"></div>
                            <span className="text-sm">Não Compareceu</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle size={16} />
                            <span>Arraste para reagendar</span>
                        </div>
                    </div>
                </div>

                {/* Visualização */}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}

                {/* Modal de detalhes */}
                {selectedAppointment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-charcoal">Detalhes do Agendamento</h3>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Cliente</p>
                                    <p className="font-semibold text-charcoal">{selectedAppointment.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Serviço</p>
                                    <p className="font-semibold text-charcoal">{selectedAppointment.service.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Data</p>
                                        <p className="font-semibold text-charcoal">
                                            {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Horário</p>
                                        <p className="font-semibold text-charcoal">{selectedAppointment.time}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Valor</p>
                                    <p className="font-semibold text-gold text-xl">R$ {selectedAppointment.service.price.toFixed(2)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="mt-6 w-full px-4 py-3 bg-gold text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .ring-gold { --tw-ring-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
                .bg-beige { background-color: #F5F5DC; }
            `}</style>
        </div>
    )
}