'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Filter, UserPlus } from 'lucide-react'
import ClientDetailsModal from '@/components/admin/ClientDetailsModal'

interface Client {
    id: string
    name: string
    email: string
    phone: string
    birthDate: string | null
    image: string | null
    createdAt: string
    stats: {
        totalAppointments: number
        totalSpent: number
        avgTicket: number
        lastAppointment: string | null
        daysSinceLastAppointment: number | null
        favoriteService: string | null
        attendanceRate: number
    }
    segments: {
        isVIP: boolean
        isNew: boolean
        isInactive: boolean
        isBirthdayThisMonth: boolean
    }
}

type SortOption = 'name-asc' | 'name-desc' | 'visits-asc' | 'visits-desc' | 'spent-asc' | 'spent-desc' | 'recent-asc' | 'recent-desc'

export default function ClientesPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('name-asc')
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    // Filtros avançados
    const [filterByVisits, setFilterByVisits] = useState<'all' | 'new' | 'regular' | 'vip'>('all')
    const [filterByStatus, setFilterByStatus] = useState<'all' | 'active' | 'inactive'>('all')

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/clients')
            const data = await res.json()

            if (data.success) {
                setClients(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = useMemo(() => {
        const filtered = clients.filter(client => {
            // Busca por nome, email ou telefone
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                const matchName = client.name.toLowerCase().includes(search)
                const matchEmail = client.email.toLowerCase().includes(search)
                const matchPhone = client.phone.includes(search)

                if (!matchName && !matchEmail && !matchPhone) {
                    return false
                }
            }

            // Filtro por segmento
            if (filterByVisits !== 'all') {
                if (filterByVisits === 'new' && !client.segments.isNew) return false
                if (filterByVisits === 'regular' && (client.segments.isNew || client.segments.isVIP)) return false
                if (filterByVisits === 'vip' && !client.segments.isVIP) return false
            }

            // Filtro por status de atividade
            if (filterByStatus !== 'all') {
                if (filterByStatus === 'active' && client.segments.isInactive) return false
                if (filterByStatus === 'inactive' && !client.segments.isInactive) return false
            }

            return true
        })

        // Ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'visits-asc':
                    return a.stats.totalAppointments - b.stats.totalAppointments
                case 'visits-desc':
                    return b.stats.totalAppointments - a.stats.totalAppointments
                case 'spent-asc':
                    return a.stats.totalSpent - b.stats.totalSpent
                case 'spent-desc':
                    return b.stats.totalSpent - a.stats.totalSpent
                case 'recent-asc':
                    return new Date(a.stats.lastAppointment || 0).getTime() - new Date(b.stats.lastAppointment || 0).getTime()
                case 'recent-desc':
                    return new Date(b.stats.lastAppointment || 0).getTime() - new Date(a.stats.lastAppointment || 0).getTime()
                default:
                    return 0
            }
        })

        return filtered
    }, [clients, searchTerm, sortBy, filterByVisits, filterByStatus])

    const stats = useMemo(() => ({
        total: clients.length,
        new: clients.filter(c => c.segments.isNew).length,
        regular: clients.filter(c => !c.segments.isNew && !c.segments.isVIP).length,
        vip: clients.filter(c => c.segments.isVIP).length,
        totalRevenue: clients.reduce((sum, c) => sum + c.stats.totalSpent, 0),
        averageSpent: clients.length > 0
            ? clients.reduce((sum, c) => sum + c.stats.totalSpent, 0) / clients.length
            : 0
    }), [clients])

    const getClientBadge = (client: Client) => {
        if (client.segments.isVIP) return { label: '👑 VIP', color: 'bg-purple-100 text-purple-700' }
        if (client.segments.isNew) return { label: '🆕 Novo', color: 'bg-blue-100 text-blue-700' }
        return { label: '⭐ Regular', color: 'bg-green-100 text-green-700' }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setFilterByVisits('all')
        setFilterByStatus('all')
        setSortBy('name-asc')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando clientes...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">👥 Clientes</h1>
                        <p className="text-gray-600">Gerencie todos os clientes do salão</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                        <UserPlus size={20} />
                        Novo Cliente
                    </button>
                </div>

                {/* Estatísticas */}
                <div className="grid md:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Total de Clientes</p>
                        <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Novos</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Regulares</p>
                        <p className="text-3xl font-bold text-green-600">{stats.regular}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">VIP</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.vip}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Receita Total</p>
                        <p className="text-2xl font-bold text-gold">R$ {stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow">
                        <p className="text-gray-600 text-sm mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-gold">R$ {stats.averageSpent.toFixed(2)}</p>
                    </div>
                </div>

                {/* Barra de Busca e Filtros */}
                <div className="bg-white rounded-xl p-4 shadow space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nome, email ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${showFilters ? 'bg-gold text-white border-gold' : 'hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={20} />
                            Filtros
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                        >
                            <option value="name-asc">Nome A-Z</option>
                            <option value="name-desc">Nome Z-A</option>
                            <option value="visits-desc">Mais Visitas</option>
                            <option value="visits-asc">Menos Visitas</option>
                            <option value="spent-desc">Maior Gasto</option>
                            <option value="spent-asc">Menor Gasto</option>
                            <option value="recent-desc">Mais Recente</option>
                            <option value="recent-asc">Menos Recente</option>
                        </select>
                    </div>

                    {/* Filtros Avançados */}
                    {showFilters && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-charcoal">Filtros Avançados</h3>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                                >
                                    <X size={16} />
                                    Limpar Todos
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de Cliente
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'all', label: 'Todos' },
                                            { value: 'new', label: '🆕 Novos' },
                                            { value: 'regular', label: '⭐ Regulares' },
                                            { value: 'vip', label: '👑 VIP' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setFilterByVisits(option.value as typeof filterByVisits)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterByVisits === option.value
                                                        ? 'bg-gold text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status de Atividade
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'all', label: 'Todos' },
                                            { value: 'active', label: '✅ Ativos' },
                                            { value: 'inactive', label: '💤 Inativos' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setFilterByStatus(option.value as typeof filterByStatus)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterByStatus === option.value
                                                        ? 'bg-gold text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lista de Clientes */}
                {filteredClients.length > 0 ? (
                    <div className="grid gap-4">
                        <p className="text-gray-600">
                            {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                        </p>

                        {filteredClients.map((client) => {
                            const badge = getClientBadge(client)
                            return (
                                <div
                                    key={client.id}
                                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
                                    onClick={() => setSelectedClientId(client.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gold to-yellow-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Informações */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-charcoal">{client.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <div className="grid md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 mb-1">Contato</p>
                                                    <p className="font-semibold text-charcoal">{client.phone}</p>
                                                    <p className="text-gray-600 text-xs">{client.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">Total de Visitas</p>
                                                    <p className="font-semibold text-charcoal">{client.stats.totalAppointments} agendamentos</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">Total Gasto</p>
                                                    <p className="font-semibold text-gold">R$ {client.stats.totalSpent.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">Última Visita</p>
                                                    <p className="font-semibold text-charcoal">
                                                        {client.stats.lastAppointment
                                                            ? new Date(client.stats.lastAppointment).toLocaleDateString('pt-BR')
                                                            : 'Nunca'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ações Rápidas */}
                                        <div className="flex flex-col gap-2">
                                            <button className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold">
                                                Ver Detalhes
                                            </button>
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                                                Novo Agendamento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-6xl mb-4">👥</p>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? `Nenhum resultado para "${searchTerm}"`
                                : 'Não há clientes cadastrados ainda'
                            }
                        </p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-gold hover:text-yellow-600 font-semibold"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .border-gold { border-color: #D4AF37; }
                .ring-gold { --tw-ring-color: #D4AF37; }
                .hover\\:text-gold:hover { color: #D4AF37; }
                .hover\\:bg-gold:hover { background-color: #D4AF37; }
                .focus\\:ring-gold:focus { --tw-ring-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
                .bg-charcoal { background-color: #2C2C2C; }
                .bg-beige { background-color: #F5F5DC; }
            `}</style>

            {selectedClientId && (
                <ClientDetailsModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                />
            )}
        </div>
    )
}