// app/(dashboard)/admin/agenda/page.tsx - SISTEMA HÍBRIDO COMPLETO

'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Power, Calendar, ChevronLeft, ChevronRight, Eye, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'
import AdminHeader from '@/components/admin/AdminHeader'
import { motion } from 'framer-motion'
import ViewDayModal from '@/components/admin/ViewDayModal'


const CLOSED_DAYS = [0, 1] // Domingo e Segunda

interface AvailableSlot {
    id: string
    dayOfWeek: number
    timeSlot: string
    active: boolean
    type: 'recorrente' | 'especifico'
    date?: string // yyyy-mm-dd
}

export default function AgendaAdminPage() {
    const { showToast } = useToast()
    const [slots, setSlots] = useState<AvailableSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [newTimeSlot, setNewTimeSlot] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showInfoModal, setShowInfoModal] = useState(false)
    const [viewingDay, setViewingDay] = useState<number>(0)
    const [viewingDate, setViewingDate] = useState<Date | null>(null)
    const isClosedDay = CLOSED_DAYS.includes(selectedDay)
    const [currentDate, setCurrentDate] = useState(new Date())

    const daysOfWeek = [
        { value: 0, label: 'Domingo', short: 'Dom', emoji: '🌤️', color: 'from-purple-500 to-purple-600' },
        { value: 1, label: 'Segunda-feira', short: 'Seg', emoji: '💼', color: 'from-blue-500 to-blue-600' },
        { value: 2, label: 'Terça-feira', short: 'Ter', emoji: '🎯', color: 'from-green-500 to-green-600' },
        { value: 3, label: 'Quarta-feira', short: 'Qua', emoji: '⚡', color: 'from-yellow-500 to-yellow-600' },
        { value: 4, label: 'Quinta-feira', short: 'Qui', emoji: '🚀', color: 'from-orange-500 to-orange-600' },
        { value: 5, label: 'Sexta-feira', short: 'Sex', emoji: '🎉', color: 'from-red-500 to-red-600' },
        { value: 6, label: 'Sábado', short: 'Sáb', emoji: '🌟', color: 'from-pink-500 to-pink-600' }
    ]

    const getMonthYear = () => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`
    }

    const changeMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentDate(newDate)
    }

    const goToCurrentMonth = () => {
        setCurrentDate(new Date())
    }

    const isCurrentMonth = () => {
        const now = new Date()
        return currentDate.getMonth() === now.getMonth() &&
            currentDate.getFullYear() === now.getFullYear()
    }

    const getSpecificDates = (dayOfWeek: number) => {
        const dates = []
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === dayOfWeek) {
                dates.push(new Date(d))
            }
        }
        return dates
    }

    const formatDate = (date: Date) => {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    const formatFullDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        })
    }

    useEffect(() => {
        fetchSlots()
    }, [])

    const fetchSlots = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/slots')
            const data = await res.json()

            if (data.success) {
                setSlots(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error)
            showToast('Erro ao carregar horários', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddSlot = async () => {
        if (!newTimeSlot) {
            showToast('Digite um horário válido', 'error')
            return
        }

        try {
            const res = await fetch('/api/admin/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dayOfWeek: selectedDay,
                    timeSlot: newTimeSlot
                })
            })

            const data = await res.json()

            if (data.success) {
                showToast('✅ Horário recorrente criado!', 'success')
                fetchSlots()
                setNewTimeSlot('')
                setShowAddModal(false)
            } else {
                showToast(data.error || 'Erro ao adicionar horário', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao adicionar horário', 'error')
        }
    }

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('❗ Isso removerá o horário de TODAS as semanas.\n\nSe quiser bloquear apenas uma data específica, use o botão de ativar/desativar.\n\nConfirma a exclusão permanente?')) return

        try {
            const res = await fetch(`/api/admin/slots?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                showToast('Horário excluído de todas as semanas', 'success')
                fetchSlots()
            } else {
                showToast(data.error || 'Erro ao excluir horário', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao excluir horário', 'error')
        }
    }

    const handleToggleSlot = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/slots', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    active: !currentStatus
                })
            })

            const data = await res.json()

            if (data.success) {
                showToast(
                    currentStatus
                        ? '⏸️ Horário desativado (bloqueado)'
                        : '▶️ Horário ativado (disponível)',
                    'success'
                )
                fetchSlots()
            } else {
                showToast(data.error || 'Erro ao atualizar horário', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao atualizar horário', 'error')
        }
    }

    const getSlotsByDay = (day: number) => {
        return slots
            .filter(slot => slot.dayOfWeek === day)
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
    }

    const openViewModal = (dayOfWeek: number, date: Date) => {
        setViewingDay(dayOfWeek)
        setViewingDate(date)
        setShowViewModal(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-6 sm:py-8 px-3 sm:px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-16 sm:py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold mx-auto mb-3 sm:mb-4"></div>
                            <p className="text-sm sm:text-base text-gray-600">
                                Carregando...
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
                    title="Gerenciar Agenda"
                    description="Sistema híbrido: horários recorrentes + controle por data"
                />

                {/* Navegador de Mês */}
                <motion.div
                    className="bg-gradient-to-r from-gold to-yellow-600 rounded-xl shadow-lg p-4 sm:p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between gap-2">

                        <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                        >
                            <ChevronLeft
                                className="text-white"
                                size={20}
                            />
                        </button>

                        <div className="text-center flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 justify-center mb-1 flex-wrap">
                                <Calendar className="text-white" size={20} />
                                <h2 className="text-lg sm:text-3xl font-bold text-white">
                                    {getMonthYear()}
                                </h2>
                            </div>

                            {!isCurrentMonth() && (
                                <button
                                    onClick={goToCurrentMonth}
                                    className="text-xs sm:text-sm text-white/90 hover:text-white underline"
                                >
                                    Voltar para o mês atual
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => changeMonth('next')}
                            className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                        >
                            <ChevronRight
                                className="text-white"
                                size={20}
                            />
                        </button>
                    </div>
                </motion.div>

                {/* Info Box - Como Funciona */}
                <motion.div
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">

                        <div className="bg-blue-500 text-white p-2 sm:p-3 rounded-full mx-auto sm:mx-0">
                            <Info size={20} />
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 text-center sm:text-left">
                                💡 Como funciona o Sistema Híbrido
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-blue-800">
                                <div className="bg-white/50 rounded-lg p-3">
                                    <p className="font-bold mb-1 text-sm sm:text-base">🔄 Horários Recorrentes</p>
                                    <p className="text-xs sm:text-sm">
                                        Quando você cria um horário, ele se repete automaticamente toda semana naquele dia.
                                    </p>
                                </div>

                                <div className="bg-white/50 rounded-lg p-3">
                                    <p className="font-bold mb-1 text-sm sm:text-base">📅 Controle por Data</p>
                                    <p className="text-xs sm:text-sm">
                                        Clique em uma data específica para ver/gerenciar os horários daquele dia.
                                    </p>
                                </div>

                                <div className="bg-white/50 rounded-lg p-3">
                                    <p className="font-bold mb-1 text-sm sm:text-base">⏸️ Bloquear Dias Específicos</p>
                                    <p className="text-xs sm:text-sm">
                                        Use o botão de ligar/desligar para bloquear feriados ou dias de folga.
                                    </p>
                                </div>

                                <div className="bg-white/50 rounded-lg p-3">
                                    <p className="font-bold mb-1 text-sm sm:text-base">🗑️ Excluir vs Desativar</p>
                                    <p className="text-xs sm:text-sm">
                                        Excluir remove de todas as semanas. Desativar bloqueia apenas aquele período.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="mt-4 w-full sm:w-auto text-center sm:text-left text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                                Ver tutorial completo →
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex justify-center sm:justify-end">
                    <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                        <Plus size={18} />
                        Novo Horário Recorrente
                    </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {[
                        { icon: Calendar, label: 'Dias Configurados', value: `${daysOfWeek.filter(d => getSlotsByDay(d.value).length > 0).length}/7` },
                        { icon: Clock, label: 'Horários Ativos', value: slots.filter(s => s.active).length },
                        { icon: Clock, label: 'Total de Horários', value: slots.length }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <stat.icon className="text-blue-500" size={20} />
                                <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-charcoal">
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Grid de dias COM DATAS CLICÁVEIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {daysOfWeek.map((day, dayIndex) => {
                        const isClosed = CLOSED_DAYS.includes(day.value)
                        const daySlots = getSlotsByDay(day.value)
                        const activeSlots = daySlots.filter(s => s.active).length
                        const specificDates = getSpecificDates(day.value)

                        return (
                            <motion.div
                                key={day.value}
                                className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
                            >
                                {/* Header */}
                                <div
                                    className={`text-white p-4 sm:p-5 ${isClosed
                                        ? 'bg-gray-400'
                                        : `bg-gradient-to-br ${day.color}`
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl sm:text-2xl">{day.emoji}</span>
                                            <h3 className="text-base sm:text-lg font-bold">{day.short}</h3>
                                        </div>

                                        <span className="bg-white/30 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                                            {activeSlots}/{daySlots.length}
                                        </span>
                                    </div>

                                    <p className="text-[10px] sm:text-xs text-white/90 mb-2">
                                        {isClosed
                                            ? '🚫 Folga fixa'
                                            : daySlots.length === 0
                                                ? 'Nenhum horário configurado'
                                                : `${activeSlots} horários ativos`
                                        }
                                    </p>

                                    {/* DATAS ESPECÍFICAS CLICÁVEIS */}
                                    {specificDates.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] sm:text-xs text-white/70 font-semibold">
                                                Datas neste mês:
                                            </p>

                                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                                {!isClosed &&
                                                    specificDates.map((date, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => openViewModal(day.value, date)}
                                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            {formatDate(date)}
                                                            <Eye size={10} />
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lista Resumida */}
                                <div className="p-3 sm:p-4">
                                    {daySlots.length > 0 ? (
                                        <div className="space-y-2">
                                            {daySlots.slice(0, 3).map(slot => (
                                                <div
                                                    key={slot.id}
                                                    className={`p-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between ${slot.active
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-gray-50 text-gray-500'
                                                        }`}
                                                >
                                                    <span>{slot.timeSlot}</span>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleToggleSlot(slot.id, slot.active)}
                                                            className="p-1 hover:bg-white rounded transition-all"
                                                            title={slot.active ? 'Desativar' : 'Ativar'}
                                                        >
                                                            <Power size={12} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="p-1 hover:bg-white rounded transition-all text-red-600"
                                                            title="Excluir permanentemente"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                        </div>
                                    ) : (
                                        <div className="text-center py-6 sm:py-8">
                                            <Clock size={24} className="mx-auto text-gray-300 mb-2" />

                                            <p className="text-gray-400 text-[10px] sm:text-xs mb-3">
                                                Nenhum horário
                                            </p>

                                            {!isClosed && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(day.value)
                                                        setShowAddModal(true)
                                                    }}
                                                    className="text-xs text-gold hover:text-gold-dark font-semibold"
                                                >
                                                    + Adicionar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* MODAL: Tutorial Completo */}
                {showInfoModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <div
                            className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-lg sm:text-2xl font-bold text-charcoal mb-4 sm:mb-6 flex items-center gap-2">
                                <Info className="text-gold" size={20} />
                                Tutorial: Sistema Híbrido de Agenda
                            </h2>

                            <div className="space-y-4 sm:space-y-6">

                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">
                                        1️⃣ Criar Horários Recorrentes
                                    </h3>
                                    <p className="text-xs sm:text-sm text-blue-800 mb-2">
                                        Clique em &quot;+ Novo Horário Recorrente&quot e escolha:
                                    </p>
                                    <ul className="text-xs sm:text-sm text-blue-700 space-y-1 ml-4">
                                        <li>• Dia da semana (ex: Segunda-feira)</li>
                                        <li>• Horário (ex: 14:00)</li>
                                        <li>• Este horário se repetirá toda semana automaticamente</li>
                                    </ul>
                                </div>

                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-green-900 mb-2 text-sm sm:text-base">
                                        2️⃣ Ver Horários de uma Data Específica
                                    </h3>
                                    <p className="text-xs sm:text-sm text-green-800 mb-2">
                                        Nos cards dos dias, clique nas datas (ex: 08/01, 15/01):
                                    </p>
                                    <ul className="text-xs sm:text-sm text-green-700 space-y-1 ml-4">
                                        <li>• Abre modal mostrando horários daquele dia</li>
                                        <li>• Pode ativar/desativar individualmente</li>
                                        <li>• Pode excluir permanentemente</li>
                                    </ul>
                                </div>

                                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-orange-900 mb-2 text-sm sm:text-base">
                                        3️⃣ Bloquear Dias Específicos (Feriados, Folga)
                                    </h3>
                                    <p className="text-xs sm:text-sm text-orange-800 mb-2">
                                        Use o botão de Power (⚡) para:
                                    </p>
                                    <ul className="text-xs sm:text-sm text-orange-700 space-y-1 ml-4">
                                        <li>• <strong>Desativar:</strong> Bloqueia aquele horário (clientes não veem)</li>
                                        <li>• <strong>Ativar:</strong> Disponibiliza novamente</li>
                                        <li>• Não precisa excluir e recriar toda semana!</li>
                                    </ul>
                                </div>

                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-red-900 mb-2 text-sm sm:text-base">
                                        4️⃣ Excluir vs Desativar - IMPORTANTE!
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                                        <div className="bg-white rounded p-2">
                                            <p className="font-bold text-red-800 mb-1">
                                                🗑️ Excluir (Trash)
                                            </p>
                                            <p className="text-xs text-red-700">
                                                Remove de TODAS as semanas permanentemente
                                            </p>
                                        </div>

                                        <div className="bg-white rounded p-2">
                                            <p className="font-bold text-orange-800 mb-1">
                                                ⏸️ Desativar (Power)
                                            </p>
                                            <p className="text-xs text-orange-700">
                                                Bloqueia temporariamente, pode reativar depois
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-purple-900 mb-2 text-sm sm:text-base">
                                        💡 Exemplo Prático
                                    </h3>
                                    <p className="text-xs sm:text-sm text-purple-800 mb-2">
                                        <strong>Situação:</strong> Você trabalha segundas às 14:00, mas na próxima segunda é feriado.
                                    </p>
                                    <p className="text-xs sm:text-sm text-purple-700">
                                        <strong>Solução:</strong> Clique na data do feriado → Desative o horário 14:00 apenas naquele dia →
                                        Na outra segunda, estará ativo automaticamente!
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={() => setShowInfoModal(false)}
                                className="w-full mt-4 sm:mt-6 flex items-center justify-center px-4 py-2 text-sm"
                            >
                                Entendi!
                            </Button>
                        </div>
                    </div>
                )}

                {/* MODAL: Visualizar Horários de Data Específica */}
                {showViewModal && viewingDate && (
                    <ViewDayModal
                        viewingDate={viewingDate}
                        viewingDay={viewingDay}
                        daysOfWeek={daysOfWeek}
                        slots={getSlotsByDay(viewingDay)}
                        formatFullDate={formatFullDate}
                        onClose={() => setShowViewModal(false)}
                        onSlotDeleted={fetchSlots}
                        showToast={showToast}
                    />
                )}

                {/* MODAL: Adicionar Horário Recorrente */}
                {showAddModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header */}
                            <h2 className="text-2xl font-bold text-charcoal mb-2 flex items-center gap-2">
                                <Plus className="text-gold" />
                                Adicionar Horário Recorrente
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Este horário se repetirá automaticamente toda semana
                            </p>

                            <div className="space-y-4">
                                {/* Dia da Semana */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Dia da Semana
                                    </label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(Number(e.target.value))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                    >
                                        {daysOfWeek.map(day => (
                                            <option key={day.value} value={day.value}>
                                                {day.emoji} {day.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Mostrar próximas datas */}
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                                        <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
                                            <Calendar size={14} />
                                            Este horário será criado para:
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {getSpecificDates(selectedDay).map((date, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-bold"
                                                >
                                                    {date.toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-blue-700 font-semibold">
                                            🔄 E se repetirá toda semana neste dia
                                        </p>
                                    </div>
                                </div>

                                {/* Horário */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Horário
                                    </label>
                                    <input
                                        type="time"
                                        value={newTimeSlot}
                                        onChange={(e) => setNewTimeSlot(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none text-lg font-semibold"
                                    />
                                </div>

                                {/* Aviso se dia for folga fixa */}
                                {isClosedDay && (
                                    <div className="mt-3 bg-red-50 border-2 border-red-200 rounded-lg p-3 text-xs text-red-800">
                                        🚫 <strong>Este dia é folga fixa.</strong><br />
                                        Para abrir o salão, use horários <strong>específicos por data</strong>
                                        (ex: feriados, datas festivas).
                                    </div>
                                )}

                                {/* Dica */}
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                                    <p className="text-xs text-yellow-800">
                                        <strong>💡 Dica:</strong> Depois de criar, você pode desativar este horário em datas específicas
                                        (feriados, folgas) sem precisar excluir e recriar toda semana.
                                    </p>
                                </div>

                                {/* Botões */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowAddModal(false)
                                            setNewTimeSlot('')
                                        }}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleAddSlot}
                                        disabled={isClosedDay}
                                        className="flex-1"
                                    >
                                        Criar Horário
                                    </Button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </div>
        </div >
    )
}