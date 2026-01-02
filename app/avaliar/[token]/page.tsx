// app/avaliar/[token]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Upload, Loader, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentData {
    user: {
        name: string;
        email: string;
    };
    service: {
        name: string;
        description: string;
    };
    date: string;
    canReview: boolean;
}

export default function AvaliarPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        verificarToken();
    }, [token]);

    const verificarToken = async () => {
        try {
            const response = await fetch(`/api/reviews/submit?token=${token}`);
            const result = await response.json();

            if (result.success) {
                setAppointmentData(result.data);
            } else {
                setError(result.error || 'Token inválido');
            }
        } catch (err) {
            setError('Erro ao verificar token');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Por favor, selecione uma avaliação de 1 a 5 estrelas');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/api/reviews/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    rating,
                    comment: comment.trim() || null,
                    images
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
            } else {
                alert(result.error || 'Erro ao enviar avaliação');
            }
        } catch (err) {
            alert('Erro ao enviar avaliação');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Avaliação Enviada!</h1>
                    <p className="text-gray-600 mb-6">
                        Obrigado pelo seu feedback! Sua avaliação será analisada e publicada em breve.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            💛 Como foi sua experiência?
                        </h1>
                        <p className="text-gray-600">
                            Avalie o serviço: <span className="font-semibold">{appointmentData?.service.name}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(appointmentData?.date || '').toLocaleDateString('pt-BR')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avaliação por Estrelas */}
                        <div className="text-center">
                            <label className="block text-lg font-medium text-gray-700 mb-4">
                                Quantas estrelas você dá?
                            </label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={48}
                                            className={`${star <= (hoverRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="mt-3 text-gray-600">
                                    {rating === 5 && '⭐ Excelente!'}
                                    {rating === 4 && '😊 Muito bom!'}
                                    {rating === 3 && '👍 Bom'}
                                    {rating === 2 && '😐 Regular'}
                                    {rating === 1 && '😞 Ruim'}
                                </p>
                            )}
                        </div>

                        {/* Comentário */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📝 Conte mais sobre sua experiência (opcional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                placeholder="O que você achou do atendimento, do resultado, do ambiente..."
                            />
                        </div>

                        {/* Upload de Fotos - Simplificado por enquanto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📸 Adicionar fotos (opcional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">
                                    Em breve você poderá adicionar fotos!
                                </p>
                            </div>
                        </div>

                        {/* Botão Enviar */}
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-bold rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'ENVIAR AVALIAÇÃO'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}