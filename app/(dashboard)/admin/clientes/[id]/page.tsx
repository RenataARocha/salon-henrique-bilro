// app/(dashboard)/admin/clientes/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, DollarSign, Star, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';

interface ClientDetails {
    client: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        birthDate: string | null;
        createdAt: string;
    };
    stats: {
        totalAppointments: number;
        completedAppointments: number;
        totalSpent: number;
        avgTicket: number;
        attendanceRate: number;
        avgRating: number;
        daysSinceLastAppointment: number | null;
        topServices: Array<{ name: string; count: number; revenue: number }>;
    };
    appointments: any[];
    reviews: any[];
}

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [data, setData] = useState<ClientDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClientDetails();
    }, [clientId]);

    const loadClientDetails = async () => {
        try {
            const response = await fetch(`/api/admin/clients/${clientId}`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                alert('Cliente não encontrado');
                router.push('/admin/clientes');
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { client, stats, appointments, reviews } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <Link
                    href="/admin/clientes"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold mb-4 sm:mb-6 text-sm sm:text-base"
                >
                    <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                    Voltar aos Clientes
                </Link>

                {/* Informações do Cliente */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">

                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 break-words">
                                {client.name}
                            </h1>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">

                                <div className="flex items-center gap-2 break-words">
                                    <Mail size={14} className="sm:w-4 sm:h-4" />
                                    <span>{client.email}</span>
                                </div>

                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="sm:w-4 sm:h-4" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}

                                {client.birthDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="sm:w-4 sm:h-4" />
                                        <span>
                                            Aniversário: {new Date(client.birthDate).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm sm:text-base">
                                Cliente desde{' '}
                                {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="text-blue-500" size={20} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                            {stats.completedAppointments}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Agendamentos Concluídos
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="text-green-500" size={20} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 break-words">
                            R$ {stats.totalSpent.toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Total Gasto
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-purple-500" size={20} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 break-words">
                            R$ {stats.avgTicket.toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Ticket Médio
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Star className="text-yellow-500" size={20} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Avaliação Média
                        </div>
                    </div>
                </div>

                {/* Taxa de Comparecimento */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                        Taxa de Comparecimento
                    </h3>

                    <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-2">
                        <div
                            className={`h-full rounded-full ${stats.attendanceRate >= 80
                                ? 'bg-green-500'
                                : stats.attendanceRate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${stats.attendanceRate}%` }}
                        ></div>
                    </div>

                    <p className="text-gray-600 text-sm sm:text-base">
                        {stats.attendanceRate.toFixed(1)}% de comparecimento
                    </p>
                </div>

                {/* Top Serviços */}
                {stats.topServices.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <Award size={20} className="text-pink-500" />
                            Serviços Preferidos
                        </h3>
                        <div className="space-y-3">
                            {stats.topServices.map((service, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {service.name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {service.count} vezes
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="font-bold text-green-600 break-words text-sm sm:text-base">
                                            R$ {service.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Histórico de Agendamentos */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                        Histórico de Agendamentos ({appointments.length})
                    </h3>
                    <div className="space-y-3">
                        {appointments.slice(0, 10).map((apt) => (
                            <div key={apt.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                        {apt.service.name}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-bold text-gray-800 text-sm sm:text-base">
                                        R$ {(apt.finalPrice || apt.service.price).toFixed(2)}
                                    </p>
                                    <span
                                        className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${apt.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-800'
                                                : apt.status === 'CANCELLED'
                                                    ? 'bg-red-100 text-red-800'
                                                    : apt.status === 'NO_SHOW'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Avaliações */}
                {reviews.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                            Avaliações ({reviews.length})
                        </h3>
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <div className="flex">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={`${i < review.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            {review.service.name} • {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-700 text-sm sm:text-base">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}