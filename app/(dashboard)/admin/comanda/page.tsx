// app/(dashboard)/admin/comanda/page.tsx
'use client'

import { useState, useEffect } from 'react'

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
    duration: number
}

interface Combo {
    id: string
    name: string
    discountPercent: number
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
    const [services, setServices] = useState<Service[]>([])
    const [combos, setCombos] = useState<Combo[]>([])
    const [todayServices, setTodayServices] = useState<StaffService[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const [formData, setFormData] = useState({
        staffId: '',
        serviceId: '',
        comboId: '',
        clientName: '',
        clientPhone: '',
        serviceValue: 0,
        paymentMethod: 'DINHEIRO',
        executedAt: new Date().toISOString().slice(0, 16),
        notes: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            // Carregar funcionários ativos
            const staffRes = await fetch('/api/staff?active=true')
            const staffData = await staffRes.json()
            if (staffData.success) setStaff(staffData.data)

            // Carregar serviços
            const servicesRes = await fetch('/api/services')
            const servicesData = await servicesRes.json()
            if (servicesData.success) setServices(servicesData.data)

            // Carregar combos
            const combosRes = await fetch('/api/combos')
            const combosData = await combosRes.json()
            if (combosData.success) setCombos(combosData.data)

            // Carregar serviços de hoje
            await loadTodayServices()
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    async function loadTodayServices() {
        try {
            const today = new Date().toISOString().split('T')[0]
            const res = await fetch(`/api/staff/services?date=${today}`)
            const data = await res.json()

            if (data.success) {
                setTodayServices(data.data)
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error)
        }
    }

    function handleServiceSelect(serviceId: string) {
        const service = services.find(s => s.id === serviceId)

        if (service) {
            setFormData(prev => ({
                ...prev,
                serviceId,
                comboId: '',
                serviceValue: service.price
            }))
        }
    }

    function handleComboSelect(comboId: string) {
        const combo = combos.find(c => c.id === comboId)

        if (combo) {
            // Buscar serviços do combo para calcular preço
            const comboServices = services.filter(s =>
                combo.services?.some((cs: any) => cs.serviceId === s.id)
            )

            const originalPrice = comboServices.reduce((sum, s) => sum + s.price, 0)
            const discountedPrice = originalPrice * (1 - combo.discountPercent / 100)

            setFormData(prev => ({
                ...prev,
                comboId,
                serviceId: '',
                serviceValue: discountedPrice
            }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.staffId || (!formData.serviceId && !formData.comboId)) {
            alert('Selecione funcionário e serviço/combo')
            return
        }

        if (!formData.clientName) {
            alert('Nome do cliente é obrigatório')
            return
        }

        try {
            const res = await fetch('/api/staff/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (data.success) {
                alert(data.message)
                setShowModal(false)
                setFormData({
                    staffId: '',
                    serviceId: '',
                    comboId: '',
                    clientName: '',
                    clientPhone: '',
                    serviceValue: 0,
                    paymentMethod: 'DINHEIRO',
                    executedAt: new Date().toISOString().slice(0, 16),
                    notes: ''
                })
                loadTodayServices()
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao registrar serviço')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja remover este registro?')) return

        try {
            const res = await fetch(`/api/staff/services?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                loadTodayServices()
            }
        } catch (error) {
            console.error('Erro:', error)
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📝 Comanda Diária</h1>
                    <p className="text-gray-600 mt-1">
                        📅 {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                    + Registrar Serviço
                </button>
            </div>

            {/* Resumo do Dia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <p className="text-blue-100 text-sm font-semibold mb-2">Total de Serviços</p>
                    <p className="text-4xl font-bold">{todayServices.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                    <p className="text-green-100 text-sm font-semibold mb-2">Faturamento</p>
                    <p className="text-4xl font-bold">
                        R$ {todayServices.reduce((sum, s) => sum + s.serviceValue, 0).toFixed(2)}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                    <p className="text-purple-100 text-sm font-semibold mb-2">Comissões</p>
                    <p className="text-4xl font-bold">
                        R$ {todayServices.reduce((sum, s) => sum + s.commissionValue, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Serviços Agrupados por Funcionário */}
            <div className="space-y-6">
                {staffGroups.length > 0 ? (
                    staffGroups.map((group: any) => (
                        <div key={group.staff.name} className="bg-white rounded-xl shadow-md overflow-hidden">
                            {/* Header do Funcionário */}
                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {group.staff.photo ? (
                                            <img
                                                src={group.staff.photo}
                                                alt={group.staff.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl font-bold">
                                                {group.staff.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg">{group.staff.name}</h3>
                                            <p className="text-sm text-pink-100">
                                                {group.services.length} {group.services.length === 1 ? 'serviço' : 'serviços'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-pink-100">Faturamento</p>
                                        <p className="text-2xl font-bold">R$ {group.totalValue.toFixed(2)}</p>
                                        <p className="text-xs text-pink-100">Comissão: R$ {group.totalCommission.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Serviços */}
                            <div className="divide-y divide-gray-200">
                                {group.services.map((service: StaffService) => (
                                    <div key={service.id} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">
                                                        {service.service ? '💅' : '🎁'}
                                                    </span>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {service.service?.name || service.combo?.name}
                                                    </h4>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(service.executedAt).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>👤 {service.clientName}</span>
                                                    {service.clientPhone && <span>📞 {service.clientPhone}</span>}
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
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
                                                <p className="text-xl font-bold text-gray-900">
                                                    R$ {service.serviceValue.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-green-600 font-semibold">
                                                    Comissão: R$ {service.commissionValue.toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                                                >
                                                    🗑️ Remover
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-500 text-lg">Nenhum serviço registrado hoje</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-pink-600 hover:underline"
                        >
                            Registrar primeiro serviço do dia
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Registrar Serviço */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-xl">
                            <h2 className="text-2xl font-bold">📝 Registrar Serviço</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Funcionário */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Funcionário *
                                </label>
                                <select
                                    required
                                    value={formData.staffId}
                                    onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} (Comissão: {s.commissionPercent}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Serviço ou Combo */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Serviço
                                    </label>
                                    <select
                                        value={formData.serviceId}
                                        onChange={e => handleServiceSelect(e.target.value)}
                                        disabled={!!formData.comboId}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none disabled:bg-gray-100"
                                    >
                                        <option value="">Selecione...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} - R$ {s.price.toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Combo
                                    </label>
                                    <select
                                        value={formData.comboId}
                                        onChange={e => handleComboSelect(e.target.value)}
                                        disabled={!!formData.serviceId}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none disabled:bg-gray-100"
                                    >
                                        <option value="">Selecione...</option>
                                        {combos.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.discountPercent}% OFF)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cliente */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                        placeholder="Nome do cliente"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientPhone}
                                        onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                        placeholder="(84) 99999-9999"
                                    />
                                </div>
                            </div>

                            {/* Valor e Pagamento */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Valor do Serviço *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.serviceValue}
                                        onChange={e => setFormData({ ...formData, serviceValue: Number(e.target.value) })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Forma de Pagamento *
                                    </label>
                                    <select
                                        required
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                    >
                                        <option value="DINHEIRO">💵 Dinheiro</option>
                                        <option value="CARTAO_DEBITO">💳 Cartão Débito</option>
                                        <option value="CARTAO_CREDITO">💳 Cartão Crédito</option>
                                        <option value="PIX">📱 PIX</option>
                                    </select>
                                </div>
                            </div>

                            {/* Data/Hora */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Data e Hora *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.executedAt}
                                    onChange={e => setFormData({ ...formData, executedAt: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Observações
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>

                            {/* Resumo da Comissão */}
                            {formData.staffId && formData.serviceValue > 0 && (
                                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">Valor do Serviço:</span>
                                        <span className="font-bold text-gray-900">
                                            R$ {formData.serviceValue.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-gray-700">
                                            Comissão ({staff.find(s => s.id === formData.staffId)?.commissionPercent}%):
                                        </span>
                                        <span className="font-bold text-green-600">
                                            R$ {(formData.serviceValue * (staff.find(s => s.id === formData.staffId)?.commissionPercent || 0) / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg"
                                >
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}