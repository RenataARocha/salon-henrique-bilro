'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { use } from 'react'

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


export default function FuncionarioHistoricoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [data, setData] = useState<StaffDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            const res = await fetch(`/api/staff/${id}`)
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
            <div className="flex items-center justify-center min-h-screen bg-beige">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-gold/20 border-t-gold mx-auto mb-5 shadow-md"></div>
                    <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-beige gap-4">
                <div className="text-center px-4">
                    <p className="text-4xl mb-3">👤</p>
                    <p className="text-lg sm:text-xl text-gray-600 mb-4">Funcionário não encontrado</p>
                    <button
                        onClick={() => router.push('/admin/funcionarios')}
                        className="text-sm text-gold hover:underline font-semibold"
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
            <div className="max-w-7xl mx-auto space-y-5">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <button
                        onClick={() => router.push('/admin/funcionarios')}
                        className="flex items-center gap-2 text-gold hover:text-gold-dark mb-5 transition text-sm font-semibold"
                    >
                        <ArrowLeft size={18} />
                        Voltar para Funcionários
                    </button>

                    {/* Card de perfil — padrão gradient header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-gold text-white p-5 sm:p-6">
                            <div className="flex flex-col gap-4">

                                {/* TOPO: foto + nome */}
                                <div className="flex items-center gap-4">
                                    {staff.photo ? (
                                        <Image
                                            src={staff.photo}
                                            alt={staff.name}
                                            width={56}
                                            height={56}
                                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                            {staff.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h1 className="font-bold text-lg sm:text-2xl truncate">{staff.name}</h1>
                                        <p className="text-xs text-gold-light mt-0.5">
                                            Membro desde {new Date(staff.hireDate).toLocaleDateString('pt-BR')} • {staff.commissionPercent}% comissão
                                        </p>
                                    </div>
                                    <span className={`ml-auto flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${staff.active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
                                        {staff.active ? '🟢 Ativo' : '⚪ Inativo'}
                                    </span>
                                </div>

                                {/* VALORES: stats rápidos */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <p className="text-xs text-gold-light">Faturamento Total</p>
                                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                                            R$ {stats.total.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex justify-between sm:justify-end gap-6 text-xs">
                                        <span className="text-gold-light">
                                            Serviços: <span className="text-white font-semibold">{stats.total.services}</span>
                                        </span>
                                        <span className="text-gold-light">
                                            Comissão: <span className="text-green-200 font-semibold">R$ {stats.total.commission.toFixed(2)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Especialidades */}
                        {staff.specialties.length > 0 && (
                            <div className="px-5 sm:px-6 py-4">
                                <p className="text-xs text-gray-400 mb-2">Especialidades</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.specialties.map(spec => (
                                        <span key={spec} className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-medium">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Estatísticas */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-gold">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gold/10 rounded-xl flex-shrink-0">
                                <Calendar className="text-gold" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Este Mês</p>
                                <p className="text-xl sm:text-2xl font-bold text-charcoal">{stats.month.services} serviços</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                            <p className="text-gray-500">Faturamento: <span className="font-semibold text-charcoal">R$ {stats.month.revenue.toFixed(2)}</span></p>
                            <p className="text-gray-500">Comissão: <span className="font-semibold text-gold">R$ {stats.month.commission.toFixed(2)}</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-gold">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gold/10 rounded-xl flex-shrink-0">
                                <DollarSign className="text-gold" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Comissão do Mês</p>
                                <p className="text-xl sm:text-2xl font-bold text-gold">R$ {stats.month.commission.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                            <p className="text-gray-500">Taxa: <span className="font-semibold text-charcoal">{staff.commissionPercent}% por serviço</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-gold sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gold/10 rounded-xl flex-shrink-0">
                                <TrendingUp className="text-gold" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Total Geral</p>
                                <p className="text-xl sm:text-2xl font-bold text-charcoal">{stats.total.services} serviços</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                            <p className="text-gray-500">Faturamento: <span className="font-semibold text-charcoal">R$ {stats.total.revenue.toFixed(2)}</span></p>
                            <p className="text-gray-500">Comissão: <span className="font-semibold text-gold">R$ {stats.total.commission.toFixed(2)}</span></p>
                        </div>
                    </div>
                </motion.div>

                {/* Últimos Serviços */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                >
                    <div className="bg-gradient-gold text-white p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold">Últimos Serviços</h2>
                            <span className="ml-auto text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                                {recentServices.length} registros
                            </span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {recentServices.length > 0 ? (
                            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 space-y-3">
                                {recentServices.map(service => (
                                    <div
                                        key={service.id}
                                        className="border-l-4 border-gold pl-4 py-3 pr-3 hover:bg-beige/50 transition rounded-r-xl"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-charcoal text-sm truncate">
                                                    {service.service?.name || service.combo?.name || service.notes || 'Serviço avulso'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">Cliente: {service.clientName}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(service.executedAt).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right flex-shrink-0">
                                                <p className="text-base font-bold text-charcoal">R$ {service.serviceValue.toFixed(2)}</p>
                                                <p className="text-xs text-gold font-semibold">Comissão: R$ {service.commissionValue.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-3xl mb-2">📋</p>
                                <p className="text-gray-500 text-sm">Nenhum serviço registrado ainda</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Relatórios Mensais */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.9 }}
                >
                    <div className="bg-gradient-gold text-white p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp size={18} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold">Histórico Mensal</h2>
                            <span className="ml-auto text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                                {monthlyReports.length} meses
                            </span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {monthlyReports.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl">
                                <table className="w-full min-w-[560px]">
                                    <thead>
                                        <tr className="border-b-2 border-gold/30">
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Serviços</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Faturamento</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comissão</th>
                                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyReports.map(report => {
                                            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                                            return (
                                                <tr key={report.id} className="border-b border-gray-50 odd:bg-white even:bg-gray-50/50 hover:bg-beige/30 transition">
                                                    <td className="py-3 px-3 text-sm font-medium text-charcoal">
                                                        {monthNames[report.month - 1]} {report.year}
                                                    </td>
                                                    <td className="text-right py-3 px-3 text-sm text-gray-600">{report.totalServices}</td>
                                                    <td className="text-right py-3 px-3 text-sm text-gray-600">R$ {report.totalRevenue.toFixed(2)}</td>
                                                    <td className="text-right py-3 px-3 text-sm font-semibold text-gold">
                                                        R$ {report.totalCommission.toFixed(2)}
                                                    </td>
                                                    <td className="text-center py-3 px-3">
                                                        {report.paid ? (
                                                            <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                                ✅ Pago
                                                            </span>
                                                        ) : (
                                                            <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-semibold">
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
                            <div className="text-center py-10">
                                <p className="text-3xl mb-2">📊</p>
                                <p className="text-gray-500 text-sm">Nenhum relatório mensal disponível</p>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}