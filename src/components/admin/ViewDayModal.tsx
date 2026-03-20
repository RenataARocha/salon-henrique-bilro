// components/admin/ViewDayModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, Trash2, Calendar, Ban, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface AvailableSlot {
    id: string
    dayOfWeek: number
    timeSlot: string
    active: boolean
}

interface DayInfo {
    value: number
    label: string
    emoji: string
}

interface Props {
    viewingDate: Date
    viewingDay: number
    daysOfWeek: DayInfo[]
    slots: AvailableSlot[]
    formatFullDate: (date: Date) => string
    onClose: () => void
    onSlotDeleted: () => void
    showToast: (msg: string, type: string) => void
}

export default function ViewDayModal({
    viewingDate, viewingDay, daysOfWeek, slots,
    formatFullDate, onClose, onSlotDeleted, showToast
}: Props) {
    const [blockedSlots, setBlockedSlots] = useState<string[]>([])
    const [blockedSlotsMap, setBlockedSlotsMap] = useState<Record<string, string>>({})
    const [loadingSlot, setLoadingSlot] = useState<string | null>(null)

    const dateStr = viewingDate.toISOString().split('T')[0]

    useEffect(() => { fetchBlockedSlots() }, [viewingDate])

    const fetchBlockedSlots = async () => {
        try {
            const res = await fetch('/api/admin/blocked-times')
            const data = await res.json()
            if (data.success) {
                const map: Record<string, string> = {}
                data.data.forEach((b: any) => {
                    if (!b.isRecurring && b.startTime && b.date) {
                        const bDate = new Date(b.date).toISOString().split('T')[0]
                        if (bDate === dateStr) map[b.startTime] = b.id
                    }
                })
                setBlockedSlotsMap(map)
                setBlockedSlots(Object.keys(map))
            }
        } catch (error) {
            console.error('Erro ao buscar bloqueios:', error)
        }
    }

    const handleToggleThisDay = async (timeSlot: string) => {
        setLoadingSlot(timeSlot)
        try {
            const existingId = blockedSlotsMap[timeSlot]

            if (existingId) {
                // Libera — remove BlockedTime pontual
                const res = await fetch(`/api/admin/blocked-times/${existingId}`, { method: 'DELETE' })
                const data = await res.json()
                if (data.success) {
                    showToast('▶️ Horário disponível neste dia', 'success')
                    fetchBlockedSlots()
                } else {
                    showToast(data.error || 'Erro ao desbloquear', 'error')
                }
            } else {
                // Bloqueia — cria BlockedTime pontual usando rota existente
                const res = await fetch('/api/admin/blocked-times', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'OTHER',
                        reason: 'Bloqueado manualmente para esta data',
                        isRecurring: false,
                        date: dateStr,
                        startTime: timeSlot,
                        endTime: timeSlot,
                    })
                })
                const data = await res.json()
                if (data.success) {
                    showToast('⏸️ Horário bloqueado só para este dia', 'success')
                    fetchBlockedSlots()
                } else {
                    showToast(data.error || 'Erro ao bloquear', 'error')
                }
            }
        } catch (error) {
            showToast('Erro ao atualizar horário', 'error')
        } finally {
            setLoadingSlot(null)
        }
    }

    const handleDeleteForever = async (id: string) => {
        if (!confirm(
            '⚠️ Isso remove este horário de TODAS as semanas permanentemente.\n\n' +
            'Se quiser bloquear só hoje, use o botão 🔒.\n\n' +
            'Confirma a exclusão permanente?'
        )) return

        try {
            const res = await fetch(`/api/admin/slots?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                showToast('🗑️ Horário excluído de todas as semanas', 'success')
                onSlotDeleted()
            } else {
                showToast(data.error || 'Erro ao excluir', 'error')
            }
        } catch (error) {
            showToast('Erro ao excluir horário', 'error')
        }
    }

    const day = daysOfWeek[viewingDay]

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-black/60 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2">
                            <div className="h-px w-5 bg-gold opacity-60" />
                            <span className="text-xs tracking-[0.3em] text-gold uppercase font-medium">Data específica</span>
                            <div className="h-px w-5 bg-gold opacity-60" />
                        </div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-gold" size={20} />
                            Horários do Dia
                        </h2>
                        <p className="text-white/50 text-sm mt-0.5">{day.emoji} {day.label}</p>
                        <p className="text-gold font-semibold text-sm capitalize mt-0.5">{formatFullDate(viewingDate)}</p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8 text-xl">×</button>
                </div>

                {/* Legenda */}
                <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3 mb-5 text-xs text-blue-300/80 space-y-1">
                    <p><Ban size={12} className="inline mr-1 text-orange-400" /><strong className="text-white/70">Bloquear este dia</strong> — some só nesta data, outras semanas continuam normais.</p>
                    <p><Trash2 size={12} className="inline mr-1 text-red-400" /><strong className="text-white/70">Excluir sempre</strong> — remove de <strong>todas</strong> as semanas permanentemente.</p>
                </div>

                {/* Lista */}
                <div className="space-y-3">
                    {slots.length > 0 ? slots.map(slot => {
                        const isBlockedThisDay = blockedSlots.includes(slot.timeSlot)
                        const isLoading = loadingSlot === slot.timeSlot

                        return (
                            <div key={slot.id} className={`p-4 rounded-xl border transition-all ${isBlockedThisDay ? 'border-red-800/40 bg-red-950/30' :
                                    slot.active ? 'border-emerald-800/30 bg-emerald-950/20' :
                                        'border-white/8 bg-white/4 opacity-60'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className={isBlockedThisDay ? 'text-red-400' : slot.active ? 'text-emerald-400' : 'text-white/30'} />
                                        <span className={`text-lg font-bold ${isBlockedThisDay ? 'text-red-300' : slot.active ? 'text-white' : 'text-white/40'}`}>
                                            {slot.timeSlot}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${isBlockedThisDay ? 'bg-red-900/50 text-red-400 border-red-700/30' :
                                                slot.active ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30' :
                                                    'bg-white/8 text-white/30 border-white/10'
                                            }`}>
                                            {isBlockedThisDay ? 'Bloqueado hoje' : slot.active ? 'Disponível' : 'Inativo'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleThisDay(slot.timeSlot)}
                                            disabled={isLoading}
                                            title={isBlockedThisDay ? 'Liberar este dia' : 'Bloquear só hoje'}
                                            className={`p-2 rounded-lg transition-all ${isBlockedThisDay
                                                    ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                                                    : 'bg-orange-900/40 text-orange-400 hover:bg-orange-900/60'
                                                }`}
                                        >
                                            {isLoading ? <span className="text-xs">⏳</span> :
                                                isBlockedThisDay ? <CheckCircle size={14} /> : <Ban size={14} />}
                                        </button>

                                        <button
                                            onClick={() => handleDeleteForever(slot.id)}
                                            title="Excluir de todas as semanas"
                                            className="p-2 bg-red-950/40 text-red-400 rounded-lg hover:bg-red-950/60 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="text-center py-10">
                            <Clock size={40} className="mx-auto text-white/15 mb-3" />
                            <p className="text-white/40 text-sm">Nenhum horário configurado para este dia</p>
                        </div>
                    )}
                </div>

                <Button variant="secondary" onClick={onClose} className="w-full mt-6">Fechar</Button>
            </div>
        </div>
    )
}