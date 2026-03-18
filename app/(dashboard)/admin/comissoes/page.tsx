// app/(dashboard)/admin/comissoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-beige gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                <p className="text-sm text-gray-500">Carregando comissões...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal">💰 Comissões Detalhadas</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">Gerencie os pagamentos de cada serviço executado</p>


                </motion.div>

                {/* Navegação */}
                <motion.div
                    className="mb-6 flex flex-col sm:flex-row sm:justify-end gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/admin"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >

                        <ArrowLeft size={20} />
                        Painel
                    </Link>
                    <Link
                        href="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        <Home size={20} />
                        Voltar ao início
                    </Link>
                </motion.div>


                {/* Filtros */}
                <motion.div
                    className="bg-white rounded-xl shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        <div className="flex items-end sm:items-end">
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
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-sm font-semibold opacity-90 mb-2">Comissões Pendentes</p>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">R$ {totalPending.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-sm font-semibold opacity-90 mb-2">Comissões Pagas</p>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">R$ {totalPaid.toFixed(2)}</p>
                    </div>

                    {selectedServices.length > 0 && (
                        <div className="bg-gradient-to-br from-gold to-gold-dark text-white p-6 rounded-xl shadow-lg">
                            <p className="text-sm font-semibold opacity-90 mb-2">Selecionado ({selectedServices.length})</p>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">R$ {selectedTotal.toFixed(2)}</p>
                            <button
                                onClick={markAsPaid}
                                className="mt-3 w-full bg-white text-gold px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Marcar como Pago
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Lista por Funcionário */}
                <div className="space-y-6 max-h-[70vh] sm:max-h-[80vh] lg:max-h-[90vh] overflow-y-auto p-4">
                    {staffCommissions.length > 0 ? (
                        staffCommissions.map((staff, index) => {
                            const isExpanded = expandedStaff.includes(staff.staffId)
                            const unpaidServices = staff.services.filter(s => !s.commissionPaid)

                            return (
                                <motion.div
                                    key={staff.staffId}
                                    className="bg-white rounded-xl shadow-md overflow-hidden max-h-[90vh] overflow-y-auto"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                                >
                                    <div
                                        className="bg-gradient-gold text-white p-4 sm:p-6 cursor-pointer"
                                        onClick={() => toggleStaffExpand(staff.staffId)}
                                    >
                                        <div className="flex flex-col gap-4">

                                            {/* TOPO */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">

                                                    {staff.staffPhoto ? (
                                                        <img
                                                            src={staff.staffPhoto}
                                                            alt={staff.staffName}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold-dark bg-opacity-20 flex items-center justify-center text-lg font-bold">
                                                            {staff.staffName.charAt(0)}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="font-bold text-base sm:text-xl">
                                                            {staff.staffName}
                                                        </h3>
                                                        <p className="text-xs sm:text-sm text-gold-light">
                                                            {staff.totalServices} serviços • {staff.commissionPercent}%
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Ícone */}
                                                <div>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* VALORES */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                                                <div>
                                                    <p className="text-xs text-gold-light">Total Comissão</p>
                                                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                                                        R$ {staff.totalCommission.toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between sm:justify-end gap-4 text-xs">
                                                    <span className="text-orange-200">
                                                        Pendente: R$ {staff.totalPending.toFixed(2)}
                                                    </span>
                                                    <span className="text-green-200">
                                                        Pago: R$ {staff.totalPaid.toFixed(2)}
                                                    </span>
                                                </div>

                                            </div>

                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 sm:p-6 bg-beige/30">

                                            {unpaidServices.length > 0 && (
                                                <button
                                                    onClick={() => selectAllFromStaff(staff.services)}
                                                    className="mb-4 text-sm sm:text-base text-gold hover:text-gold-dark font-semibold"
                                                >
                                                    ✓ Selecionar não pagos ({unpaidServices.length})
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
                                                        <div className="flex flex-col gap-3">

                                                            {/* TOPO */}
                                                            <div className="flex items-start justify-between gap-2">

                                                                <div className="flex items-start gap-3">
                                                                    {!service.commissionPaid && (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedServices.includes(service.id)}
                                                                            onChange={() => toggleServiceSelection(service.id)}
                                                                            className="mt-1 w-5 h-5 text-gold rounded"
                                                                        />
                                                                    )}

                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-lg">
                                                                                {service.service ? '💅' : '🎁'}
                                                                            </span>
                                                                            <h4 className="font-semibold text-charcoal text-sm sm:text-base">
                                                                                {service.service?.name || service.combo?.name}
                                                                            </h4>
                                                                        </div>

                                                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                                            👤 {service.clientName}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* STATUS */}
                                                                {service.commissionPaid && (
                                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                                                        Pago
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* INFO */}
                                                            <div className="text-xs sm:text-sm text-gray-600 flex flex-col gap-1">
                                                                {service.clientPhone && <p>📞 {service.clientPhone}</p>}
                                                                <p>
                                                                    📅 {new Date(service.executedAt).toLocaleDateString('pt-BR')} •{" "}
                                                                    {new Date(service.executedAt).toLocaleTimeString('pt-BR', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                                <p>💳 {service.paymentMethod.replace('_', ' ')}</p>
                                                            </div>

                                                            {/* VALORES */}
                                                            <div className="flex justify-between items-center mt-2">

                                                                <div>
                                                                    <p className="text-xs text-gray-500">Serviço</p>
                                                                    <p className="font-bold text-charcoal text-sm sm:text-base">
                                                                        R$ {service.serviceValue.toFixed(2)}
                                                                    </p>
                                                                </div>

                                                                <div className="text-right">
                                                                    <p className="text-xs text-gray-500">Comissão</p>
                                                                    <p className="font-bold text-gold text-sm sm:text-base">
                                                                        R$ {service.commissionValue.toFixed(2)}
                                                                    </p>
                                                                </div>

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
                            <p className="text-gray-500 text-base sm:text-lg">Nenhum serviço encontrado para este período</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}