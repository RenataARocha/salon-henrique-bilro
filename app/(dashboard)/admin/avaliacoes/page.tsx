// app/(dashboard)/admin/avaliacoes/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, Edit2, Award, Search, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Review {
    id: string;
    rating: number;
    comment: string;
    status: string;
    featured: boolean;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    service: {
        name: string;
    };
    appointment: {
        date: string;
        time: string;
    };
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    featured: number;
    averageRating: number;
}

export default function AdminAvaliacoesPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');

    useEffect(() => {
        loadReviews();
    }, [filter]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const url = filter === 'all'
                ? '/api/admin/reviews'
                : `/api/admin/reviews?status=${filter}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setReviews(result.data);
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (id: string, action: string) => {
        try {
            const response = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });

            const result = await response.json();

            if (result.success) {
                loadReviews();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Erro ao moderar:', error);
            alert('Erro ao moderar avaliação');
        }
    };

    const handleEdit = async (id: string) => {
        if (!editComment.trim()) {
            alert('Digite um comentário');
            return;
        }

        try {
            const response = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    action: 'edit',
                    comment: editComment
                })
            });

            const result = await response.json();

            if (result.success) {
                setEditingId(null);
                setEditComment('');
                loadReviews();
            }
        } catch (error) {
            console.error('Erro ao editar:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente deletar esta avaliação?')) return;

        try {
            const response = await fetch(`/api/admin/reviews?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                loadReviews();
            }
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchSearch =
            review.user.name.toLowerCase().includes(search.toLowerCase()) ||
            review.comment?.toLowerCase().includes(search.toLowerCase()) ||
            review.service.name.toLowerCase().includes(search.toLowerCase());

        return matchSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <div className="mb-6 flex justify-end gap-3">
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
                </div>

                {/* Header */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-6 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Gerenciar Avaliações
                    </h1>
                    <p className="text-gray-600">
                        Modere as avaliações dos clientes
                    </p>
                </motion.div>

                {/* Estatísticas */}
                {stats && (
                    <div className="grid md:grid-cols-5 gap-4 mb-6">
                        {[
                            { label: 'Total', value: stats.total, color: 'blue' },
                            { label: 'Pendentes', value: stats.pending, color: 'orange' },
                            { label: 'Aprovadas', value: stats.approved, color: 'green' },
                            { label: 'Reprovadas', value: stats.rejected, color: 'red' },
                            { label: 'Média Geral', value: `${stats.averageRating.toFixed(1)}★`, color: 'yellow' }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="bg-white rounded-lg shadow-sm p-4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <div className={`text-3xl font-bold text-${stat.color}-600 mb-1`}>
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Filtros */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-6 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, comentário ou serviço..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg transition-colors ${filter === f
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {f === 'all' ? 'Todas' :
                                        f === 'PENDING' ? 'Pendentes' :
                                            f === 'APPROVED' ? 'Aprovadas' : 'Reprovadas'}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Lista de Avaliações */}
                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Star className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-500 text-lg">Nenhuma avaliação encontrada</p>
                        </div>
                    ) : (
                        filteredReviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                className="bg-white rounded-lg shadow-sm p-6"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-semibold text-gray-800">
                                                {review.user.name}
                                            </span>
                                            <div className="flex gap-1">
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
                                            {review.featured && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                                                    <Award size={12} />
                                                    Destaque
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs rounded-full ${review.status === 'APPROVED'
                                                ? 'bg-green-100 text-green-800'
                                                : review.status === 'REJECTED'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {review.status === 'APPROVED' ? 'Aprovada' :
                                                    review.status === 'REJECTED' ? 'Reprovada' : 'Pendente'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2">
                                            {review.service.name} • {new Date(review.appointment.date).toLocaleDateString('pt-BR')}
                                        </p>

                                        {editingId === review.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editComment}
                                                    onChange={(e) => setEditComment(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(review.id)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditComment('');
                                                        }}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            review.comment && (
                                                <p className="text-gray-700 italic">&quot;{review.comment}&quot;</p>
                                            )
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        {review.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleModerate(review.id, 'approve')}
                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                                    title="Aprovar"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleModerate(review.id, 'reject')}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title="Reprovar"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </>
                                        )}

                                        {review.status === 'APPROVED' && !review.featured && (
                                            <button
                                                onClick={() => handleModerate(review.id, 'feature')}
                                                className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                                                title="Destacar"
                                            >
                                                <Award size={20} />
                                            </button>
                                        )}

                                        {review.featured && (
                                            <button
                                                onClick={() => handleModerate(review.id, 'unfeature')}
                                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                title="Remover destaque"
                                            >
                                                <Award size={20} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setEditingId(review.id);
                                                setEditComment(review.comment || '');
                                            }}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                            title="Editar"
                                        >
                                            <Edit2 size={20} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                            title="Deletar"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}