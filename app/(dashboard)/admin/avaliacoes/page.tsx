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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-base sm:text-xl text-center">
                    Carregando...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                        Gerenciar Avaliações
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        Modere as avaliações dos clientes
                    </p>
                </motion.div>

                {/* Navegação */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                    <Link
                        href="/admin"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200 text-sm sm:text-base"
                    >
                        <ArrowLeft size={18} className="sm:w-[20px] sm:h-[20px]" />
                        Painel
                    </Link>

                    <Link
                        href="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                    >
                        <Home size={18} className="sm:w-[20px] sm:h-[20px]" />
                        Voltar ao início
                    </Link>
                </div>

                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {[
                            { label: 'Total', value: stats.total, color: 'blue' },
                            { label: 'Pendentes', value: stats.pending, color: 'orange' },
                            { label: 'Aprovadas', value: stats.approved, color: 'green' },
                            { label: 'Reprovadas', value: stats.rejected, color: 'red' },
                            { label: 'Média Geral', value: `${stats.averageRating.toFixed(1)}★`, color: 'yellow' }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="bg-white rounded-lg shadow-sm p-3 sm:p-4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <div className={`text-xl sm:text-3xl font-bold text-${stat.color}-600 mb-1`}>
                                    {stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Filtros */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

                        {/* Busca */}
                        <div className="w-full sm:flex-1">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, comentário ou serviço..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                            {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${filter === f
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
                <div className="space-y-3 sm:space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
                            <Star className="mx-auto mb-3 sm:mb-4 text-gray-400" size={40} />
                            <p className="text-gray-500 text-base sm:text-lg">
                                Nenhuma avaliação encontrada
                            </p>
                        </div>
                    ) : (
                        filteredReviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">

                                            <span className="font-semibold text-gray-800 text-sm sm:text-base">
                                                {review.user.name}
                                            </span>

                                            {/* Estrelas */}
                                            <div className="flex gap-1">
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

                                            {/* Destaque */}
                                            {review.featured && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs rounded-full flex items-center gap-1">
                                                    <Award size={10} />
                                                    Destaque
                                                </span>
                                            )}

                                            {/* Status */}
                                            <span
                                                className={`px-2 py-1 text-[10px] sm:text-xs rounded-full ${review.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : review.status === 'REJECTED'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                    }`}
                                            >
                                                {review.status === 'APPROVED'
                                                    ? 'Aprovada'
                                                    : review.status === 'REJECTED'
                                                        ? 'Reprovada'
                                                        : 'Pendente'}
                                            </span>
                                        </div>

                                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                            {review.service.name} • {new Date(review.appointment.date).toLocaleDateString('pt-BR')}
                                        </p>

                                        {editingId === review.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editComment}
                                                    onChange={(e) => setEditComment(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
                                                    rows={3}
                                                />

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <button
                                                        onClick={() => handleEdit(review.id)}
                                                        className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    >
                                                        Salvar
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditComment('');
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            review.comment && (
                                                <p className="text-gray-700 italic text-sm sm:text-base break-words">
                                                    &quot;{review.comment}&quot;
                                                </p>
                                            )
                                        )}
                                    </div>

                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-2 sm:mt-0 sm:ml-4">
                                        {review.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleModerate(review.id, 'approve')}
                                                    className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                                    title="Aprovar"
                                                >
                                                    <Check size={18} className="sm:w-[20px] sm:h-[20px]" />
                                                </button>

                                                <button
                                                    onClick={() => handleModerate(review.id, 'reject')}
                                                    className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title="Reprovar"
                                                >
                                                    <X size={18} className="sm:w-[20px] sm:h-[20px]" />
                                                </button>
                                            </>
                                        )}

                                        {review.status === 'APPROVED' && !review.featured && (
                                            <button
                                                onClick={() => handleModerate(review.id, 'feature')}
                                                className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                                                title="Destacar"
                                            >
                                                <Award size={18} className="sm:w-[20px] sm:h-[20px]" />
                                            </button>
                                        )}

                                        {review.featured && (
                                            <button
                                                onClick={() => handleModerate(review.id, 'unfeature')}
                                                className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                title="Remover destaque"
                                            >
                                                <Award size={18} className="sm:w-[20px] sm:h-[20px]" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setEditingId(review.id);
                                                setEditComment(review.comment || '');
                                            }}
                                            className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} className="sm:w-[20px] sm:h-[20px]" />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                            title="Deletar"
                                        >
                                            <Trash2 size={18} className="sm:w-[20px] sm:h-[20px]" />
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