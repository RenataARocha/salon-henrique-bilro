// app/(dashboard)/admin/agenda/page.tsx - VERSÃO MELHORADA

'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, AlertCircle, Power, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'
import AdminHeader from '@/components/admin/AdminHeader'

interface AvailableSlot {
    id: string
    dayOfWeek: number
    timeSlot: string
    active: boolean
}

export default function AgendaAdminPage() {
    const { showToast } = useToast()
    const [slots, setSlots] = useState<AvailableSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [newTimeSlot, setNewTimeSlot] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)

    const daysOfWeek = [
        { value: 0, label: 'Domingo', short: 'Dom', emoji: '🌤️', color: 'from-purple-500 to-purple-600' },
        { value: 1, label: 'Segunda-feira', short: 'Seg', emoji: '💼', color: 'from-blue-500 to-blue-600' },
        { value: 2, label: 'Terça-feira', short: 'Ter', emoji: '🎯', color: 'from-green-500 to-green-600' },
        { value: 3, label: 'Quarta-feira', short: 'Qua', emoji: '⚡', color: 'from-yellow-500 to-yellow-600' },
        { value: 4, label: 'Quinta-feira', short: 'Qui', emoji: '🚀', color: 'from-orange-500 to-orange-600' },
        { value: 5, label: 'Sexta-feira', short: 'Sex', emoji: '🎉', color: 'from-red-500 to-red-600' },
        { value: 6, label: 'Sábado', short: 'Sáb', emoji: '🌟', color: 'from-pink-500 to-pink-600' }
    ]

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
                showToast('Horário adicionado com sucesso!', 'success')
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
        if (!confirm('Tem certeza que deseja excluir este horário?')) return

        try {
            const res = await fetch(`/api/admin/slots?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                showToast('Horário excluído com sucesso!', 'success')
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
                    currentStatus ? 'Horário desativado' : 'Horário ativado',
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
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Novo Header */}
                <AdminHeader
                    title="Gerenciar Agenda"
                    description="Configure os horários disponíveis para agendamento"
                    showBackButton={true}
                />

                {/* Actions Bar */}
                <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-semibold text-charcoal">Como funciona</p>
                            <p className="text-sm text-gray-600">
                                Adicione os horários disponíveis para cada dia. Os clientes só poderão agendar nos horários ativos.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={20} />
                        Novo Horário
                    </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-blue-500" size={24} />
                            <p className="text-sm text-gray-600">Total de Dias</p>
                        </div>
                        <p className="text-3xl font-bold text-charcoal">
                            {daysOfWeek.filter(d => getSlotsByDay(d.value).length > 0).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-green-500" size={24} />
                            <p className="text-sm text-gray-600">Horários Ativos</p>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            {slots.filter(s => s.active).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-orange-500" size={24} />
                            <p className="text-sm text-gray-600">Total de Horários</p>
                        </div>
                        <p className="text-3xl font-bold text-charcoal">
                            {slots.length}
                        </p>
                    </div>
                </div>

                {/* Grid de dias - NOVO DESIGN */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {daysOfWeek.map((day) => {
                        const daySlots = getSlotsByDay(day.value)
                        const activeSlots = daySlots.filter(s => s.active).length

                        return (
                            <div
                                key={day.value}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border-2 border-gray-100"
                            >
                                {/* Header do Card - Gradiente */}
                                <div className={`bg-gradient-to-br ${day.color} text-white p-5`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{day.emoji}</span>
                                            <h3 className="text-lg font-bold">{day.short}</h3>
                                        </div>
                                        <span className="bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {activeSlots}/{daySlots.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/90">
                                        {daySlots.length === 0
                                            ? 'Sem horários'
                                            : `${activeSlots} ${activeSlots === 1 ? 'ativo' : 'ativos'}`
                                        }
                                    </p>
                                </div>

                                {/* Lista de Horários */}
                                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                                    {daySlots.length > 0 ? (
                                        daySlots.map(slot => (
                                            <div
                                                key={slot.id}
                                                className={`group p-3 rounded-xl border-2 transition-all ${slot.active
                                                    ? 'border-green-200 bg-green-50 hover:bg-green-100 hover:shadow-md'
                                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-60'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock
                                                            size={16}
                                                            className={slot.active ? 'text-green-600' : 'text-gray-400'}
                                                        />
                                                        <span className={`font-bold ${slot.active ? 'text-green-900' : 'text-gray-500'
                                                            }`}>
                                                            {slot.timeSlot}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleToggleSlot(slot.id, slot.active)}
                                                            className={`p-1.5 rounded-lg transition-all ${slot.active
                                                                ? 'text-orange-600 hover:bg-orange-100'
                                                                : 'text-green-600 hover:bg-green-100'
                                                                }`}
                                                            title={slot.active ? 'Desativar' : 'Ativar'}
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-gray-400 text-sm">Nenhum horário</p>
                                            <button
                                                onClick={() => {
                                                    setSelectedDay(day.value)
                                                    setShowAddModal(true)
                                                }}
                                                className="mt-3 text-xs text-gold hover:text-gold-dark font-semibold"
                                            >
                                                + Adicionar horário
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Modal Adicionar */}
                {showAddModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <div
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-2">
                                <Plus className="text-gold" />
                                Adicionar Horário
                            </h2>

                            <div className="space-y-4">
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
                                </div>

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
                                        className="flex-1"
                                    >
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}