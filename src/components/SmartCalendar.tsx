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

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startingDayOfWeek = firstDay.getDay()
        const totalDays = lastDay.getDate()
        const days: (Date | null)[] = []
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
        for (let day = 1; day <= totalDays; day++) days.push(new Date(year, month, day))
        return days
    }

    const isDateSelectable = (date: Date | null): boolean => {
        if (!date) return false
        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)
        if (status?.status === 'blocked' || status?.status === 'holiday') return false
        if (status?.availableSlots === 0) return false
        if (dateStr < minDate || dateStr > maxDate) return false
        return true
    }

    const getDayColor = (date: Date | null): string => {
        if (!date) return 'bg-transparent'
        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)
        const isSelected = dateStr === selectedDate

        if (isSelected) {
            return 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white font-bold ring-2 ring-gold/60 ring-offset-1 ring-offset-[#1e1e1e]'
        }
        if (dateStr < minDate || dateStr > maxDate) {
            return 'bg-white/3 text-white/15 cursor-not-allowed'
        }
        switch (status?.status) {
            case 'blocked':
            case 'holiday':
                return 'bg-red-950/60 text-red-400/60 border border-red-800/30 cursor-not-allowed'
            case 'partial':
                return 'bg-yellow-950/60 text-yellow-400 border border-yellow-800/30 hover:bg-yellow-900/50 cursor-pointer'
            case 'available':
                if (status.availableSlots && status.availableSlots > 0) {
                    return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-900/50 cursor-pointer'
                }
                return 'bg-red-950/60 text-red-400/60 border border-red-800/30 cursor-not-allowed'
            default:
                return 'bg-red-950/40 text-red-400/40 border border-red-900/20 cursor-not-allowed'
        }
    }

    const getStatusIcon = (date: Date | null) => {
        if (!date) return null
        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)
        switch (status?.status) {
            case 'blocked':
            case 'holiday':
                return <AlertCircle className="w-2.5 h-2.5 text-red-500/70" />
            case 'partial':
                return <Info className="w-2.5 h-2.5 text-yellow-500/70" />
            case 'available':
                return <CheckCircle className="w-2.5 h-2.5 text-emerald-500/70" />
            default:
                return null
        }
    }

    const renderTooltip = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const status = daysStatus.get(dateStr)
        if (!status || hoveredDate !== dateStr) return null
        return (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#0a0a0a] border border-white/10 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50 shadow-xl shadow-black/50">
                <div className="font-semibold mb-1 text-white/80">
                    {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {status.status === 'holiday' && <div className="text-red-400">🎉 {status.reason}</div>}
                {status.status === 'blocked' && <div className="text-red-400">🚫 {status.reason || 'Dia bloqueado'}</div>}
                {status.status === 'partial' && (
                    <div className="text-yellow-400">⚠️ {status.availableSlots} de {status.totalSlots} horários disponíveis</div>
                )}
                {status.status === 'available' && (
                    <div className="text-emerald-400">✅ {status.availableSlots} horários disponíveis</div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0a0a0a]"></div>
            </div>
        )
    }

    const days = generateCalendarDays()
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
                    type="button"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" />
                    <h3 className="text-base font-bold text-white capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>

                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
                    type="button"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-white/25 py-2">
                            {day}
                        </div>
                    ))}
                    {days.map((date, index) => (
                        <div key={index} className="relative">
                            {date ? (
                                <button
                                    type="button"
                                    onClick={() => isDateSelectable(date) && onDateSelect(date.toISOString().split('T')[0])}
                                    onMouseEnter={() => setHoveredDate(date.toISOString().split('T')[0])}
                                    onMouseLeave={() => setHoveredDate(null)}
                                    disabled={!isDateSelectable(date)}
                                    className={`w-full aspect-square rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${getDayColor(date)}`}
                                >
                                    <span className="text-xs sm:text-sm">{date.getDate()}</span>
                                    {getStatusIcon(date)}
                                    {renderTooltip(date)}
                                </button>
                            ) : (
                                <div className="w-full aspect-square" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Legenda */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 border-t border-white/8">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-950/60 border border-emerald-800/30 flex-shrink-0"></div>
                    <span className="text-white/40">Disponível</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3.5 h-3.5 rounded bg-yellow-950/60 border border-yellow-800/30 flex-shrink-0"></div>
                    <span className="text-white/40">Parcial</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3.5 h-3.5 rounded bg-red-950/60 border border-red-800/30 flex-shrink-0"></div>
                    <span className="text-white/40">Bloqueado</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-yellow-500 to-yellow-700 flex-shrink-0"></div>
                    <span className="text-white/40">Selecionado</span>
                </div>
            </div>
        </div>
    )
}