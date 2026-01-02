import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    comment: string;
    user: {
        name: string;
    };
    createdAt: string;
}

interface ReviewsStats {
    average: number;
    total: number;
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

interface ReviewsSectionProps {
    serviceId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ serviceId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [serviceId]);

    const loadReviews = async () => {
        try {
            const response = await fetch(`/api/reviews/service/${serviceId}`);
            const result = await response.json();

            if (result.success) {
                setReviews(result.data.reviews);
                setStats(result.data.stats);
            }
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!stats || reviews.length === 0) {
        return (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Este serviço ainda não possui avaliações</p>
            </div>
        );
    }

    const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Resumo */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-800 mb-2">
                            {stats.average.toFixed(1)}
                        </div>
                        <div className="flex gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={20}
                                    className={`${i < Math.round(stats.average)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-sm text-gray-600">
                            {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
                        </div>
                    </div>

                    {/* Distribuição */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.distribution[rating as keyof typeof stats.distribution];
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                            return (
                                <div key={rating} className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 w-8">
                                        {rating}★
                                    </span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-yellow-400 h-full rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
                {displayedReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="font-semibold text-gray-800 mb-1">
                                    {review.user.name}
                                </div>
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
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Botão Ver Mais */}
            {reviews.length > 3 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-3 border-2 border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 transition font-semibold"
                >
                    {showAll ? 'Ver Menos' : `Ver Todas as ${reviews.length} Avaliações`}
                </button>
            )}
        </div>
    );
};

export default ReviewsSection;