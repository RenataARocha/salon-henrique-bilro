'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface StaffDetails {
    staff: {
        id: string
        name: string
        email: string | null
        phone: string | null
        photo: string | null
        cpf: string | null
        specialties: string[]
        commissionPercent: number
        active: boolean
        hireDate: string
    }
    recentServices: any[]
    stats: {
        month: { services: number; revenue: number; commission: number }
        total: { services: number; revenue: number; commission: number }
    }
    monthlyReports: any[]
}

export default function FuncionarioHistoricoPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [data, setData] = useState<StaffDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [params.id])

    async function loadData() {
        try {
            const res = await fetch(`/api/staff/${params.id}`)
            const result = await res.json()
            if (result.success) setData(result.data)
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-beige gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                <p className="text-gray-500 text-sm">Carregando dados...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-beige gap-4">
                <div className="text-center px-4">
                    <p className="text-lg sm:text-xl text-gray-600 mb-4">Funcionário não encontrado</p>
                    <button
                        onClick={() => router.push('/admin/funcionarios')}
                        className="text-gold hover:underline"
                    >
                        Voltar para funcionários
                    </button>
                </div>
            </div>
        )
    }

    const { staff, stats, recentServices, monthlyReports } = data

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
                    <button
                        onClick={() => router.push('/admin/funcionarios')}
                        className="flex items-center gap-2 text-gold hover:text-gold-dark mb-4 transition text-sm sm:text-base"
                    >
                        <ArrowLeft size={20} />
                        Voltar para Funcionários
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                        {staff.photo ? (
                            <Image
                                src={staff.photo}
                                alt={staff.name}
                                width={100}
                                height={100}
                                className="rounded-full object-cover border-4 border-gold"
                            />
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-gold flex items-center justify-center text-white text-4xl font-bold border-4 border-gold">
                                {staff.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-charcoal">{staff.name}</h1>
                            <p className="text-gray-600 mt-1">
                                Membro desde {new Date(staff.hireDate).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                                {staff.specialties.map(spec => (
                                    <span key={spec} className="text-xs bg-gold/20 text-gold px-3 py-1 rounded-full font-semibold">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Estatísticas */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                >
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-gold">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="p-3 bg-gold/10 rounded-xl">
                                <Calendar className="text-gold" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Este Mês</p>
                                <p className="text-xl sm:text-2xl font-bold text-charcoal">{stats.month.services} serviços</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="text-gray-600">Faturamento: <span className="font-semibold text-charcoal">R$ {stats.month.revenue.toFixed(2)}</span></p>
                            <p className="text-gray-600">Comissão: <span className="font-semibold text-gold">R$ {stats.month.commission.toFixed(2)}</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-t-4 border-gold">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="p-3 bg-gold/10 rounded-xl">
                                <DollarSign className="text-gold" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Comissão Mês</p>
                                <p className="text-xl sm:text-2xl font-bold text-gold">R$ {stats.month.commission.toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Taxa: {staff.commissionPercent}% por serviço</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-gold">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="p-3 bg-gold/10 rounded-xl">
                                <TrendingUp className="text-gold" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Geral</p>
                                <p className="text-xl sm:text-2xl font-bold text-charcoal">{stats.total.services} serviços</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="text-gray-600">Faturamento: <span className="font-semibold text-charcoal">R$ {stats.total.revenue.toFixed(2)}</span></p>
                            <p className="text-gray-600">Comissão: <span className="font-semibold text-gold">R$ {stats.total.commission.toFixed(2)}</span></p>
                        </div>
                    </div>
                </motion.div>

                {/* Últimos Serviços */}
                <motion.div
                    className="bg-white rounded-2xl shadow-lg p-8 mt-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                >
                    <h2 className="text-2xl font-bold text-charcoal mb-6">📋 Últimos Serviços</h2>
                    {recentServices.length > 0 ? (
                        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 space-y-4">
                            {recentServices.map(service => (
                                <div key={service.id} className="border-l-4 border-gold pl-4 py-3 pr-3 sm:pr-4 hover:bg-beige/50 transition rounded-r-lg">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                        <div>
                                            <p className="font-semibold text-charcoal">
                                                {service.service?.name || service.combo?.name || service.notes || 'Serviço avulso'}
                                            </p>
                                            <p className="text-sm text-gray-600">Cliente: {service.clientName}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(service.executedAt).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-lg font-bold text-charcoal">R$ {service.serviceValue.toFixed(2)}</p>
                                            <p className="text-sm text-gold font-semibold">Comissão: R$ {service.commissionValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum serviço registrado ainda</p>
                    )}
                </motion.div>

                {/* Relatórios Mensais */}
                <motion.div
                    className="bg-white rounded-2xl shadow-lg p-8 mt-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.9 }}
                >
                    <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-6">📊 Histórico Mensal</h2>
                    {monthlyReports.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b-2 border-gold">
                                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-charcoal">Período</th>
                                        <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-charcoal">Serviços</th>
                                        <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-charcoal">Faturamento</th>
                                        <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-charcoal">Comissão</th>
                                        <th className="text-center py-2 px-2 sm:py-3 sm:px-4 font-semibold text-charcoal">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyReports.map(report => {
                                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                                        return (
                                            <tr key={report.id} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-beige/30 transition">
                                                <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                                                    {monthNames[report.month - 1]} {report.year}
                                                </td>
                                                <td className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{report.totalServices}</td>
                                                <td className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">R$ {report.totalRevenue.toFixed(2)}</td>
                                                <td className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-gold">
                                                    R$ {report.totalCommission.toFixed(2)}
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    {report.paid ? (
                                                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                                                            ✅ Pago
                                                        </span>
                                                    ) : (
                                                        <span className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold">
                                                            ⏰ Pendente
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum relatório mensal disponível</p>
                    )}
                </motion.div>
            </div>
        </div>
    )
}