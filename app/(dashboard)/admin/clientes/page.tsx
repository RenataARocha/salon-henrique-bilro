// app/(dashboard)/admin/clientes/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Crown, UserPlus, UserX, Cake, ArrowLeft, Home, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    birthDate: string | null;
    createdAt: string;
    stats: {
        totalAppointments: number;
        totalSpent: number;
        lastAppointment: string | null;
        daysSinceLastAppointment: number | null;
        favoriteService: string | null;
        attendanceRate: number;
    };
    segments: {
        isVIP: boolean;
        isNew: boolean;
        isInactive: boolean;
        isBirthdayThisMonth: boolean;
    };
}

interface Summary {
    total: number;
    vip: number;
    new: number;
    inactive: number;
    birthday: number;
}

export default function ClientesPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [segment, setSegment] = useState<string | null>(null);

    useEffect(() => {
        loadClients();
    }, [segment]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const url = segment
                ? `/api/admin/clients?segment=${segment}`
                : '/api/admin/clients';

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setClients(result.data);
                setSummary(result.summary);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!search.trim()) {
            loadClients();
            return;
        }

        try {
            const response = await fetch(`/api/admin/clients?search=${search}`);
            const result = await response.json();

            if (result.success) {
                setClients(result.data);
            }
        } catch (error) {
            console.error('Erro ao buscar:', error);
        }
    };

    const filteredClients = clients;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <div className="mb-6 flex gap-3">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Painel
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                        <Home size={20} />
                        Ir para o Início
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        👥 Gestão de Clientes
                    </h1>
                    <p className="text-gray-600">
                        {summary && `${summary.total} clientes cadastrados`}
                    </p>
                </div>

                {/* Estatísticas */}
                {summary && (
                    <div className="grid md:grid-cols-5 gap-4 mb-6">
                        <button
                            onClick={() => setSegment(null)}
                            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition ${segment === null ? 'ring-2 ring-blue-500' : ''
                                }`}
                        >
                            <Users className="text-blue-500 mb-2" size={24} />
                            <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </button>

                        <button
                            onClick={() => setSegment('vip')}
                            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition ${segment === 'vip' ? 'ring-2 ring-yellow-500' : ''
                                }`}
                        >
                            <Crown className="text-yellow-500 mb-2" size={24} />
                            <div className="text-2xl font-bold text-gray-800">{summary.vip}</div>
                            <div className="text-sm text-gray-600">VIP</div>
                        </button>

                        <button
                            onClick={() => setSegment('new')}
                            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition ${segment === 'new' ? 'ring-2 ring-green-500' : ''
                                }`}
                        >
                            <UserPlus className="text-green-500 mb-2" size={24} />
                            <div className="text-2xl font-bold text-gray-800">{summary.new}</div>
                            <div className="text-sm text-gray-600">Novos</div>
                        </button>

                        <button
                            onClick={() => setSegment('inactive')}
                            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition ${segment === 'inactive' ? 'ring-2 ring-red-500' : ''
                                }`}
                        >
                            <UserX className="text-red-500 mb-2" size={24} />
                            <div className="text-2xl font-bold text-gray-800">{summary.inactive}</div>
                            <div className="text-sm text-gray-600">Inativos</div>
                        </button>

                        <button
                            onClick={() => setSegment('birthday')}
                            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition ${segment === 'birthday' ? 'ring-2 ring-pink-500' : ''
                                }`}
                        >
                            <Cake className="text-pink-500 mb-2" size={24} />
                            <div className="text-2xl font-bold text-gray-800">{summary.birthday}</div>
                            <div className="text-sm text-gray-600">Aniversariantes</div>
                        </button>
                    </div>
                )}

                {/* Busca */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou telefone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-semibold"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Lista de Clientes */}
                <div className="space-y-4">
                    {filteredClients.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">Nenhum cliente encontrado</p>
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div key={client.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-800">{client.name}</h3>
                                            {client.segments.isVIP && (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                    <Crown size={14} />
                                                    VIP
                                                </span>
                                            )}
                                            {client.segments.isNew && (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                    Novo
                                                </span>
                                            )}
                                            {client.segments.isInactive && (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                    Inativo
                                                </span>
                                            )}
                                            {client.segments.isBirthdayThisMonth && (
                                                <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                    <Cake size={14} />
                                                    Aniversário
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                📧 {client.email}
                                            </span>
                                            {client.phone && (
                                                <span className="flex items-center gap-1">
                                                    📱 {client.phone}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <span className="text-gray-600">
                                                Cliente desde: <strong>{new Date(client.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</strong>
                                            </span>
                                            {client.stats.lastAppointment && (
                                                <span className="text-gray-600">
                                                    Último agendamento: <strong>{new Date(client.stats.lastAppointment).toLocaleDateString('pt-BR')}</strong>
                                                </span>
                                            )}
                                            <span className="text-green-600 font-semibold">
                                                Total gasto: R$ {client.stats.totalSpent.toFixed(2)}
                                            </span>
                                            {client.birthDate && (
                                                <span className="text-gray-600">
                                                    🎂 Aniversário: <strong>{new Date(client.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            href={`/admin/clientes/${client.id}`}
                                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold"
                                        >
                                            Ver Histórico
                                        </Link>
                                        {client.email && (
                                            <a
                                                href={`mailto:${client.email}`}
                                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                                title="Enviar email"
                                            >
                                                <Mail size={20} />
                                            </a>
                                        )}
                                        {client.phone && (
                                            <a
                                                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}