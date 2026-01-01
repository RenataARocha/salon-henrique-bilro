import React, { useState } from 'react';
import { Tag, Check, X, Loader, Gift } from 'lucide-react';

interface CouponInputProps {
    serviceIds: string[];
    totalAmount: number;
    scheduledDate?: string;
    scheduledTime?: string;
    onCouponApplied: (couponData: any) => void;
}

interface AppliedCouponData {
    code: string;
    description: string;
    discountAmount: number;
    finalAmount: number;
}

const CouponInput: React.FC<CouponInputProps> = ({
    serviceIds,
    totalAmount,
    scheduledDate,
    scheduledTime,
    onCouponApplied
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInput, setShowInput] = useState(false);

    const validateCoupon = async () => {
        if (!couponCode.trim()) {
            setError('Digite um código de cupom');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo: couponCode.toUpperCase(),
                    valorServico: totalAmount,
                    serviceIds,
                    scheduledDate,
                    scheduledTime
                })
            });

            const data = await response.json();

            if (response.ok && data.valido) {
                setAppliedCoupon({
                    code: data.cupom.codigo,
                    description: data.cupom.descricao,
                    discountAmount: data.desconto.valorDesconto,
                    finalAmount: data.desconto.valorFinal
                });
                onCouponApplied(data);
                setError('');
            } else {
                setError(data.erro || 'Cupom inválido');
                setAppliedCoupon(null);
                onCouponApplied(null);
            }
        } catch (err) {
            setError('Erro ao validar cupom. Tente novamente.');
            setAppliedCoupon(null);
            onCouponApplied(null);
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
        setError('');
        onCouponApplied(null);
    };

    if (appliedCoupon) {
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <Check className="w-6 h-6 text-green-600 mr-2" />
                            <span className="text-green-800 font-bold text-lg">Cupom Aplicado!</span>
                        </div>

                        <div className="bg-white rounded-lg p-4 mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-semibold">🎟️ {appliedCoupon.code}</span>
                                <Gift className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-gray-600 text-sm">{appliedCoupon.description}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Subtotal:</span>
                                <span className="line-through">R$ {totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-700 font-bold">
                                <span>Desconto:</span>
                                <span>-R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t border-green-200">
                                <span>Total:</span>
                                <span className="text-green-600">R$ {appliedCoupon.finalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={removeCoupon}
                        className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Remover cupom"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    if (!showInput) {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Tag className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Tem um cupom de desconto?</p>
                <button
                    onClick={() => setShowInput(true)}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
                >
                    Adicionar Cupom
                </button>
            </div>
        );
    }

    return (
        <div className="border-2 border-pink-300 rounded-xl p-6 bg-pink-50">
            <div className="flex items-center mb-4">
                <Tag className="w-6 h-6 text-pink-600 mr-2" />
                <h3 className="font-bold text-gray-800">Cupom de Desconto</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            placeholder="Digite o código do cupom"
                            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        <button
                            onClick={validateCoupon}
                            disabled={loading || !couponCode.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                'Aplicar'
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 flex items-start p-3 bg-red-100 border border-red-300 rounded-lg">
                            <X className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-pink-200">
                    <span className="text-gray-600 text-sm">Não tem cupom?</span>
                    <button
                        onClick={() => {
                            setShowInput(false);
                            setCouponCode('');
                            setError('');
                        }}
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                    >
                        Continuar sem cupom
                    </button>
                </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs">
                    💡 <strong>Dica:</strong> Siga-nos nas redes sociais para cupons exclusivos!
                </p>
            </div>
        </div>
    );
};

export default CouponInput;