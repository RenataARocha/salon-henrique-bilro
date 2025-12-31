// app/(dashboard)/admin/horarios-bloqueados/page.tsx 


'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import BlockedTimeForm from '@/components/admin/BlockedTimeForm'

interface BlockedTime {
    id: string
    type: string
    date?: string
    startTime?: string
    endTime?: string
    dayOfWeek?: number
    isRecurring: boolean
    reason: string
    description?: string
    startDate?: string
    endDate?: string
    creator: {
        name: string
    }
    createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
    LUNCH_BREAK: '🍽️ Almoço',
    DAY_OFF: '📅 Folga',
    HOLIDAY: '🎉 Feriado',
    VACATION: '✈️ Férias',
    MAINTENANCE: '🔧 Manutenção',
    SPECIAL_EVENT: '📚 Evento',
    OTHER: '📝 Outro'
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function BlockedTimesPage() {
    const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingBlock, setEditingBlock] = useState<BlockedTime | null>(null)
    const [filter, setFilter] = useState<'all' | 'recurring' | 'punctual'>('all')

    useEffect(() => {
        fetchBlockedTimes()
    }, [])

    const fetchBlockedTimes = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/blocked-times')
            const data = await res.json()

            if (data.success) {
                setBlockedTimes(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar bloqueios:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este bloqueio?')) return

        try {
            const res = await fetch(`/api/admin/blocked-times/${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                alert('Bloqueio removido!')
                fetchBlockedTimes()
            } else {
                alert('Erro ao remover bloqueio')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao remover bloqueio')
        }
    }

    const handleEdit = (block: BlockedTime) => {
        setEditingBlock(block)
        setShowForm(true)
    }

    const filteredBlocks = blockedTimes.filter(block => {
        if (filter === 'recurring') return block.isRecurring
        if (filter === 'punctual') return !block.isRecurring
        return true
    })

    const recurringBlocks = filteredBlocks.filter(b => b.isRecurring)
    const punctualBlocks = filteredBlocks.filter(b => !b.isRecurring)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
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
                <AdminHeader
                    title="Horários Bloqueados"
                    description="Gerencie horários indisponíveis para agendamento"
                    showBackButton={true}
                />

                {/* Ações */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === 'all'
                                    ? 'bg-gradient-gold text-white shadow-lg'
                                    : 'bg-white text-charcoal hover:shadow-md'
                                }`}
                        >
                            📋 Todos ({blockedTimes.length})
                        </button>
                        <button
                            onClick={() => setFilter('recurring')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === 'recurring'
                                    ? 'bg-gradient-gold text-white shadow-lg'
                                    : 'bg-white text-charcoal hover:shadow-md'
                                }`}
                        >
                            🔄 Recorrentes ({recurringBlocks.length})
                        </button>
                        <button
                            onClick={() => setFilter('punctual')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === 'punctual'
                                    ? 'bg-gradient-gold text-white shadow-lg'
                                    : 'bg-white text-charcoal hover:shadow-md'
                                }`}
                        >
                            📅 Pontuais ({punctualBlocks.length})
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={fetchBlockedTimes}
                            className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                        >
                            <RefreshCw size={20} />
                            Atualizar
                        </button>
                        <button
                            onClick={() => {
                                setEditingBlock(null)
                                setShowForm(true)
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                        >
                            <Plus size={20} />
                            Novo Bloqueio
                        </button>
                    </div>
                </div>

                {/* Bloqueios Recorrentes */}
                {(filter === 'all' || filter === 'recurring') && recurringBlocks.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                            <RefreshCw size={24} className="text-gold" />
                            Bloqueios Recorrentes
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recurringBlocks.map(block => (
                                <div
                                    key={block.id}
                                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-2xl">{TYPE_LABELS[block.type]?.split(' ')[0]}</span>
                                            <h3 className="font-bold text-lg text-charcoal mt-1">
                                                {block.reason}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Toda {DAYS_OF_WEEK[block.dayOfWeek!]}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(block)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} className="text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(block.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {(block.startTime || block.endTime) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                            <Clock size={16} />
                                            <span>
                                                {block.startTime || '00:00'} - {block.endTime || '23:59'}
                                            </span>
                                        </div>
                                    )}

                                    {(block.startDate || block.endDate) && (
                                        <div className="text-sm text-gray-600 mb-3">
                                            <p className="font-semibold">Período de validade:</p>
                                            <p>
                                                {block.startDate && formatDate(block.startDate)}
                                                {block.startDate && block.endDate && ' até '}
                                                {block.endDate && formatDate(block.endDate)}
                                            </p>
                                        </div>
                                    )}

                                    {block.description && (
                                        <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                                            {block.description}
                                        </p>
                                    )}

                                    <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                        Criado por {block.creator.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bloqueios Pontuais */}
                {(filter === 'all' || filter === 'punctual') && punctualBlocks.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                            <Calendar size={24} className="text-gold" />
                            Bloqueios Pontuais
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {punctualBlocks.map(block => (
                                <div
                                    key={block.id}
                                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-2xl">{TYPE_LABELS[block.type]?.split(' ')[0]}</span>
                                            <h3 className="font-bold text-lg text-charcoal mt-1">
                                                {block.reason}
                                            </h3>
                                            {block.date && (
                                                <p className="text-sm text-gray-600">
                                                    {formatDate(block.date)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(block)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} className="text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(block.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {(block.startTime || block.endTime) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                            <Clock size={16} />
                                            <span>
                                                {block.startTime || '00:00'} - {block.endTime || '23:59'}
                                            </span>
                                        </div>
                                    )}

                                    {block.description && (
                                        <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                                            {block.description}
                                        </p>
                                    )}

                                    <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                        Criado por {block.creator.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredBlocks.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-6xl mb-4">📅</p>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">
                            Nenhum bloqueio cadastrado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Configure horários indisponíveis para agendamento
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                        >
                            <Plus size={20} />
                            Criar Primeiro Bloqueio
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <BlockedTimeForm
                    onClose={() => {
                        setShowForm(false)
                        setEditingBlock(null)
                    }}
                    onSuccess={fetchBlockedTimes}
                    editData={editingBlock}
                />
            )}
        </div>
    )
}