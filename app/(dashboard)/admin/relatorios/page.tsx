'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Calendar, Clock, Users, Award, Download, Filter, ArrowLeft, Home } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/exportUtils'
import { motion, Variants } from 'framer-motion'


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
        completedAppointments: number
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
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchReports()
    }, [dateRange])

    // ✅ Ajusta as datas automaticamente ao trocar período
    const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly') => {
        setPeriod(newPeriod)

        const today = new Date()
        let newStart = new Date()

        if (newPeriod === 'daily') {
            // Últimos 30 dias
            newStart.setDate(today.getDate() - 30)
        } else if (newPeriod === 'weekly') {
            // Últimas 8 semanas (2 meses)
            newStart.setDate(today.getDate() - 56)
        } else {
            // Últimos 6 meses
            newStart.setMonth(today.getMonth() - 6)
        }

        setDateRange({
            start: newStart.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        })
    }

    // ✅ Função para ver todos os agendamentos (sem filtro de data)
    const handleViewAll = () => {
        setDateRange({
            start: '2020-01-01', // Data bem antiga para pegar tudo
            end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] // 1 ano no futuro
        })
    }

    const fetchReports = async () => {
        try {
            setLoading(true)
            const res = await fetch(
                `/api/admin/reports?start=${dateRange.start}&end=${dateRange.end}`
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
            exportToExcel(data)
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

    // ✅ Pega os dados do período selecionado
    const currentPeriodData = data.revenue[period]

    const containerAnimation: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.25,   // antes: 0.15
                delayChildren: 0.4,      // antes: 0.2
            },
        },
    }

    const cardAnimation: Variants = {
        hidden: { opacity: 0, y: 50 }, // sobe um pouco mais suave
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1.2,          // antes: 0.8
                ease: [0.16, 1, 0.3, 1],
            },
        },
    }


    return (
        <motion.div
            className="min-h-screen bg-beige py-8 px-4"
            variants={containerAnimation}
            initial="hidden"
            animate="visible"
        >

            <div id="report-area" className="max-w-7xl mx-auto space-y-8 ">
                {/* Header */}
                <motion.div
                    variants={cardAnimation}
                    className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">📊 Relatórios</h1>
                        <p className="text-gray-600">Análise completa do desempenho do salão</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
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
                </motion.div>

                {/* Navegação */}
                <motion.div
                    variants={cardAnimation}
                    className="flex justify-end gap-3">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >
                        <ArrowLeft size={20} />
                        Painel
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold "
                    >
                        <Home size={20} />
                        Voltar ao início
                    </Link>
                </motion.div>

                {/* Filtros */}
                <motion.div
                    variants={cardAnimation}
                    className="bg-white rounded-xl p-6 shadow">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gold" />
                            <span className="font-semibold text-charcoal">Filtros:</span>
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
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

                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: 'daily', label: '📅 Diário', desc: 'Últimos 30 dias' },
                                { value: 'weekly', label: '📆 Semanal', desc: 'Últimas 8 semanas' },
                                { value: 'monthly', label: '🗓️ Mensal', desc: 'Últimos 6 meses' }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handlePeriodChange(opt.value as any)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${period === opt.value
                                        ? 'bg-gold text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    title={opt.desc}
                                >
                                    {opt.label}
                                </button>
                            ))}

                            <button
                                onClick={handleViewAll}
                                className="px-4 py-2 rounded-lg font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600"
                                title="Ver todos os agendamentos sem filtro de data"
                            >
                                🌐 Todos
                            </button>
                        </div>
                    </div>

                    {/* Explicação do período atual */}
                    <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <span className="font-semibold">ℹ️ Visualização atual: </span>
                        {period === 'daily' && 'Mostra dados dia a dia no período selecionado'}
                        {period === 'weekly' && 'Agrupa dados por semana no período selecionado'}
                        {period === 'monthly' && 'Agrupa dados por mês no período selecionado'}
                    </div>
                </motion.div>

                {/* Cards de Resumo */}
                <motion.div
                    variants={cardAnimation}
                    className="grid md:grid-cols-5 gap-6">
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
                        <p className="text-white/80 text-sm mb-1">Concluídos</p>
                        <p className="text-3xl font-bold">{data.summary.completedAppointments}</p>
                        <p className="text-sm text-white/70 mt-2">{data.summary.completionRate.toFixed(1)}% de conclusão</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-lg text-white">
                        <Users className="mb-2" size={32} />
                        <p className="text-white/80 text-sm mb-1">Novos Clientes</p>
                        <p className="text-3xl font-bold">{data.summary.newClients}</p>
                        <p className="text-sm text-white/70 mt-2">No período</p>
                    </div>
                </motion.div>

                {/* Gráfico de Faturamento */}
                <motion.div
                    variants={cardAnimation}
                    className="bg-white rounded-xl p-6 shadow">
                    <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <TrendingUp className="text-gold" size={24} />
                        Evolução do Faturamento
                    </h3>
                    {currentPeriodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={currentPeriodData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'} />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number | undefined) => value ? `R$ ${value.toFixed(2)}` : 'R$ 0.00'}
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
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>📊 Nenhum dado de faturamento disponível para o período selecionado.</p>
                            <p className="text-sm mt-2">Complete alguns agendamentos para visualizar os gráficos.</p>
                        </div>
                    )}
                </motion.div>

                {/* Serviços Mais Vendidos e Horários de Pico */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Serviços */}
                    <motion.div
                        variants={cardAnimation}
                        className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Award className="text-gold" size={24} />
                            Top 10 Serviços
                        </h3>
                        {data.services.length > 0 ? (
                            <>
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
                                            label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="revenue"
                                        >
                                            {data.services.slice(0, 8).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number | undefined) => value ? `R$ ${value.toFixed(2)}` : 'R$ 0.00'} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>🏆 Nenhum serviço concluído ainda.</p>
                                <p className="text-sm mt-2">Complete agendamentos para ver o ranking.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Horários de Pico */}
                    <motion.div
                        variants={cardAnimation}
                        className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Clock className="text-gold" size={24} />
                            Horários de Pico
                        </h3>
                        {data.peakHours.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
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
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>🕐 Nenhum agendamento registrado.</p>
                                <p className="text-sm mt-2">Crie agendamentos para ver os horários de pico.</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Cancelamentos e Top Clientes */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Cancelamentos */}
                    <motion.div
                        variants={cardAnimation}
                        className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6">
                            📊 Análise de Cancelamentos
                        </h3>
                        <div className="text-center mb-6">
                            <p className="text-5xl font-bold text-red-600">{data.cancellations.rate.toFixed(1)}%</p>
                            <p className="text-gray-600 mt-2">Taxa de Cancelamento</p>
                            <p className="text-sm text-gray-500">{data.cancellations.total} agendamentos cancelados</p>
                        </div>

                        {data.cancellations.byReason.length > 0 ? (
                            <div className="space-y-3">
                                {data.cancellations.byReason.map((reason, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <span className="text-charcoal">{reason.reason}</span>
                                        <span className="font-bold text-red-600">{reason.count}x</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <p>✅ Nenhum cancelamento registrado!</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Top Clientes */}
                    <motion.div
                        variants={cardAnimation}
                        className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                            <Users className="text-gold" size={24} />
                            Top 10 Clientes
                        </h3>
                        {data.topClients.length > 0 ? (
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
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>👥 Nenhum cliente com agendamentos concluídos.</p>
                                <p className="text-sm mt-2">Complete agendamentos para ver o ranking.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
                .bg-charcoal { background-color: #2C2C2C; }
                .bg-beige { background-color: #F5F5DC; }
            `}</style>
        </motion.div >
    )
} 