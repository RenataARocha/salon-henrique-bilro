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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { client, stats, appointments, reviews } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <Link
                    href="/admin/clientes"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold mb-6"
                >
                    <ArrowLeft size={20} />
                    Voltar aos Clientes
                </Link>

                {/* Informações do Cliente */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {client.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{client.name}</h1>

                            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span>{client.email}</span>
                                </div>
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.birthDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>Aniversário: {new Date(client.birthDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600">
                                Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="text-blue-500" size={24} />
                        </div>
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {stats.completedAppointments}
                        </div>
                        <div className="text-sm text-gray-600">Agendamentos Concluídos</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="text-green-500" size={24} />
                        </div>
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            R$ {stats.totalSpent.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Total Gasto</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-purple-500" size={24} />
                        </div>
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            R$ {stats.avgTicket.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Ticket Médio</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Star className="text-yellow-500" size={24} />
                        </div>
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
                        </div>
                        <div className="text-sm text-gray-600">Avaliação Média</div>
                    </div>
                </div>

                {/* Taxa de Comparecimento */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Taxa de Comparecimento
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div
                            className={`h-full rounded-full ${stats.attendanceRate >= 80 ? 'bg-green-500' :
                                    stats.attendanceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${stats.attendanceRate}%` }}
                        ></div>
                    </div>
                    <p className="text-gray-600">
                        {stats.attendanceRate.toFixed(1)}% de comparecimento
                    </p>
                </div>

                {/* Top Serviços */}
                {stats.topServices.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Award size={24} className="text-pink-500" />
                            Serviços Preferidos
                        </h3>
                        <div className="space-y-3">
                            {stats.topServices.map((service, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800">{service.name}</p>
                                        <p className="text-sm text-gray-600">{service.count} vezes</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            R$ {service.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Histórico de Agendamentos */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Histórico de Agendamentos ({appointments.length})
                    </h3>
                    <div className="space-y-3">
                        {appointments.slice(0, 10).map((apt) => (
                            <div key={apt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800">{apt.service.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">
                                        R$ {(apt.finalPrice || apt.service.price).toFixed(2)}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                apt.status === 'NO_SHOW' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Avaliações */}
                {reviews.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Avaliações ({reviews.length})
                        </h3>
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={`${i < review.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {review.service.name} • {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-700">{review.comment}</p>
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