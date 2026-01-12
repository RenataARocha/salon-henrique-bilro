// src/components/SmartCalendar.tsx
// Calendário visual com cores para disponibilidade

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Info, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface DayStatus {
    date: string
    status: 'available' | 'partial' | 'blocked' | 'holiday'
    reason?: string
    availableSlots?: number
    totalSlots?: number
}

interface SmartCalendarProps {
    onDateSelect: (date: string) => void
    selectedDate: string
    minDate: string
    maxDate: string
}

export default function SmartCalendar({
    onDateSelect,
    selectedDate,
    minDate,
    maxDate
}: SmartCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [daysStatus, setDaysStatus] = useState<Map<string, DayStatus>>(new Map())
    const [loading, setLoading] = useState(false)
    const [hoveredDate, setHoveredDate] = useState<string | null>(null)

    // Carregar status dos dias ao mudar o mês
    useEffect(() => {
        loadMonthStatus()
    }, [currentMonth])

    const loadMonthStatus = async () => {
        setLoading(true)
        try {
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth() + 1

            const response = await fetch(`/api/calendar/month-status?year=${year}&month=${month}`)
            const data = await response.json()

            if (data.success) {
                const statusMap = new Map<string, DayStatus>()
                data.days.forEach((day: DayStatus) => {
                    statusMap.set(day.date, day)
                })
                setDaysStatus(statusMap)
            }
        } catch (error) {
            console.error('Erro ao carregar status do mês:', error)
        } finally {
            setLoading(false)
        }
    }

    // Navegar entre meses
    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    // Gerar dias do calendário
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startingDayOfWeek = firstDay.getDay()
        const totalDays = lastDay.getDate()

        const days: (Date | null)[] = []

        // Adicionar dias vazios do início
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Adicionar dias do mês
        for (let day = 1; day <= totalDays; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    // Verificar se data é selecionável
    const isDateSelectable = (date: Date | null): boolean => {
        if (!date) return false

        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)

        // Não permite datas bloqueadas ou feriados
        if (status?.status === 'blocked' || status?.status === 'holiday') {
            return false
        }

        // Verifica limites
        if (dateStr < minDate || dateStr > maxDate) {
            return false
        }

        return true
    }

    // Obter cor da célula
    const getDayColor = (date: Date | null): string => {
        if (!date) return 'bg-transparent'

        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)
        const isSelected = dateStr === selectedDate

        if (isSelected) {
            return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold ring-4 ring-yellow-300'
        }

        // Fora do range permitido
        if (dateStr < minDate || dateStr > maxDate) {
            return 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }

        switch (status?.status) {
            case 'blocked':
            case 'holiday':
                return 'bg-red-100 text-red-600 cursor-not-allowed'
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'
            case 'available':
                return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
            default:
                return 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-200'
        }
    }

    // Obter ícone do status
    const getStatusIcon = (date: Date | null) => {
        if (!date) return null

        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)

        switch (status?.status) {
            case 'blocked':
            case 'holiday':
                return <AlertCircle className="w-3 h-3 text-red-500" />
            case 'partial':
                return <Info className="w-3 h-3 text-yellow-600" />
            case 'available':
                return <CheckCircle className="w-3 h-3 text-green-600" />
            default:
                return null
        }
    }

    // Tooltip com informações
    const renderTooltip = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)

        if (!status || hoveredDate !== dateStr) return null

        return (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50 shadow-xl">
                <div className="font-semibold mb-1">
                    {date.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })}
                </div>

                {status.status === 'holiday' && (
                    <div className="text-red-300">🎉 {status.reason}</div>
                )}

                {status.status === 'blocked' && (
                    <div className="text-red-300">🚫 {status.reason || 'Dia bloqueado'}</div>
                )}

                {status.status === 'partial' && (
                    <div className="text-yellow-300">
                        ⚠️ {status.availableSlots} de {status.totalSlots} horários disponíveis
                    </div>
                )}

                {status.status === 'available' && (
                    <div className="text-green-300">
                        ✅ {status.availableSlots} horários disponíveis
                    </div>
                )}

                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
        )
    }

    const days = generateCalendarDays()
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {/* Header com navegação */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    type="button"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                        {currentMonth.toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </h3>
                </div>

                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    type="button"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                </div>
            )}

            {/* Grade do calendário */}
            <div className="grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                        {day}
                    </div>
                ))}

                {/* Dias do mês */}
                {days.map((date, index) => (
                    <div key={index} className="relative">
                        {date ? (
                            <button
                                type="button"
                                onClick={() => isDateSelectable(date) && onDateSelect(date.toISOString().split('T')[0])}
                                onMouseEnter={() => setHoveredDate(date.toISOString().split('T')[0])}
                                onMouseLeave={() => setHoveredDate(null)}
                                disabled={!isDateSelectable(date)}
                                className={`
                                    w-full aspect-square rounded-lg transition-all duration-200
                                    flex flex-col items-center justify-center relative
                                    ${getDayColor(date)}
                                `}
                            >
                                <span className="text-sm">{date.getDate()}</span>
                                {getStatusIcon(date)}
                                {renderTooltip(date)}
                            </button>
                        ) : (
                            <div className="w-full aspect-square" />
                        )}
                    </div>
                ))}
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                    <span className="text-gray-600">Disponível</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-gray-600">Parcial</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                    <span className="text-gray-600">Bloqueado</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-400 to-yellow-600"></div>
                    <span className="text-gray-600">Selecionado</span>
                </div>
            </div>
        </div>
    )
}