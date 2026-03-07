// app/(dashboard)/admin/comissoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface StaffServiceDetail {
    id: string
    clientName: string
    clientPhone: string | null
    serviceValue: number
    commissionValue: number
    executedAt: string
    paymentMethod: string
    commissionPaid: boolean
    service: {
        name: string
    } | null
    combo: {
        name: string
    } | null
}

interface StaffCommissions {
    staffId: string
    staffName: string
    staffPhoto: string | null
    commissionPercent: number
    services: StaffServiceDetail[]
    totalServices: number
    totalCommission: number
    totalPaid: number
    totalPending: number
}

export default function ComissoesPage() {
    const [staffCommissions, setStaffCommissions] = useState<StaffCommissions[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [expandedStaff, setExpandedStaff] = useState<string[]>([])
    const [selectedServices, setSelectedServices] = useState<string[]>([])

    useEffect(() => {
        loadCommissions()
    }, [selectedMonth, selectedYear])

    async function loadCommissions() {
        try {
            setLoading(true)

            // Buscar serviços executados do mês
            const startDate = new Date(selectedYear, selectedMonth - 1, 1)
            const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

            const url = `/api/staff/services?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                // Agrupar por funcionário
                const grouped = data.data.reduce((acc: any, service: any) => {
                    const staffId = service.staff.id

                    if (!acc[staffId]) {
                        acc[staffId] = {
                            staffId,
                            staffName: service.staff.name,
                            staffPhoto: service.staff.photo,
                            commissionPercent: service.staff.commissionPercent || 0,
                            services: [],
                            totalServices: 0,
                            totalCommission: 0,
                            totalPaid: 0,
                            totalPending: 0
                        }
                    }

                    acc[staffId].services.push(service)
                    acc[staffId].totalServices++
                    acc[staffId].totalCommission += service.commissionValue

                    if (service.commissionPaid) {
                        acc[staffId].totalPaid += service.commissionValue
                    } else {
                        acc[staffId].totalPending += service.commissionValue
                    }

                    return acc
                }, {})

                setStaffCommissions(Object.values(grouped))
            }
        } catch (error) {
            console.error('Erro ao carregar comissões:', error)
        } finally {
            setLoading(false)
        }
    }

    function toggleStaffExpand(staffId: string) {
        setExpandedStaff(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        )
    }

    function toggleServiceSelection(serviceId: string) {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    function selectAllFromStaff(services: StaffServiceDetail[]) {
        const unpaidIds = services.filter(s => !s.commissionPaid).map(s => s.id)
        setSelectedServices(prev => [...new Set([...prev, ...unpaidIds])])
    }

    async function markAsPaid() {
        if (selectedServices.length === 0) {
            alert('Selecione pelo menos um serviço')
            return
        }

        if (!confirm(`Marcar ${selectedServices.length} comissão(ões) como pagas?`)) return

        try {
            const res = await fetch('/api/staff/services', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedServices })
            })

            const data = await res.json()

            if (data.success) {
                alert('Comissões marcadas como pagas!')
                setSelectedServices([])
                loadCommissions()
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao marcar como pago')
        }
    }

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const totalPending = staffCommissions.reduce((sum, s) => sum + s.totalPending, 0)
    const totalPaid = staffCommissions.reduce((sum, s) => sum + s.totalPaid, 0)
    const selectedTotal = staffCommissions.reduce((sum, staff) => {
        const staffSelected = staff.services
            .filter(s => selectedServices.includes(s.id))
            .reduce((s, service) => s + service.commissionValue, 0)
        return sum + staffSelected
    }, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-beige">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl font-bold text-charcoal">💰 Comissões Detalhadas</h1>
                    <p className="text-gray-600 mt-2">Gerencie os pagamentos de cada serviço executado</p>
                </motion.div>

                {/* Filtros */}
                <motion.div
                    className="bg-white rounded-xl shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Mês
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                            >
                                {monthNames.map((name, index) => (
                                    <option key={index} value={index + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Ano
                            </label>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                            >
                                {[2026, 2025, 2024].map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={loadCommissions}
                                className="w-full bg-gradient-gold text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Resumo */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-sm font-semibold opacity-90 mb-2">Comissões Pendentes</p>
                        <p className="text-4xl font-bold">R$ {totalPending.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-sm font-semibold opacity-90 mb-2">Comissões Pagas</p>
                        <p className="text-4xl font-bold">R$ {totalPaid.toFixed(2)}</p>
                    </div>

                    {selectedServices.length > 0 && (
                        <div className="bg-gradient-to-br from-gold to-gold-dark text-white p-6 rounded-xl shadow-lg">
                            <p className="text-sm font-semibold opacity-90 mb-2">Selecionado ({selectedServices.length})</p>
                            <p className="text-4xl font-bold">R$ {selectedTotal.toFixed(2)}</p>
                            <button
                                onClick={markAsPaid}
                                className="mt-3 w-full bg-white text-gold px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Marcar como Pago
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Lista por Funcionário */}
                <div className="space-y-6">
                    {staffCommissions.length > 0 ? (
                        staffCommissions.map((staff, index) => {
                            const isExpanded = expandedStaff.includes(staff.staffId)
                            const unpaidServices = staff.services.filter(s => !s.commissionPaid)

                            return (
                                <motion.div
                                    key={staff.staffId}
                                    className="bg-white rounded-xl shadow-md overflow-hidden"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                                >
                                    {/* Header do Funcionário */}
                                    <div
                                        className="bg-gradient-gold text-white p-6 cursor-pointer"
                                        onClick={() => toggleStaffExpand(staff.staffId)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {staff.staffPhoto ? (
                                                    <img
                                                        src={staff.staffPhoto}
                                                        alt={staff.staffName}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl font-bold">
                                                        {staff.staffName.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-xl">{staff.staffName}</h3>
                                                    <p className="text-sm text-gold-light">
                                                        {staff.totalServices} serviços • Comissão: {staff.commissionPercent}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-sm text-gold-light">Total Comissão</p>
                                                    <p className="text-3xl font-bold">R$ {staff.totalCommission.toFixed(2)}</p>
                                                    <div className="flex gap-4 text-xs mt-1">
                                                        <span className="text-orange-200">Pendente: R$ {staff.totalPending.toFixed(2)}</span>
                                                        <span className="text-green-200">Pago: R$ {staff.totalPaid.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista Detalhada de Serviços */}
                                    {isExpanded && (
                                        <div className="p-6 bg-beige/30">
                                            {unpaidServices.length > 0 && (
                                                <button
                                                    onClick={() => selectAllFromStaff(staff.services)}
                                                    className="mb-4 text-sm text-gold hover:text-gold-dark font-semibold"
                                                >
                                                    ✓ Selecionar todos não pagos ({unpaidServices.length})
                                                </button>
                                            )}

                                            <div className="space-y-3">
                                                {staff.services.map(service => (
                                                    <div
                                                        key={service.id}
                                                        className={`bg-white rounded-lg p-4 border-2 transition ${selectedServices.includes(service.id)
                                                                ? 'border-gold bg-gold/5'
                                                                : service.commissionPaid
                                                                    ? 'border-green-200 bg-green-50'
                                                                    : 'border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-3 flex-1">
                                                                {!service.commissionPaid && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedServices.includes(service.id)}
                                                                        onChange={() => toggleServiceSelection(service.id)}
                                                                        className="mt-1 w-5 h-5 text-gold rounded focus:ring-gold"
                                                                    />
                                                                )}

                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-lg">
                                                                            {service.service ? '💅' : '🎁'}
                                                                        </span>
                                                                        <h4 className="font-semibold text-charcoal">
                                                                            {service.service?.name || service.combo?.name}
                                                                        </h4>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                                        <p>👤 Cliente: <span className="font-semibold">{service.clientName}</span></p>
                                                                        {service.clientPhone && <p>📞 {service.clientPhone}</p>}
                                                                        <p>📅 {new Date(service.executedAt).toLocaleDateString('pt-BR')}</p>
                                                                        <p>⏰ {new Date(service.executedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                        <p>💳 {service.paymentMethod.replace('_', ' ')}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right ml-4">
                                                                <p className="text-sm text-gray-500">Valor Serviço</p>
                                                                <p className="text-lg font-bold text-charcoal">
                                                                    R$ {service.serviceValue.toFixed(2)}
                                                                </p>
                                                                <p className="text-sm font-semibold text-gold mt-1">
                                                                    Comissão: R$ {service.commissionValue.toFixed(2)}
                                                                </p>
                                                                {service.commissionPaid && (
                                                                    <span className="inline-block mt-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                                        ✅ Pago
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <div className="text-6xl mb-4">💰</div>
                            <p className="text-gray-500 text-lg">Nenhum serviço encontrado para este período</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}