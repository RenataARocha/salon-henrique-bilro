// src/components/admin/SearchAndFilters.tsx

import { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar, DollarSign, Clock } from 'lucide-react'

interface Service {
    id: string
    name: string
}

interface SearchAndFiltersProps {
    onSearch: (filters: FilterParams) => void
    services: Service[]
}

export interface FilterParams {
    searchTerm: string
    services: string[]
    statuses: string[]
    dateRange: {
        start: string | null
        end: string | null
        preset: string
    }
    timeOfDay: string[]
    paymentMethods: string[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pendente', color: 'orange' },
    { value: 'CONFIRMED', label: 'Confirmado', color: 'blue' },
    { value: 'COMPLETED', label: 'Concluído', color: 'green' },
    { value: 'CANCELLED', label: 'Cancelado', color: 'red' },
    { value: 'NO_SHOW', label: 'Não Compareceu', color: 'gray' }
]

const TIME_OF_DAY_OPTIONS = [
    { value: 'morning', label: 'Manhã (6h-12h)' },
    { value: 'afternoon', label: 'Tarde (12h-18h)' },
    { value: 'evening', label: 'Noite (18h-23h)' }
]

const PAYMENT_OPTIONS = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CREDIT', label: 'Cartão de Crédito' },
    { value: 'DEBIT', label: 'Cartão de Débito' },
    { value: 'CASH', label: 'Dinheiro' }
]

const DATE_PRESETS = [
    { value: 'all', label: 'Todas' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'custom', label: 'Personalizado' }
]

const SORT_OPTIONS = [
    { value: 'date-desc', label: 'Mais Recentes' },
    { value: 'date-asc', label: 'Mais Antigas' },
    { value: 'price-desc', label: 'Maior Valor' },
    { value: 'price-asc', label: 'Menor Valor' },
    { value: 'name-asc', label: 'Nome (A-Z)' },
    { value: 'name-desc', label: 'Nome (Z-A)' }
]

export default function SearchAndFilters({ onSearch, services }: SearchAndFiltersProps) {
    const [showFilters, setShowFilters] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [datePreset, setDatePreset] = useState('all')
    const [customDateStart, setCustomDateStart] = useState('')
    const [customDateEnd, setCustomDateEnd] = useState('')
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string[]>([])
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
    const [sortOption, setSortOption] = useState('date-desc')

    // Debounce para a busca
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const applyFilters = () => {
        const [sortBy, sortOrder] = sortOption.split('-')

        const filters: FilterParams = {
            searchTerm,
            services: selectedServices,
            statuses: selectedStatuses,
            dateRange: {
                start: datePreset === 'custom' ? customDateStart : null,
                end: datePreset === 'custom' ? customDateEnd : null,
                preset: datePreset
            },
            timeOfDay: selectedTimeOfDay,
            paymentMethods: selectedPaymentMethods,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc'
        }

        onSearch(filters)
    }

    const clearAllFilters = () => {
        setSearchTerm('')
        setSelectedServices([])
        setSelectedStatuses([])
        setDatePreset('all')
        setCustomDateStart('')
        setCustomDateEnd('')
        setSelectedTimeOfDay([])
        setSelectedPaymentMethods([])
        setSortOption('date-desc')

        setTimeout(() => {
            onSearch({
                searchTerm: '',
                services: [],
                statuses: [],
                dateRange: { start: null, end: null, preset: 'all' },
                timeOfDay: [],
                paymentMethods: [],
                sortBy: 'date',
                sortOrder: 'desc'
            })
        }, 100)
    }

    const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
        if (array.includes(item)) {
            setArray(array.filter(i => i !== item))
        } else {
            setArray([...array, item])
        }
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (selectedServices.length > 0) count++
        if (selectedStatuses.length > 0) count++
        if (datePreset !== 'all') count++
        if (selectedTimeOfDay.length > 0) count++
        if (selectedPaymentMethods.length > 0) count++
        return count
    }

    const activeFiltersCount = getActiveFiltersCount()

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Barra de Busca Principal */}
            <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, telefone, email ou ID..."
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors relative ${showFilters ? 'bg-gold text-white border-gold' : 'hover:bg-gray-50'
                        }`}
                >
                    <Filter size={20} />
                    Filtros
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                <select
                    value={sortOption}
                    onChange={(e) => {
                        setSortOption(e.target.value)
                        setTimeout(applyFilters, 100)
                    }}
                    className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                >
                    {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Painel de Filtros Avançados */}
            {showFilters && (
                <div className="border-t pt-4 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">Filtros Avançados</h3>
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={16} />
                            Limpar Tudo
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Filtro de Serviços */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Serviços
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedServices.includes(service.id)}
                                            onChange={() => toggleArrayItem(selectedServices, setSelectedServices, service.id)}
                                            className="rounded text-gold focus:ring-gold"
                                        />
                                        <span className="text-sm">{service.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Filtro de Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <div className="space-y-2">
                                {STATUS_OPTIONS.map(status => (
                                    <label key={status.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(status.value)}
                                            onChange={() => toggleArrayItem(selectedStatuses, setSelectedStatuses, status.value)}
                                            className="rounded text-gold focus:ring-gold"
                                        />
                                        <span className={`w-2 h-2 rounded-full bg-${status.color}-500`}></span>
                                        <span className="text-sm">{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Filtro de Período do Dia */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={16} className="inline mr-1" />
                                Período do Dia
                            </label>
                            <div className="space-y-2">
                                {TIME_OF_DAY_OPTIONS.map(time => (
                                    <label key={time.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedTimeOfDay.includes(time.value)}
                                            onChange={() => toggleArrayItem(selectedTimeOfDay, setSelectedTimeOfDay, time.value)}
                                            className="rounded text-gold focus:ring-gold"
                                        />
                                        <span className="text-sm">{time.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filtro de Data */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            Período
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => {
                                        setDatePreset(preset.value)
                                        setTimeout(applyFilters, 100)
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${datePreset === preset.value
                                        ? 'bg-gold text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {datePreset === 'custom' && (
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={customDateStart}
                                        onChange={(e) => setCustomDateStart(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={customDateEnd}
                                        onChange={(e) => setCustomDateEnd(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filtro de Pagamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign size={16} className="inline mr-1" />
                            Forma de Pagamento
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PAYMENT_OPTIONS.map(payment => (
                                <button
                                    key={payment.value}
                                    onClick={() => {
                                        toggleArrayItem(selectedPaymentMethods, setSelectedPaymentMethods, payment.value)
                                        setTimeout(applyFilters, 100)
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedPaymentMethods.includes(payment.value)
                                        ? 'bg-gold text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    {payment.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botão Aplicar */}
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            onClick={applyFilters}
                            className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold-dark transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}