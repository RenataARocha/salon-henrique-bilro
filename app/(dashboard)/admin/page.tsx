// app/(dashboard)/admin/page.tsx

'use client'

import { useSession } from 'next-auth/react'
import { Calendar, Users, Settings, Scissors, Home, Tag, Ban, Cake, Star, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const { data: session } = useSession()

    const menuItems = [
        {
            title: 'Agendamentos',
            description: 'Visualizar e gerenciar todos os agendamentos',
            icon: Calendar,
            href: '/admin/agendamentos',
            color: 'bg-blue-500'
        },
        {
            title: 'Financeiro',
            description: 'Dashboard financeiro e relatórios de receita',
            icon: DollarSign,
            href: '/admin/financeiro',
            color: 'bg-emerald-500'
        },
        {
            title: 'Serviços',
            description: 'Gerenciar serviços oferecidos pelo salão',
            icon: Scissors,
            href: '/admin/servicos',
            color: 'bg-purple-500'
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
        {
            title: 'Configurações',
            description: 'Preferências e configurações gerais',
            icon: Settings,
            href: '/admin/configuracoes',
            color: 'bg-orange-500'
        }
    ]

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header com botão Home */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-charcoal mb-2">
                                Painel Administrativo
                            </h1>
                            <p className="text-gray-600">
                                Bem-vindo, {session?.user?.name || 'Admin'}! 👋
                            </p>
                        </div>

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

                {/* Cards de Menu */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all hover:scale-105 group"
                        >
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
                    ))}
                </div>

                {/* Estatísticas Rápidas */}
                <div className="mt-8 bg-gradient-gold rounded-2xl p-8 text-white">
                    <h2 className="text-2xl font-bold mb-4">📊 Estatísticas Rápidas</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-sm opacity-90 mb-1">Agendamentos Hoje</p>
                            <p className="text-3xl font-bold">--</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-sm opacity-90 mb-1">Serviços Ativos</p>
                            <p className="text-3xl font-bold">--</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-sm opacity-90 mb-1">Receita do Mês</p>
                            <p className="text-3xl font-bold">R$ --</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}