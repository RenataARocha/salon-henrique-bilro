// app/(dashboard)/admin/page.tsx

'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, Users, Scissors, Home, Tag, Ban, Cake, Star, DollarSign, UserCircle, BarChart3, Briefcase, ClipboardList, Wallet } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AlertaAgendamentos48h from '@/components/AlertaAgendamentos48h'
import NotificationBell from '@/components/NotificationBell'
import DashboardMetricas from '@/components/DashboardMetricas'

interface QuickStats {
    todayAppointments: number
    activeServices: number
    monthRevenue: number
    totalClients: number
}

export default function AdminDashboard() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<QuickStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        fetchQuickStats()
    }, [])

    const fetchQuickStats = async () => {
        try {
            setLoadingStats(true)
            const res = await fetch('/api/admin/quick-stats')
            const data = await res.json()
            if (data.success) {
                setStats(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error)
        } finally {
            setLoadingStats(false)
        }
    }

    const menuItems = [
        {
            title: 'Agendamentos',
            description: 'Visualizar e gerenciar todos os agendamentos',
            icon: Calendar,
            href: '/admin/agendamentos',
            color: 'bg-blue-500'
        },
        {
            title: 'Comanda Diária',
            description: 'Registrar serviços executados pelos funcionários',
            icon: ClipboardList,
            href: '/admin/comanda',
            color: 'bg-orange-500',
            badge: 'NOVO'
        },
        {
            title: 'Funcionários',
            description: 'Gerenciar equipe e acompanhar desempenho',
            icon: Briefcase,
            href: '/admin/funcionarios',
            color: 'bg-teal-500',
            badge: 'NOVO'
        },
        {
            title: 'Relatórios Funcionários',
            description: 'Comissões, faturamento e desempenho da equipe',
            icon: BarChart3,
            href: '/admin/relatorios/funcionarios',
            color: 'bg-violet-500',
            badge: 'NOVO'
        },
        {
            title: 'Comissões',
            description: 'Gerenciar pagamentos de comissões da equipe',
            icon: Wallet,
            href: '/admin/comissoes',
            color: 'bg-emerald-500',
            badge: 'NOVO'
        },
        {
            title: 'Financeiro',
            description: 'Dashboard financeiro e relatórios de receita',
            icon: DollarSign,
            href: '/admin/financeiro',
            color: 'bg-green-600'
        },
        {
            title: 'Relatórios',
            description: 'Analytics completo e exportação de dados',
            icon: BarChart3,
            href: '/admin/relatorios',
            color: 'bg-cyan-500'
        },
        {
            title: 'Clientes',
            description: 'Gerenciar base de clientes e histórico',
            icon: UserCircle,
            href: '/admin/clientes',
            color: 'bg-indigo-500'
        },
        {
            title: 'Serviços',
            description: 'Gerenciar serviços oferecidos pelo salão',
            icon: Scissors,
            href: '/admin/servicos',
            color: 'bg-purple-500'
        },
        {
            title: 'Combos Promocionais',
            description: 'Criar pacotes de serviços com desconto',
            icon: Tag,
            href: '/admin/combos',
            color: 'bg-amber-500'
        },
        {
            title: 'Cupons',
            description: 'Criar e gerenciar cupons de desconto',
            icon: Tag,
            href: '/admin/cupons',
            color: 'bg-rose-500'
        },
        {
            title: 'Avaliações',
            description: 'Moderar avaliações e depoimentos dos clientes',
            icon: Star,
            href: '/admin/avaliacoes',
            color: 'bg-yellow-500'
        },
        {
            title: 'Aniversariantes',
            description: 'Enviar ofertas especiais para aniversariantes',
            icon: Cake,
            href: '/admin/aniversariantes',
            color: 'bg-pink-500'
        },
        {
            title: 'Horários de Funcionamento',
            description: 'Configurar quando o salão está aberto',
            icon: Users,
            href: '/admin/agenda',
            color: 'bg-green-500'
        },
        {
            title: 'Horários Bloqueados',
            description: 'Bloquear horários indisponíveis (almoço, folga, feriados)',
            icon: Ban,
            href: '/admin/horarios-bloqueados',
            color: 'bg-red-500'
        },
    ]

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header com botão Home e Sino de Notificações */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-charcoal mb-2">
                                Painel Administrativo
                            </h1>
                            <p className="text-gray-600">
                                Bem-vindo, {session?.user?.name || 'Admin'}! 👋
                            </p>
                        </div>

                        {/* Botões do Header */}
                        <div className="flex items-center gap-3">
                            {/* Sino de Notificações */}
                            <NotificationBell />

                            {/* Botão Voltar ao Início */}
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                            >
                                <Home size={20} />
                                Voltar ao Início
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Dashboard de Métricas */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <DashboardMetricas />
                </motion.div>

                {/* Estatísticas Rápidas */}
                <motion.div
                    className="mb-8 bg-gradient-gold rounded-2xl p-8 text-white shadow-xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <BarChart3 size={28} />
                        📊 Resumo do Dia
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 hover:bg-white/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-white/80" size={20} />
                                <p className="text-sm opacity-90 font-medium">Agendamentos Hoje</p>
                            </div>
                            {loadingStats ? (
                                <div className="h-10 bg-white/20 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-4xl font-bold">{stats?.todayAppointments || 0}</p>
                            )}
                        </div>

                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 hover:bg-white/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Scissors className="text-white/80" size={20} />
                                <p className="text-sm opacity-90 font-medium">Serviços Ativos</p>
                            </div>
                            {loadingStats ? (
                                <div className="h-10 bg-white/20 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-4xl font-bold">{stats?.activeServices || 0}</p>
                            )}
                        </div>

                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 hover:bg-white/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-white/80" size={20} />
                                <p className="text-sm opacity-90 font-medium">Receita do Mês</p>
                            </div>
                            {loadingStats ? (
                                <div className="h-10 bg-white/20 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-4xl font-bold">
                                    R$ {stats?.monthRevenue?.toFixed(2) || '0.00'}
                                </p>
                            )}
                        </div>

                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 hover:bg-white/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-white/80" size={20} />
                                <p className="text-sm opacity-90 font-medium">Total Clientes</p>
                            </div>
                            {loadingStats ? (
                                <div className="h-10 bg-white/20 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-4xl font-bold">{stats?.totalClients || 0}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Cards de Menu */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, index) => (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.8 + (index * 0.05) }}
                        >
                            <Link
                                href={item.href}
                                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all hover:scale-105 group block relative overflow-hidden"
                            >
                                {/* Badge NOVO */}
                                {item.badge && (
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                                            {item.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start gap-6">
                                    <div className={`${item.color} p-4 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                                        <item.icon size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-charcoal mb-2 group-hover:text-gold transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-600">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
            <AlertaAgendamentos48h />
        </div>
    )
}