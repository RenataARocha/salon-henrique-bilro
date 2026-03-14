import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Users, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Variants } from "framer-motion";

interface AnalyticsData {
    summary: {
        totalRevenue: number;
        totalDiscount: number;
        totalAppointments: number;
        averageTicket: number;
    };
    comparisons: {
        today: { revenue: number; change: number };
        week: { revenue: number; change: number };
        month: { revenue: number; change: number };
    };
    charts: {
        revenueByDay: Array<{ date: string; revenue: number; appointments: number }>;
        topServices: Array<{ name: string; count: number; revenue: number }>;
        peakHours: Array<{ hour: string; appointments: number }>;
        monthlyRevenue: Array<{ month: string; revenue: number; appointments: number }>;
    };
    projection: {
        projectedRevenue: number
        averagePerDay: number
    }
}

const COLORS = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const FinancialDashboard = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [monthlyGoal, setMonthlyGoal] = useState(0);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState(0);

    useEffect(() => {
        loadAnalytics();
        loadGoal();
        saveGoal();
    }, [period]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/analytics/revenue?period=${period}`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGoal = async () => {
        const res = await fetch('/api/admin/settings/financial-goal')
        const data = await res.json()

        if (data.success) {
            setMonthlyGoal(data.goal)
            setGoalInput(data.goal)
        }
    }

    const saveGoal = async () => {
        const res = await fetch('/api/admin/settings/financial-goal', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                goal: goalInput
            })
        })

        const data = await res.json()

        if (data.success) {
            setMonthlyGoal(data.goal)
            setEditingGoal(false)
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600">Erro ao carregar dados financeiros</p>
            </div>
        );
    }

    const goalProgress = monthlyGoal
        ? (data.comparisons.month.revenue / monthlyGoal) * 100
        : 0;
    const goalRemaining = monthlyGoal - data.comparisons.month.revenue;

    const cardAnimation: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut" as const,
            },
        },
    };


    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.1,
                    },
                },
            }}
        >
            {/* Métricas Principais */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Hoje */}
                <motion.div
                    variants={cardAnimation}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold opacity-90">💰 RECEITA HOJE</h3>
                        {data.comparisons.today.change !== 0 && (
                            <div className={`flex items-center gap-1 ${data.comparisons.today.change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {data.comparisons.today.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span className="text-sm font-semibold">
                                    {Math.abs(data.comparisons.today.change).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-3xl font-bold mb-1">
                        R$ {data.comparisons.today.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm opacity-75">
                        {data.comparisons.today.change > 0 ? '↑' : '↓'} vs ontem
                    </p>
                </motion.div>

                {/* Semana */}
                <motion.div
                    variants={cardAnimation}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold opacity-90">📊 ESTA SEMANA</h3>
                        {data.comparisons.week.change !== 0 && (
                            <div className={`flex items-center gap-1 ${data.comparisons.week.change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {data.comparisons.week.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span className="text-sm font-semibold">
                                    {Math.abs(data.comparisons.week.change).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-3xl font-bold mb-1">
                        R$ {data.comparisons.week.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm opacity-75">
                        {data.comparisons.week.change > 0 ? '↑' : '↓'} vs semana passada
                    </p>
                </motion.div>

                {/* Mês */}
                <motion.div
                    variants={cardAnimation}
                    className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold opacity-90">📅 ESTE MÊS</h3>
                        {data.comparisons.month.change !== 0 && (
                            <div className={`flex items-center gap-1 ${data.comparisons.month.change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {data.comparisons.month.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span className="text-sm font-semibold">
                                    {Math.abs(data.comparisons.month.change).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-3xl font-bold mb-1">
                        R$ {data.comparisons.month.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm opacity-75">
                        {data.comparisons.month.change > 0 ? '↑' : '↓'} vs mês passado
                    </p>
                </motion.div>
            </div>

            {/* Meta Mensal */}
            <motion.div
                variants={cardAnimation}
                className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Target className="text-pink-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800">🎯 META MENSAL</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-bold text-gray-800">
                            {formatCurrency(monthlyGoal)}
                        </span>
                        <span className="text-lg text-gray-600">
                            {goalProgress.toFixed(1)}% atingido
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${goalProgress >= 100 ? 'bg-green-500' : goalProgress >= 80 ? 'bg-yellow-500' : 'bg-pink-500'
                                }`}
                            style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        ></div>
                    </div>

                    {goalRemaining > 0 && (
                        <p className="text-gray-600">
                            Faltam <span className="font-bold text-pink-600">{formatCurrency(goalRemaining)}</span> para atingir a meta
                        </p>
                    )}
                    {goalRemaining <= 0 && (
                        <p className="text-green-600 font-bold">
                            🎉 Meta atingida! Parabéns!
                        </p>
                    )}

                    {!editingGoal && (
                        <button
                            onClick={() => setEditingGoal(true)}
                            className="text-sm text-pink-600"
                        >
                            Editar meta
                        </button>
                    )}

                    {editingGoal && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={formatCurrency(goalInput)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "")
                                    setGoalInput(Number(raw))
                                }}
                                className="border rounded px-3 py-2 w-40"
                            />

                            <button
                                onClick={saveGoal}
                                className="bg-pink-500 text-white px-4 py-2 rounded"
                            >
                                Salvar
                            </button>

                            <button
                                onClick={() => setEditingGoal(false)}
                                className="text-gray-500"
                            >
                                Cancelar
                            </button>
                        </div>


                    )}
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-2">
                        📈 Previsão do mês
                    </h3>

                    <p className={`text-3xl font-bold ${data.projection.projectedRevenue >= monthlyGoal
                        ? "text-green-600"
                        : "text-orange-500"
                        }`}>
                        {formatCurrency(data.projection.projectedRevenue)}
                    </p>

                    <p className="text-sm text-gray-500">
                        Baseado na média diária
                    </p>
                </div>
            </motion.div>

            {/* Gráfico de Receita (Últimos 30 dias) */}
            <motion.div
                variants={cardAnimation}
                className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Calendar size={24} className="text-purple-500" />
                    Receita nos Últimos 30 Dias
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.charts.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).getDate().toString()}
                            stroke="#666"
                        />
                        <YAxis
                            tickFormatter={(value) => `R$ ${value}`}
                            stroke="#666"
                        />
                        <Tooltip
                            formatter={(value: any) => `R$ ${value.toFixed(2)}`}
                            labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ec4899"
                            strokeWidth={3}
                            dot={{ fill: '#ec4899', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div
                variants={cardAnimation} className="grid md:grid-cols-2 gap-6">
                {/* Serviços Mais Vendidos */}
                <motion.div
                    variants={cardAnimation} className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-500" />
                        Serviços Mais Vendidos
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.charts.topServices.slice(0, 6)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.name}: R$ ${entry.revenue.toFixed(0)}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="revenue"
                            >
                                {data.charts.topServices.slice(0, 6).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Horários de Pico */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Clock size={24} className="text-blue-500" />
                        Horários de Pico
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.charts.peakHours}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="hour" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip />
                            <Bar dataKey="appointments" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Comparativo Mensal */}
            <motion.div
                variants={cardAnimation}
                className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users size={24} className="text-pink-500" />
                    Comparativo Mensal
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.charts.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis tickFormatter={(value) => `R$ ${value}`} stroke="#666" />
                        <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#ec4899" radius={[8, 8, 0, 0]} name="Receita" />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Resumo */}
            <motion.div
                variants={cardAnimation}
                className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 mb-1">Total de Agendamentos</p>
                    <p className="text-2xl font-bold text-gray-800">{data.summary.totalAppointments}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-800">
                        R$ {data.summary.averageTicket.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                    <p className="text-2xl font-bold text-gray-800">
                        R$ {data.summary.totalRevenue.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-pink-500">
                    <p className="text-sm text-gray-600 mb-1">Descontos Dados</p>
                    <p className="text-2xl font-bold text-gray-800">
                        R$ {data.summary.totalDiscount.toFixed(2)}
                    </p>
                </div>
            </motion.div>
        </motion.div >
    );
};

export default FinancialDashboard;