'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Calendar, Clock, Users, Award, Download, Filter } from 'lucide-react'
import { exportReportToCSV, exportToPDF } from '@/lib/exportUtils'

interface ReportData {
    revenue: {
        daily: Array<{ date: string; value: number; appointments: number }>
        weekly: Array<{ week: string; value: number; appointments: number }>
        monthly: Array<{ month: string; value: number; appointments: number }>
        total: number
        growth: number
    }
    services: Array<{
        name: string
        count: number
        revenue: number
        percentage: number
    }>
    peakHours: Array<{
        hour: string
        count: number
        occupancy: number
    }>
    cancellations: {
        rate: number
        total: number
        byReason: Array<{
            reason: string
            count: number
        }>
    }
    topClients: Array<{
        name: string
        totalSpent: number
        visits: number
    }>
    summary: {
        totalRevenue: number
        totalAppointments: number
        avgTicket: number
        completionRate: number
        newClients: number
    }
}

const COLORS = ['#D4AF37', '#FFD700', '#DAA520', '#B8860B', '#8B7355', '#CD853F', '#DEB887', '#F5DEB3']

export default function RelatoriosPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchReports()
    }, [dateRange, period])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const res = await fetch(
                `/api/admin/reports?start=${dateRange.start}&end=${dateRange.end}&period=${period}`
            )
            const response = await res.json()

            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            console.error('Erro ao buscar relatórios:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportToPDFHandler = () => {
        if (data) {
            exportToPDF(data)
        }
    }

    const exportToExcelHandler = () => {
        if (data) {
            exportReportToCSV(data)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando relatórios...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">📊 Relatórios</h1>
                        <p className="text-gray-600">Análise completa do desempenho do salão</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportToPDFHandler}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                            <Download size={20} />
                            PDF
                        </button>
                        <button
                            onClick={exportToExcelHandler}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            <Download size={20} />
                            Excel/CSV
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl p-6 shadow">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gold" />
                            <span className="font-semibold text-charcoal">Filtros:</span>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                            />
                            <span className="flex items-center px-2">até</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                            />
                        </div>

                        <div className="flex gap-2">
                            {[
                                { value: 'daily', label: '📅 Diário' },
                                { value: 'weekly', label: '📆 Semanal' },
                                { value: 'monthly', label: '🗓️ Mensal' }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value as any)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${period === opt.value
                                            ? 'bg-gold text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid md:grid-cols-5 gap-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
                        <DollarSign className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Receita Total</p>
                        <p className="text-3xl font-bold">R$ {data.summary.totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-white/70 mt-2">
                            {data.revenue.growth > 0 ? '📈' : '📉'} {Math.abs(data.revenue.growth).toFixed(1)}% vs período anterior
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
                        <Calendar className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Agendamentos</p>
                        <p className="text-3xl font-bold">{data.summary.totalAppointments}</p>
                        <p className="text-sm text-white/70 mt-2">Total no período</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
                        <TrendingUp className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Ticket Médio</p>
                        <p className="text-3xl font-bold">R$ {data.summary.avgTicket.toFixed(2)}</p>
                        <p className="text-sm text-white/70 mt-2">Por agendamento</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg text-white">
                        <Award className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Taxa de Conclusão</p>
                        <p className="text-3xl font-bold">{data.summary.completionRate.toFixed(1)}%</p>
                        <p className="text-sm text-white/70 mt-2">Agendamentos concluídos</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-lg text-white">
                        <Users className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Novos Clientes</p>
                        <p className="text-3xl font-bold">{data.summary.newClients}</p>
                        <p className="text-sm text-white/70 mt-2">No período</p>
                    </div>
                </div>

                {/* Gráfico de Faturamento */}
                <div className="bg-white rounded-xl p-6 shadow">
                    <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <TrendingUp className="text-gold" size={24} />
                        Evolução do Faturamento
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.revenue[period]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'} />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                                labelStyle={{ color: '#2C2C2C' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#D4AF37"
                                strokeWidth={3}
                                name="Receita"
                                dot={{ fill: '#D4AF37', r: 5 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="appointments"
                                stroke="#8B7355"
                                strokeWidth={2}
                                name="Agendamentos"
                                dot={{ fill: '#8B7355', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Serviços Mais Vendidos e Horários de Pico */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Serviços */}
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Award className="text-gold" size={24} />
                            Top 10 Serviços
                        </h3>
                        <div className="space-y-3 mb-6">
                            {data.services.slice(0, 10).map((service, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-charcoal">{service.name}</span>
                                            <span className="text-gold font-bold">R$ {service.revenue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gold rounded-full h-2 transition-all"
                                                    style={{ width: `${service.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600">{service.count}x</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={data.services.slice(0, 8)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.percentage.toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="revenue"
                                >
                                    {data.services.slice(0, 8).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Horários de Pico */}
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Clock className="text-gold" size={24} />
                            Horários de Pico
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.peakHours}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#D4AF37" name="Agendamentos" />
                                <Bar dataKey="occupancy" fill="#8B7355" name="Taxa de Ocupação %" />
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="mt-4 space-y-2">
                            {data.peakHours.slice(0, 5).map((hour, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-semibold text-charcoal">{hour.hour}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600">{hour.count} agendamentos</span>
                                        <span className={`font-bold ${hour.occupancy > 80 ? 'text-red-600' : hour.occupancy > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {hour.occupancy}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cancelamentos e Top Clientes */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Cancelamentos */}
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6">
                            📊 Análise de Cancelamentos
                        </h3>
                        <div className="text-center mb-6">
                            <p className="text-5xl font-bold text-red-600">{data.cancellations.rate.toFixed(1)}%</p>
                            <p className="text-gray-600 mt-2">Taxa de Cancelamento</p>
                            <p className="text-sm text-gray-500">{data.cancellations.total} agendamentos cancelados</p>
                        </div>

                        <div className="space-y-3">
                            {data.cancellations.byReason.map((reason, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <span className="text-charcoal">{reason.reason}</span>
                                    <span className="font-bold text-red-600">{reason.count}x</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Clientes */}
                    <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Users className="text-gold" size={24} />
                            Top 10 Clientes
                        </h3>
                        <div className="space-y-3">
                            {data.topClients.map((client, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/10 to-transparent rounded-lg">
                                    <span className="text-2xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">{client.name}</p>
                                        <p className="text-sm text-gray-600">{client.visits} visitas</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gold text-lg">R$ {client.totalSpent.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
                .bg-charcoal { background-color: #2C2C2C; }
                .bg-beige { background-color: #F5F5DC; }
            `}</style>
        </div>
    )
}