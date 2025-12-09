// app/(dashboard)/admin/agenda/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Plus, Trash2, AlertCircle, Power } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastContainer'

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
        { value: 0, label: 'Domingo', color: 'bg-purple-50 border-purple-200' },
        { value: 1, label: 'Segunda-feira', color: 'bg-blue-50 border-blue-200' },
        { value: 2, label: 'Terça-feira', color: 'bg-green-50 border-green-200' },
        { value: 3, label: 'Quarta-feira', color: 'bg-yellow-50 border-yellow-200' },
        { value: 4, label: 'Quinta-feira', color: 'bg-orange-50 border-orange-200' },
        { value: 5, label: 'Sexta-feira', color: 'bg-red-50 border-red-200' },
        { value: 6, label: 'Sábado', color: 'bg-pink-50 border-pink-200' }
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
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-gold text-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CalendarIcon size={40} />
                                <h1 className="text-4xl font-bold">Gerenciar Agenda</h1>
                            </div>
                            <p className="text-white/90">Configure os horários disponíveis para agendamento</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => setShowAddModal(true)}
                            className="bg-white text-gold hover:bg-gray-100"
                        >
                            <Plus size={20} />
                            Adicionar Horário
                        </Button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-sm text-blue-900 font-semibold">Como funciona</p>
                        <p className="text-sm text-blue-700">
                            Adicione os horários disponíveis para cada dia da semana. Os clientes só poderão agendar nos horários ativos.
                        </p>
                    </div>
                </div>

                {/* Grid de dias */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {daysOfWeek.map((day) => {
                        const daySlots = getSlotsByDay(day.value)
                        const activeSlots = daySlots.filter(s => s.active).length

                        return (
                            <div
                                key={day.value}
                                className={`border-2 ${day.color} rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl`}
                            >
                                {/* Header do Card */}
                                <div className="bg-white/80 backdrop-blur p-4 border-b-2 border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-charcoal">{day.label}</h3>
                                        <span className="bg-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {activeSlots}/{daySlots.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {daySlots.length === 0
                                            ? 'Nenhum horário cadastrado'
                                            : `${activeSlots} ${activeSlots === 1 ? 'horário ativo' : 'horários ativos'}`
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
                                                        ? 'border-green-300 bg-green-50 hover:bg-green-100'
                                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className={slot.active ? 'text-green-600' : 'text-gray-400'} />
                                                        <span className={`font-bold text-sm ${slot.active ? 'text-green-900' : 'text-gray-500'}`}>
                                                            {slot.timeSlot}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleToggleSlot(slot.id, slot.active)}
                                                            className={`p-1.5 rounded-lg transition-colors ${slot.active
                                                                    ? 'text-green-600 hover:bg-green-200'
                                                                    : 'text-gray-400 hover:bg-gray-200'
                                                                }`}
                                                            title={slot.active ? 'Desativar' : 'Ativar'}
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Modal Adicionar */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
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
                                                {day.label}
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