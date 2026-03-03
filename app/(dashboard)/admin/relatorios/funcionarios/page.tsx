// app/(dashboard)/admin/relatorios/funcionarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign } from 'lucide-react'

interface StaffReport {
    staff: {
        id: string
        name: string
        photo: string | null
        commissionPercent: number
    }
    totalServices: number
    totalRevenue: number
    totalCommission: number
    commissionPaid: number
    commissionPending: number
    services: any[]
}

interface Totals {
    totalServices: number
    totalRevenue: number
    totalCommission: number
    commissionPaid: number
    commissionPending: number
}

export default function RelatoriosFuncionariosPage() {
    const [reports, setReports] = useState<StaffReport[]>([])
    const [totals, setTotals] = useState<Totals | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')
    const [selectedStaff, setSelectedStaff] = useState<string>('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        loadReports()
    }, [period, selectedStaff])

    async function loadReports() {
        try {
            setLoading(true)

            let url = `/api/staff/reports?period=${period}`

            if (selectedStaff) {
                url += `&staffId=${selectedStaff}`
            }

            if (period === 'custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`
            }

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setReports(data.data)
                setTotals(data.totals)
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
        } finally {
            setLoading(false)
        }
    }

    function exportToPDF() {
        alert('Função de exportação em desenvolvimento!')
        // TODO: Implementar exportação PDF
    }

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
                    <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios - Funcionários</h1>
                    <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua equipe</p>
                </div>
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    <Download size={20} />
                    Exportar PDF
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Período */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Período
                        </label>
                        <select
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        >
                            <option value="today">Hoje</option>
                            <option value="week">Esta Semana</option>
                            <option value="fortnight">Últimos 15 Dias</option>
                            <option value="month">Este Mês</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {/* Data Inicial (se personalizado) */}
                    {period === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    {/* Botão Gerar */}
                    {period === 'custom' && (
                        <div className="flex items-end">
                            <button
                                onClick={loadReports}
                                className="w-full bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700 transition"
                            >
                                Gerar Relatório
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Resumo Geral */}
            {totals && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-white/80" size={24} />
                            <p className="text-sm font-semibold opacity-90">Total de Serviços</p>
                        </div>
                        <p className="text-4xl font-bold">{totals.totalServices}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-white/80" size={24} />
                            <p className="text-sm font-semibold opacity-90">Faturamento Total</p>
                        </div>
                        <p className="text-4xl font-bold">R$ {totals.totalRevenue.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-white/80" size={24} />
                            <p className="text-sm font-semibold opacity-90">Total Comissões</p>
                        </div>
                        <p className="text-4xl font-bold">R$ {totals.totalCommission.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-white/80" size={24} />
                            <p className="text-sm font-semibold opacity-90">Pendente</p>
                        </div>
                        <p className="text-4xl font-bold">R$ {totals.commissionPending.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Relatórios por Funcionário */}
            <div className="space-y-6">
                {reports.length > 0 ? (
                    reports.map((report, index) => (
                        <div key={report.staff.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                            {/* Header do Funcionário */}
                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-white/50">
                                            #{index + 1}
                                        </div>
                                        {report.staff.photo ? (
                                            <img
                                                src={report.staff.photo}
                                                alt={report.staff.name}
                                                className="w-16 h-16 rounded-full object-cover border-4 border-white"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold border-4 border-white">
                                                {report.staff.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-bold">{report.staff.name}</h3>
                                            <p className="text-pink-100">
                                                Comissão: {report.staff.commissionPercent}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-pink-100">Total de Serviços</p>
                                        <p className="text-5xl font-bold">{report.totalServices}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Métricas */}
                            <div className="grid grid-cols-3 divide-x divide-gray-200">
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500 mb-2">Faturamento</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        R$ {report.totalRevenue.toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500 mb-2">Total Comissão</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        R$ {report.totalCommission.toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500 mb-2">Pendente</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        R$ {report.commissionPending.toFixed(2)}
                                    </p>
                                    {report.commissionPaid > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                            ✅ Pago: R$ {report.commissionPaid.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-500 text-lg">Nenhum serviço registrado no período selecionado</p>
                    </div>
                )}
            </div>
        </div>
    )
}