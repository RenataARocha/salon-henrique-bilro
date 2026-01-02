import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    comment: string;
    user: {
        name: string;
    };
    service: {
        name: string;
    };
    createdAt: string;
}

const ReviewsCarousel = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const response = await fetch('/api/reviews/public');
            const result = await response.json();

            if (result.success) {
                setReviews(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextReview = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prevReview = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    if (loading) {
        return (
            <div className="bg-gray-50 py-20">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return null;
    }

    const currentReview = reviews[currentIndex];

    return (
        <section className="bg-gradient-to-br from-pink-50 to-purple-50 py-20">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800 mb-3">
                        💬 O QUE NOSSOS CLIENTES DIZEM
                    </h2>
                    <p className="text-gray-600">
                        Experiências reais de quem já confiou no nosso trabalho
                    </p>
                </div>

                <div className="relative max-w-3xl mx-auto">
                    {/* Card da Avaliação */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                        {/* Estrelas */}
                        <div className="flex justify-center gap-1 mb-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={24}
                                    className={`${i < currentReview.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Comentário */}
                        <blockquote className="text-xl text-gray-700 text-center mb-8 italic leading-relaxed">
                            "{currentReview.comment}"
                        </blockquote>

                        {/* Autor */}
                        <div className="text-center">
                            <p className="font-bold text-gray-800 text-lg">
                                {currentReview.user.name}
                            </p>
                            <p className="text-gray-600">
                                {currentReview.service.name} • {new Date(currentReview.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>

                    {/* Navegação */}
                    {reviews.length > 1 && (
                        <>
                            <button
                                onClick={prevReview}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition"
                                aria-label="Avaliação anterior"
                            >
                                <ChevronLeft size={24} className="text-gray-600" />
                            </button>

                            <button
                                onClick={nextReview}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition"
                                aria-label="Próxima avaliação"
                            >
                                <ChevronRight size={24} className="text-gray-600" />
                            </button>
                        </>
                    )}

                    {/* Indicadores */}
                    {reviews.length > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {reviews.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 rounded-full transition ${index === currentIndex
                                            ? 'bg-pink-500 w-8'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    aria-label={`Ir para avaliação ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ReviewsCarousel;