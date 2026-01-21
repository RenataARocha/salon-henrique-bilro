'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, RefreshCw, UtensilsCrossed, CheckSquare, Square } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import BlockedTimeForm from '@/components/admin/BlockedTimeForm'
import LunchBreakModal from '@/components/admin/LunchBreakModal'
import { motion } from 'framer-motion'

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
    const [showLunchModal, setShowLunchModal] = useState(false)
    const [editingBlock, setEditingBlock] = useState<BlockedTime | null>(null)
    const [filter, setFilter] = useState<'all' | 'recurring' | 'punctual'>('all')

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectMode, setSelectMode] = useState(false)

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

    const handleDeleteMultiple = async () => {
        if (selectedIds.size === 0) {
            alert('Selecione pelo menos um item')
            return
        }

        if (!confirm(`Deseja realmente remover ${selectedIds.size} ${selectedIds.size === 1 ? 'bloqueio' : 'bloqueios'}?`)) return

        try {
            const promises = Array.from(selectedIds).map(id =>
                fetch(`/api/admin/blocked-times/${id}`, { method: 'DELETE' })
            )

            await Promise.all(promises)

            alert(`${selectedIds.size} ${selectedIds.size === 1 ? 'bloqueio removido' : 'bloqueios removidos'}!`)
            setSelectedIds(new Set())
            setSelectMode(false)
            fetchBlockedTimes()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao remover bloqueios')
        }
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredBlocks.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredBlocks.map(b => b.id)))
        }
    }

    const handleEdit = (block: BlockedTime) => {
        setEditingBlock(block)
        setShowForm(true)
    }

    const handleCloseForm = () => {
        setShowForm(false)
        setEditingBlock(null)
    }

    const handleFormSuccess = () => {
        fetchBlockedTimes()
        handleCloseForm()
    }

    const handleLunchSuccess = () => {
        fetchBlockedTimes()
        setShowLunchModal(false)
    }

    const filteredBlocks = blockedTimes.filter(block => {
        if (filter === 'recurring') return block.isRecurring
        if (filter === 'punctual') return !block.isRecurring
        return true
    })

    const recurringBlocks = filteredBlocks.filter(b => b.isRecurring)
    const punctualBlocks = filteredBlocks.filter(b => !b.isRecurring)

    const recurringLunchBreaks = recurringBlocks.filter(
        b => b.type === 'LUNCH_BREAK'
    )

    const otherRecurringBlocks = recurringBlocks.filter(
        b => b.type !== 'LUNCH_BREAK'
    )

    const groupedLunchBreak =
        recurringLunchBreaks.length > 0
            ? {
                ...recurringLunchBreaks[0],
                days: recurringLunchBreaks
                    .map(b => b.dayOfWeek)
                    .sort((a, b) => a! - b!)
            }
            : null

    const lunchBreakIds = recurringLunchBreaks.map(b => b.id)
    const isLunchSelected =
        lunchBreakIds.every(id => selectedIds.has(id)) && lunchBreakIds.length > 0

    const toggleLunchSelection = () => {
        const newSet = new Set(selectedIds)

        if (isLunchSelected) {
            lunchBreakIds.forEach(id => newSet.delete(id))
        } else {
            lunchBreakIds.forEach(id => newSet.add(id))
        }

        setSelectedIds(newSet)
    }

    const handleDeleteLunch = async () => {
        if (!confirm(`Deseja remover o horário de almoço de ${lunchBreakIds.length} dia(s)?`)) return

        try {
            const promises = lunchBreakIds.map(id =>
                fetch(`/api/admin/blocked-times/${id}`, { method: 'DELETE' })
            )

            await Promise.all(promises)

            alert('Horário de almoço removido!')
            fetchBlockedTimes()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao remover horário de almoço')
        }
    }


    // ✅ FUNÇÃO CORRIGIDA: Formata data sem problemas de timezone
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data inválida'

        try {
            // Remove timezone e pega apenas YYYY-MM-DD
            const dateOnly = dateString.split('T')[0]
            const [year, month, day] = dateOnly.split('-')

            // Cria data local (sem timezone UTC)
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })
        } catch (error) {
            console.error('Erro ao formatar data:', dateString, error)
            return 'Data inválida'
        }
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
                <motion.div
                    className="flex items-center justify-between flex-wrap gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
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
                        {!selectMode ? (
                            <button
                                onClick={() => setSelectMode(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
                            >
                                <CheckSquare size={20} />
                                Selecionar Múltiplos
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
                                >
                                    {selectedIds.size === filteredBlocks.length ? (
                                        <>
                                            <Square size={20} />
                                            Desmarcar Todos
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare size={20} />
                                            Selecionar Todos
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDeleteMultiple}
                                    disabled={selectedIds.size === 0}
                                    className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={20} />
                                    Excluir Selecionados ({selectedIds.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectMode(false)
                                        setSelectedIds(new Set())
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                                >
                                    Cancelar
                                </button>
                            </>
                        )}

                        {!selectMode && (
                            <>
                                <button
                                    onClick={fetchBlockedTimes}
                                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <RefreshCw size={20} />
                                    Atualizar
                                </button>

                                <button
                                    onClick={() => setShowLunchModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                                >
                                    <UtensilsCrossed size={20} />
                                    Horário de Almoço
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
                            </>
                        )}
                    </div>
                </motion.div>
                {/* Bloqueios Recorrentes */}
                {(filter === 'all' || filter === 'recurring') && recurringBlocks.length > 0 && (
                    <div>
                        <motion.h2
                            className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <RefreshCw size={24} className="text-gold" />
                            Bloqueios Recorrentes
                        </motion.h2>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* 🍽️ Horário de Almoço AGRUPADO */}
                            {groupedLunchBreak && (
                                <motion.div
                                    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${isLunchSelected ? 'ring-4 ring-blue-500' : ''}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {selectMode && (
                                                <button onClick={toggleLunchSelection} className="mt-1">
                                                    {isLunchSelected ? (
                                                        <CheckSquare size={20} className="text-blue-500" />
                                                    ) : (
                                                        <Square size={20} className="text-gray-400" />
                                                    )}
                                                </button>
                                            )}

                                            <div>
                                                <span className="text-2xl">🍽️</span>
                                                <h3 className="font-bold text-lg text-charcoal mt-1">
                                                    Horário de Almoço
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Toda {groupedLunchBreak.days.map(d => DAYS_OF_WEEK[d!]).join(', ')}
                                                </p>
                                            </div>
                                        </div>

                                        {!selectMode && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowLunchModal(true)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Edit size={18} className="text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={handleDeleteLunch}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Trash2 size={18} className="text-red-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock size={16} />
                                        <span>
                                            {groupedLunchBreak.startTime} - {groupedLunchBreak.endTime}
                                        </span>
                                    </div>
                                </motion.div>
                            )}


                            {/* 🔁 OUTROS BLOQUEIOS RECORRENTES */}
                            {otherRecurringBlocks.map((block, index) => (
                                <motion.div
                                    key={block.id}
                                    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${selectedIds.has(block.id) ? 'ring-4 ring-blue-500' : ''}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {selectMode && (
                                                <button
                                                    onClick={() => toggleSelection(block.id)}
                                                    className="mt-1"
                                                >
                                                    {selectedIds.has(block.id) ? (
                                                        <CheckSquare className="text-blue-500" size={20} />
                                                    ) : (
                                                        <Square className="text-gray-400" size={20} />
                                                    )}
                                                </button>
                                            )}
                                            <div>
                                                <span className="text-2xl">
                                                    {TYPE_LABELS[block.type]?.split(' ')[0]}
                                                </span>
                                                <h3 className="font-bold text-lg text-charcoal mt-1">
                                                    {block.reason}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Toda {DAYS_OF_WEEK[block.dayOfWeek!]}
                                                </p>
                                            </div>
                                        </div>

                                        {!selectMode && (
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
                                        )}
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
                                </motion.div>
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
                        <motion.div
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}>
                            {punctualBlocks.map(block => (
                                <div
                                    key={block.id}
                                    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${selectedIds.has(block.id) ? 'ring-4 ring-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {selectMode && (
                                                <button
                                                    onClick={() => toggleSelection(block.id)}
                                                    className="mt-1"
                                                >
                                                    {selectedIds.has(block.id) ? (
                                                        <CheckSquare className="text-blue-500" size={20} />
                                                    ) : (
                                                        <Square className="text-gray-400" size={20} />
                                                    )}
                                                </button>
                                            )}
                                            <div>
                                                <span className="text-2xl">{TYPE_LABELS[block.type]?.split(' ')[0]}</span>
                                                <h3 className="font-bold text-lg text-charcoal mt-1">
                                                    {block.reason}
                                                </h3>
                                                {/* ✅ CORREÇÃO: Mostrar período para férias */}
                                                {block.type === 'VACATION' && block.date && block.endDate ? (
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(block.date)} até {formatDate(block.endDate)}
                                                    </p>
                                                ) : block.date ? (
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(block.date)}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        {!selectMode && (
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
                                        )}
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
                        </motion.div>
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
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowLunchModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                            >
                                <UtensilsCrossed size={20} />
                                Horário de Almoço
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                            >
                                <Plus size={20} />
                                Criar Bloqueio
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {
                showForm && (
                    <BlockedTimeForm
                        onClose={handleCloseForm}
                        onSuccess={handleFormSuccess}
                        editData={editingBlock}
                    />
                )
            }

            {
                showLunchModal && (
                    <LunchBreakModal
                        onClose={() => setShowLunchModal(false)}
                        onSuccess={handleLunchSuccess}
                    />
                )
            }
        </div >
    )
}