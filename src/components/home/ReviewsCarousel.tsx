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
        <section className="py-14 sm:py-16 md:py-20 
                                bg-gradient-to-br from-[#fdfbf7] via-[#e2d1a4] to-[#fdfbf7]">

            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Título */}
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 leading-snug">
                        💬 O QUE NOSSOS CLIENTES DIZEM
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                        Experiências reais de quem já confiou no nosso trabalho
                    </p>
                </div>

                <div className="relative max-w-3xl mx-auto">

                    {/* Card da Avaliação */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">

                        {/* Estrelas */}
                        <div className="flex justify-center gap-1 mb-4 sm:mb-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={20}
                                    className={`sm:w-6 sm:h-6 ${i < currentReview.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Comentário */}
                        <blockquote className="text-base sm:text-lg md:text-xl text-gray-700 text-center mb-6 sm:mb-8 italic leading-relaxed px-2 sm:px-4">
                            &quot;{currentReview.comment}&quot;
                        </blockquote>

                        {/* Autor */}
                        <div className="text-center">
                            <p className="font-bold text-gray-800 text-base sm:text-lg">
                                {currentReview.user.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                                {currentReview.service.name} • {new Date(currentReview.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>

                    {/* Navegação */}
                    {reviews.length > 1 && (
                        <>
                            <button
                                onClick={prevReview}
                                className="absolute left-0 top-1/2 -translate-y-1/2 
                                       -translate-x-2 sm:-translate-x-6 md:-translate-x-16
                                       bg-white rounded-full p-2 sm:p-3 shadow-lg 
                                       hover:bg-gray-50 transition"
                                aria-label="Avaliação anterior"
                            >
                                <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                            </button>

                            <button
                                onClick={nextReview}
                                className="absolute right-0 top-1/2 -translate-y-1/2 
                                       translate-x-2 sm:translate-x-6 md:translate-x-16
                                       bg-white rounded-full p-2 sm:p-3 shadow-lg 
                                       hover:bg-gray-50 transition"
                                aria-label="Próxima avaliação"
                            >
                                <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                            </button>
                        </>
                    )}

                    {/* Indicadores */}
                    {reviews.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6 sm:mt-8">
                            {reviews.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? 'bg-pink-500 w-6 sm:w-8'
                                        : 'bg-gray-300 hover:bg-gray-400 w-2'
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