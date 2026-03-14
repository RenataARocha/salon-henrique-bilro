// app/(dashboard)/admin/comanda/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Home, X } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Staff {
    id: string
    name: string
    photo: string | null
    commissionPercent: number
}

interface Service {
    id: string
    name: string
    price: number
}

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    user: {
        name: string
        phone: string | null
    }
    service: {
        id: string
        name: string
        price: number
    } | null
    combo: {
        id: string
        name: string
    } | null
    finalPrice: number
    paymentMethod: string | null
}

interface StaffService {
    id: string
    clientName: string
    clientPhone: string | null
    serviceValue: number
    commissionValue: number
    executedAt: string
    paymentMethod: string
    notes: string | null
    staff: {
        id: string
        name: string
        photo: string | null
    }
    service: {
        name: string
    } | null
    combo: {
        name: string
    } | null
}

export default function ComandaPage() {
    const [staff, setStaff] = useState<Staff[]>([])
    const [todayServices, setTodayServices] = useState<StaffService[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingService, setEditingService] = useState<StaffService | null>(null)

    // Estados do modal
    const [modalStaffId, setModalStaffId] = useState('')
    const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])
    const [loadingAppointments, setLoadingAppointments] = useState(false)

    // Filtros da página
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedStaffId, setSelectedStaffId] = useState<string>('')
    const [showAllDates, setShowAllDates] = useState(false) // ✅ NOVO

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        loadFilteredServices()
    }, [selectedDate, selectedStaffId, showAllDates]) // ✅ ADICIONAR showAllDates

    async function loadData() {
        try {
            const staffRes = await fetch('/api/staff?active=true')
            const staffData = await staffRes.json()
            if (staffData.success) setStaff(staffData.data)

            await loadFilteredServices()
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    async function loadFilteredServices() {
        try {
            let url = '/api/staff/services?'

            // ✅ SE "TODOS" ESTIVER MARCADO, NÃO FILTRAR POR DATA
            if (!showAllDates) {
                url += `date=${selectedDate}&`
            }

            if (selectedStaffId) {
                url += `staffId=${selectedStaffId}`
            }

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                // ✅ ORDENAR DO MAIS RECENTE PARA O MAIS ANTIGO
                const sorted = data.data.sort((a: any, b: any) =>
                    new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
                )
                setTodayServices(sorted)
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error)
        }
    }

    function openAddModal() {
        setEditingService(null)
        setModalStaffId('')
        setModalDate(new Date().toISOString().split('T')[0])
        setAppointments([])
        setSelectedAppointments([])
        setShowModal(true)
    }

    function openEditModal(service: StaffService) {
        setEditingService(service)
        setShowModal(true)
    }

    async function loadAppointments() {
        if (!modalStaffId || !modalDate) {
            alert('Selecione funcionário e data')
            return
        }

        try {
            setLoadingAppointments(true)

            // Buscar agendamentos CONCLUÍDOS daquele dia
            const url = `/api/appointments?date=${modalDate}&status=COMPLETED`
            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                // ✅ BUSCAR IDS JÁ REGISTRADOS PARA ESTE FUNCIONÁRIO
                const registeredRes = await fetch(`/api/staff/services?staffId=${modalStaffId}&date=${modalDate}`)
                const registeredData = await registeredRes.json()

                const registeredAppointmentIds = new Set(
                    registeredData.data
                        ?.filter((s: any) => s.appointmentId)
                        .map((s: any) => s.appointmentId) || []
                )

                // ✅ FILTRAR APENAS OS NÃO REGISTRADOS
                const unregistered = (data.data || []).filter(
                    (apt: Appointment) => !registeredAppointmentIds.has(apt.id)
                )

                setAppointments(unregistered)

                if (unregistered.length === 0 && data.data.length > 0) {
                    alert(`ℹ️ Todos os ${data.data.length} agendamentos concluídos desta data já foram registrados para este funcionário!`)
                }
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error)
        } finally {
            setLoadingAppointments(false)
        }
    }

    function toggleAppointment(appointmentId: string) {
        setSelectedAppointments(prev =>
            prev.includes(appointmentId)
                ? prev.filter(id => id !== appointmentId)
                : [...prev, appointmentId]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (editingService) {
            // Modo edição - manter lógica antiga
            return
        }

        if (selectedAppointments.length === 0) {
            alert('Selecione pelo menos um agendamento')
            return
        }

        const selectedStaff = staff.find(s => s.id === modalStaffId)
        if (!selectedStaff) return

        try {
            // Registrar cada agendamento selecionado como serviço executado
            for (const appointmentId of selectedAppointments) {
                const appointment = appointments.find(a => a.id === appointmentId)
                if (!appointment) continue

                const serviceValue = appointment.finalPrice || appointment.service?.price || 0
                const commissionValue = serviceValue * (selectedStaff.commissionPercent / 100)

                // ✅ CORRIGIR FORMATO DA DATA
                const dateStr = new Date(appointment.date).toISOString().split('T')[0]
                const executedAtStr = `${dateStr}T${appointment.time}:00`

                // ✅ NORMALIZAR PAYMENT METHOD (remover "_DE_")
                let paymentMethod = appointment.paymentMethod || 'DINHEIRO'
                paymentMethod = paymentMethod.replace('_DE_', '_')

                // ✅ Criar objeto base
                const data: any = {
                    staffId: modalStaffId,
                    appointmentId: appointment.id,
                    clientName: appointment.user.name,
                    clientPhone: appointment.user.phone?.replace(/\D/g, '') || '',
                    serviceValue,
                    paymentMethod,
                    executedAt: executedAtStr,
                    notes: `Agendamento #${appointment.id.slice(0, 8)}`
                }

                // ✅ Adicionar serviceId OU comboId (não ambos)
                if (appointment.combo) {
                    data.comboId = appointment.combo.id
                } else if (appointment.service) {
                    data.serviceId = appointment.service.id
                }

                const res = await fetch('/api/staff/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })

                const result = await res.json()
                if (!result.success) {
                    console.error('Erro ao registrar:', result.error)
                    alert(`Erro ao registrar: ${result.error}`)
                }
            }

            alert(`${selectedAppointments.length} serviço(s) registrado(s) com sucesso!`)
            setShowModal(false)

            // ✅ Atualizar filtro de visualização para a data registrada
            setSelectedDate(modalDate)
            setSelectedStaffId(modalStaffId)
            setShowAllDates(false) // ✅ DESMARCAR "TODOS"

            // Recarregar serviços
            loadFilteredServices()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao registrar serviços')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('⚠️ Tem certeza que deseja remover este registro?')) return

        try {
            const res = await fetch(`/api/staff/services?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Registro removido com sucesso!')
                loadFilteredServices()
            } else {
                alert('❌ Erro ao remover registro')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('❌ Erro ao remover registro')
        }
    }

    // Agrupar por funcionário
    const groupedByStaff = todayServices.reduce((acc: any, service) => {
        const staffName = service.staff.name
        if (!acc[staffName]) {
            acc[staffName] = {
                staff: service.staff,
                services: [],
                totalValue: 0,
                totalCommission: 0
            }
        }
        acc[staffName].services.push(service)
        acc[staffName].totalValue += service.serviceValue
        acc[staffName].totalCommission += service.commissionValue
        return acc
    }, {})

    const staffGroups = Object.values(groupedByStaff)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-beige">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4 ">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    className="flex justify-between items-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div>
                        <h1 className="text-4xl font-bold text-charcoal">📝 Comanda Diária</h1>
                        <p className="text-gray-600 mt-2">
                            {showAllDates && selectedStaffId ? (
                                `📋 Todos os serviços de ${staff.find(s => s.id === selectedStaffId)?.name}`
                            ) : (
                                `📅 ${new Date(selectedDate).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}`
                            )}
                        </p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all hover:scale-105"
                    >
                        + Registrar Serviço
                    </button>

                </motion.div>


                {/* Navegação */}
                <motion.div
                    className="mb-6 justify-end flex gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >

                        <ArrowLeft size={20} />
                        Painel
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
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
                    <h2 className="text-lg font-bold text-charcoal mb-4">Filtros de Visualização</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Data
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => {
                                    setSelectedDate(e.target.value)
                                    setShowAllDates(false) // ✅ DESMARCAR "TODOS"
                                }}
                                disabled={showAllDates} // ✅ DESABILITAR SE "TODOS" MARCADO
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Funcionário (opcional)
                            </label>
                            <select
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                            >
                                <option value="">Todos</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ✅ CHECKBOX "TODOS OS SERVIÇOS" */}
                    {selectedStaffId && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-gold/10 rounded-lg">
                            <input
                                type="checkbox"
                                id="showAllDates"
                                checked={showAllDates}
                                onChange={e => setShowAllDates(e.target.checked)}
                                className="w-5 h-5 text-gold rounded focus:ring-gold"
                            />
                            <label htmlFor="showAllDates" className="text-sm font-semibold text-charcoal cursor-pointer">
                                📋 Mostrar todos os serviços deste funcionário (todas as datas)
                            </label>
                        </div>
                    )}
                </motion.div>

                {/* Resumo do Dia */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 "
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="bg-gradient-to-br from-gold to-gold-dark text-white p-6 rounded-xl shadow-lg">
                        <p className="text-gold-light text-sm font-semibold mb-2">Total de Serviços</p>
                        <p className="text-4xl font-bold">{todayServices.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-green-100 text-sm font-semibold mb-2">Faturamento</p>
                        <p className="text-4xl font-bold">
                            R$ {todayServices.reduce((sum, s) => sum + s.serviceValue, 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-charcoal to-gray-700 text-white p-6 rounded-xl shadow-lg">
                        <p className="text-gray-300 text-sm font-semibold mb-2">Comissões</p>
                        <p className="text-4xl font-bold">
                            R$ {todayServices.reduce((sum, s) => sum + s.commissionValue, 0).toFixed(2)}
                        </p>
                    </div>
                </motion.div>

                {/* Serviços Agrupados por Funcionário */}
                <div className="space-y-6 max-h-[90vh] overflow-y-auto p-4">
                    {staffGroups.length > 0 ? (
                        staffGroups.map((group: any, index) => (
                            <motion.div
                                key={group.staff.name}
                                className="bg-white rounded-xl shadow-md overflow-hidden"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                            >
                                {/* Header do Funcionário */}
                                <div className="bg-gradient-gold text-white p-4 ">
                                    <div className="flex items-center justify-between ">
                                        <div className="flex items-center gap-3">
                                            {group.staff.photo ? (
                                                <img
                                                    src={group.staff.photo}
                                                    alt={group.staff.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full  bg-gold-dark bg-opacity-20 flex items-center justify-center text-xl font-bold">
                                                    {group.staff.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-lg">{group.staff.name}</h3>
                                                <p className="text-sm text-gold-light">
                                                    {group.services.length} {group.services.length === 1 ? 'serviço' : 'serviços'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gold-light">Faturamento</p>
                                            <p className="text-2xl font-bold">R$ {group.totalValue.toFixed(2)}</p>
                                            <p className="text-xs text-gold-light">Comissão: R$ {group.totalCommission.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de Serviços */}
                                <div className="divide-y divide-gray-200 ">
                                    {group.services.map((service: StaffService) => (
                                        <div key={service.id} className="p-4 hover:bg-beige/50 transition">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">
                                                            {service.service ? '💅' : '🎁'}
                                                        </span>
                                                        <h4 className="font-semibold text-charcoal">
                                                            {service.service?.name || service.combo?.name}
                                                        </h4>
                                                        <span className="text-xs text-gray-500">
                                                            📅 {new Date(service.executedAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            ⏰ {new Date(service.executedAt).toLocaleTimeString('pt-BR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>👤 {service.clientName}</span>
                                                        {service.clientPhone && <span>📞 {service.clientPhone}</span>}
                                                        <span className="px-2 py-1 bg-gold/20 text-gold rounded-full text-xs">
                                                            {service.paymentMethod.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    {service.notes && (
                                                        <p className="text-sm text-gray-500 mt-2 italic">
                                                            💬 {service.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-xl font-bold text-charcoal">
                                                        R$ {service.serviceValue.toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gold font-semibold">
                                                        Comissão: R$ {service.commissionValue.toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(service.id)
                                                        }}
                                                        className="mt-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 hover:shadow-md"
                                                    >
                                                        🗑️ Remover
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center ">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-gray-500 text-lg">Nenhum serviço registrado{showAllDates ? '' : ' nesta data'}</p>
                            <button
                                onClick={openAddModal}
                                className="mt-4 text-gold hover:underline font-semibold"
                            >
                                Registrar primeiro serviço
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Registrar Serviço */}
                {showModal && !editingService && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="sticky top-0 bg-gradient-gold text-white p-6 rounded-t-xl flex justify-between items-center">
                                <h2 className="text-2xl font-bold">📝 Registrar Serviços Executados</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white hover:text-gray-200 transition"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Passo 1: Selecionar Funcionário e Data */}
                                <div className="bg-gold/10 border-2 border-gold rounded-lg p-4">
                                    <h3 className="font-bold text-charcoal mb-4">1️⃣ Selecione o Funcionário e a Data</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                                Funcionário *
                                            </label>
                                            <select
                                                required
                                                value={modalStaffId}
                                                onChange={e => setModalStaffId(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                            >
                                                <option value="">Selecione...</option>
                                                {staff.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} (Comissão: {s.commissionPercent}%)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                                Data *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={modalDate}
                                                onChange={e => setModalDate(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadAppointments}
                                        disabled={!modalStaffId || !modalDate || loadingAppointments}
                                        className="w-full bg-charcoal text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingAppointments ? '⏳ Buscando...' : '🔍 Buscar Agendamentos Concluídos'}
                                    </button>
                                </div>

                                {/* Passo 2: Selecionar Agendamentos */}
                                {appointments.length > 0 && (
                                    <div className="bg-beige/50 border-2 border-gray-300 rounded-lg p-4">
                                        <h3 className="font-bold text-charcoal mb-4">
                                            2️⃣ Selecione os Agendamentos Concluídos ({appointments.length} encontrados)
                                        </h3>

                                        <div className="space-y-3 max-h-96 overflow-y-auto ">
                                            {appointments.map(apt => (
                                                <label
                                                    key={apt.id}
                                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${selectedAppointments.includes(apt.id)
                                                        ? 'bg-gold/20 border-gold'
                                                        : 'bg-white border-gray-200 hover:border-gold/50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAppointments.includes(apt.id)}
                                                        onChange={() => toggleAppointment(apt.id)}
                                                        className="mt-1 w-5 h-5 text-gold rounded focus:ring-gold"
                                                    />

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg">{apt.service ? '💅' : '🎁'}</span>
                                                            <h4 className="font-semibold text-charcoal">
                                                                {apt.service?.name || apt.combo?.name || 'Serviço'}
                                                            </h4>
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                {apt.time}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                            <p>👤 Cliente: <span className="font-semibold">{apt.user.name}</span></p>
                                                            <p>💰 Valor: <span className="font-semibold text-gold">R$ {(apt.finalPrice || apt.service?.price || 0).toFixed(2)}</span></p>
                                                            {apt.user.phone && <p>📞 {apt.user.phone}</p>}
                                                            {apt.paymentMethod && (
                                                                <p>💳 {apt.paymentMethod.replace('_', ' ')}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {appointments.length === 0 && modalStaffId && modalDate && !loadingAppointments && (
                                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
                                        <p className="text-orange-700 font-semibold">
                                            ⚠️ Nenhum agendamento concluído encontrado para esta data
                                        </p>
                                        <p className="text-sm text-orange-600 mt-2">
                                            Os agendamentos precisam estar com status &quot;CONCLUÍDO&quot; para aparecerem aqui.
                                        </p>
                                        <p className="text-sm text-orange-600 mt-1">
                                            Vá em <strong>Agendamentos</strong> e marque os serviços realizados como <strong>🎉 Concluído</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* Resumo */}
                                {selectedAppointments.length > 0 && (
                                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                                        <h3 className="font-bold text-green-800 mb-2">
                                            ✅ {selectedAppointments.length} serviço(s) selecionado(s)
                                        </h3>
                                        <p className="text-sm text-green-700">
                                            Total a registrar: R$ {appointments
                                                .filter(a => selectedAppointments.includes(a.id))
                                                .reduce((sum, a) => sum + (a.finalPrice || a.service?.price || 0), 0)
                                                .toFixed(2)}
                                        </p>
                                        <p className="text-sm text-green-700">
                                            Comissão estimada: R$ {appointments
                                                .filter(a => selectedAppointments.includes(a.id))
                                                .reduce((sum, a) => {
                                                    const value = a.finalPrice || a.service?.price || 0
                                                    const commission = value * ((staff.find(s => s.id === modalStaffId)?.commissionPercent || 0) / 100)
                                                    return sum + commission
                                                }, 0)
                                                .toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-charcoal rounded-lg font-semibold hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={selectedAppointments.length === 0}
                                        className="flex-1 px-6 py-3 bg-gradient-gold text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Registrar {selectedAppointments.length > 0 ? `(${selectedAppointments.length})` : ''}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}