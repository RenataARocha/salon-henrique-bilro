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
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gold/20 border-t-gold mx-auto mb-5 shadow-md"></div>
                            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-6">

                <AdminHeader
                    title="Horários Bloqueados"
                    description="Gerencie horários indisponíveis para agendamento"
                />

                {/* Área de Ações */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Linha 1: Filtros */}
                    <div className="flex gap-2 bg-gray-100/80 p-1.5 rounded-xl">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${filter === 'all'
                                ? 'bg-gradient-gold text-white shadow-md'
                                : 'text-charcoal hover:bg-white/70'
                                }`}
                        >
                            <span className="sm:hidden">📋 ({blockedTimes.length})</span>
                            <span className="hidden sm:inline">📋 Todos ({blockedTimes.length})</span>
                        </button>
                        <button
                            onClick={() => setFilter('recurring')}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${filter === 'recurring'
                                ? 'bg-gradient-gold text-white shadow-md'
                                : 'text-charcoal hover:bg-white/70'
                                }`}
                        >
                            <span className="sm:hidden">🔄 ({recurringBlocks.length})</span>
                            <span className="hidden sm:inline">🔄 Recorrentes ({recurringBlocks.length})</span>
                        </button>
                        <button
                            onClick={() => setFilter('punctual')}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${filter === 'punctual'
                                ? 'bg-gradient-gold text-white shadow-md'
                                : 'text-charcoal hover:bg-white/70'
                                }`}
                        >
                            <span className="sm:hidden">📅 ({punctualBlocks.length})</span>
                            <span className="hidden sm:inline">📅 Pontuais ({punctualBlocks.length})</span>
                        </button>
                    </div>

                    {/* Linha 2: Ações */}
                    <div className="flex flex-wrap gap-2">
                        {!selectMode ? (
                            <>
                                {/* Botão Selecionar */}
                                <button
                                    onClick={() => setSelectMode(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold shadow-sm"
                                >
                                    <CheckSquare size={15} />
                                    <span>Selecionar</span>
                                </button>

                                {/* Divider visual */}
                                <div className="w-px bg-gray-100 self-stretch hidden sm:block" />

                                {/* Atualizar */}
                                <button
                                    onClick={fetchBlockedTimes}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-charcoal rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all text-xs sm:text-sm font-medium"
                                    title="Atualizar"
                                >
                                    <RefreshCw size={15} />
                                    <span className="hidden sm:inline">Atualizar</span>
                                </button>

                                {/* Almoço */}
                                <button
                                    onClick={() => setShowLunchModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-md active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold shadow-sm"
                                >
                                    <UtensilsCrossed size={15} />
                                    <span className="hidden sm:inline">Horário de </span>Almoço
                                </button>

                                {/* Novo Bloqueio — destaque, cresce para preencher no mobile */}
                                <button
                                    onClick={() => {
                                        setEditingBlock(null)
                                        setShowForm(true)
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-gold text-white rounded-xl hover:shadow-md active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold shadow-sm ml-auto"
                                >
                                    <Plus size={15} />
                                    <span><span className="hidden sm:inline">Novo </span>Bloqueio</span>
                                </button>
                            </>
                        ) : (
                            /* Modo seleção */
                            <>
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-xs sm:text-sm font-semibold shadow-sm"
                                >
                                    {selectedIds.size === filteredBlocks.length ? (
                                        <><Square size={15} /><span>Desmarcar</span></>
                                    ) : (
                                        <><CheckSquare size={15} /><span>Selecionar Todos</span></>
                                    )}
                                </button>
                                <button
                                    onClick={handleDeleteMultiple}
                                    disabled={selectedIds.size === 0}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Trash2 size={15} />
                                    Excluir ({selectedIds.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectMode(false);
                                        setSelectedIds(new Set());
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-xs sm:text-sm font-medium ml-auto"
                                >
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Bloqueios Recorrentes */}
                {(filter === 'all' || filter === 'recurring') && recurringBlocks.length > 0 && (
                    <div>
                        <motion.h2
                            className="text-base font-bold text-charcoal mb-3 flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="p-1.5 bg-gold/10 rounded-lg">
                                <RefreshCw size={16} className="text-gold" />
                            </div>
                            Bloqueios Recorrentes
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {recurringBlocks.length}
                            </span>
                        </motion.h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {/* 🍽️ Horário de Almoço AGRUPADO */}
                            {groupedLunchBreak && (
                                <motion.div
                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 ${isLunchSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {selectMode && (
                                                <button onClick={toggleLunchSelection} className="mt-0.5 flex-shrink-0">
                                                    {isLunchSelected ? (
                                                        <CheckSquare size={19} className="text-blue-500" />
                                                    ) : (
                                                        <Square size={19} className="text-gray-300" />
                                                    )}
                                                </button>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl leading-none">🍽️</span>
                                                    <h3 className="font-bold text-base text-charcoal truncate">
                                                        Horário de Almoço
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Toda {groupedLunchBreak.days.map(d => DAYS_OF_WEEK[d!]).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        {!selectMode && (
                                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                                <button onClick={() => setShowLunchModal(true)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={16} className="text-blue-500" />
                                                </button>
                                                <button onClick={handleDeleteLunch} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                        <Clock size={14} className="text-gold flex-shrink-0" />
                                        <span className="font-medium">{groupedLunchBreak.startTime} – {groupedLunchBreak.endTime}</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 🔁 OUTROS BLOQUEIOS RECORRENTES */}
                            {otherRecurringBlocks.map((block, index) => (
                                <motion.div
                                    key={block.id}
                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 ${selectedIds.has(block.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {selectMode && (
                                                <button onClick={() => toggleSelection(block.id)} className="mt-0.5 flex-shrink-0">
                                                    {selectedIds.has(block.id) ? (
                                                        <CheckSquare className="text-blue-500" size={19} />
                                                    ) : (
                                                        <Square className="text-gray-300" size={19} />
                                                    )}
                                                </button>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl leading-none">{TYPE_LABELS[block.type]?.split(' ')[0]}</span>
                                                    <h3 className="font-bold text-base text-charcoal truncate">{block.reason}</h3>
                                                </div>
                                                <p className="text-xs text-gray-500">Toda {DAYS_OF_WEEK[block.dayOfWeek!]}</p>
                                            </div>
                                        </div>
                                        {!selectMode && (
                                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                                <button onClick={() => handleEdit(block)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={16} className="text-blue-500" />
                                                </button>
                                                <button onClick={() => handleDelete(block.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {(block.startTime || block.endTime) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                                            <Clock size={14} className="text-gold flex-shrink-0" />
                                            <span className="font-medium">{block.startTime || '00:00'} – {block.endTime || '23:59'}</span>
                                        </div>
                                    )}
                                    {(block.startDate || block.endDate) && (
                                        <div className="text-xs mb-3 bg-amber-50 rounded-lg px-3 py-2">
                                            <p className="font-semibold text-amber-700 mb-0.5">Período de validade</p>
                                            <p className="text-amber-600">
                                                {block.startDate && formatDate(block.startDate)}
                                                {block.startDate && block.endDate && ' até '}
                                                {block.endDate && formatDate(block.endDate)}
                                            </p>
                                        </div>
                                    )}
                                    {block.description && (
                                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-dashed">{block.description}</p>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                                        Criado por <span className="text-gray-500 font-medium">{block.creator.name}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bloqueios Pontuais */}
                {(filter === 'all' || filter === 'punctual') && punctualBlocks.length > 0 && (
                    <div>
                        <h2 className="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-gold/10 rounded-lg">
                                <Calendar size={16} className="text-gold" />
                            </div>
                            Bloqueios Pontuais
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {punctualBlocks.length}
                            </span>
                        </h2>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {punctualBlocks.map(block => (
                                <div
                                    key={block.id}
                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 ${selectedIds.has(block.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {selectMode && (
                                                <button onClick={() => toggleSelection(block.id)} className="mt-0.5 flex-shrink-0">
                                                    {selectedIds.has(block.id) ? (
                                                        <CheckSquare className="text-blue-500" size={19} />
                                                    ) : (
                                                        <Square className="text-gray-300" size={19} />
                                                    )}
                                                </button>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl leading-none">{TYPE_LABELS[block.type]?.split(' ')[0]}</span>
                                                    <h3 className="font-bold text-base text-charcoal truncate">{block.reason}</h3>
                                                </div>
                                                {block.type === 'VACATION' && block.date && block.endDate ? (
                                                    <p className="text-xs text-gray-500">{formatDate(block.date)} até {formatDate(block.endDate)}</p>
                                                ) : block.date ? (
                                                    <p className="text-xs text-gray-500">{formatDate(block.date)}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                        {!selectMode && (
                                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                                <button onClick={() => handleEdit(block)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={16} className="text-blue-500" />
                                                </button>
                                                <button onClick={() => handleDelete(block.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {(block.startTime || block.endTime) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                                            <Clock size={14} className="text-gold flex-shrink-0" />
                                            <span className="font-medium">{block.startTime || '00:00'} – {block.endTime || '23:59'}</span>
                                        </div>
                                    )}
                                    {block.description && (
                                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-dashed">{block.description}</p>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                                        Criado por <span className="text-gray-500 font-medium">{block.creator.name}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Empty State */}
                {filteredBlocks.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <p className="text-5xl mb-4">📅</p>
                        <h3 className="text-xl font-bold text-charcoal mb-2">Nenhum bloqueio cadastrado</h3>
                        <p className="text-sm text-gray-500 mb-6">Configure horários indisponíveis para agendamento</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowLunchModal(true)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg active:scale-[0.98] transition-all text-sm font-semibold"
                            >
                                <UtensilsCrossed size={17} />
                                Horário de Almoço
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-gold text-white rounded-xl hover:shadow-lg active:scale-[0.98] transition-all text-sm font-semibold"
                            >
                                <Plus size={17} />
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