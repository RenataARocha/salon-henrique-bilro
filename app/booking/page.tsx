// app/booking/page.tsx - Corrigido com TypeScript

'use client';

import { useState } from 'react';
import CouponInput from '@/components/booking/CouponInput';

interface Service {
    id: string;
    name: string;
    price: number;
}

interface CouponData {
    valido: boolean;
    cupom: {
        id: string;
        codigo: string;
        descricao: string;
    };
    desconto: {
        valorOriginal: number;
        valorDesconto: number;
        valorFinal: number;
    };
}

export default function BookingPage() {
    const [selectedServices] = useState<Service[]>([
        { id: '1', name: 'Corte de Cabelo', price: 80 },
        { id: '2', name: 'Escova', price: 50 }
    ]);

    const [scheduledDate] = useState('2026-01-15');
    const [scheduledTime] = useState('14:00');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);

    const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const total = appliedCoupon ? appliedCoupon.desconto.valorFinal : subtotal;

    const handleCouponApplied = (couponData: CouponData | null) => {
        setAppliedCoupon(couponData);
    };

    const handleBooking = async () => {
        const bookingData = {
            serviceId: selectedServices[0].id, // Primeiro serviço
            date: scheduledDate,
            time: scheduledTime,
            notes: '',
            couponCode: appliedCoupon?.cupom.codigo || null
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Agendamento criado com sucesso!');
                window.location.href = '/bookings';
            } else {
                alert(result.error || 'Erro ao criar agendamento');
            }
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            alert('Erro ao criar agendamento');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Finalizar Agendamento</h1>

            {/* Serviços Selecionados */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-4">Serviços Selecionados</h2>
                {selectedServices.map(service => (
                    <div key={service.id} className="flex justify-between py-2">
                        <span>{service.name}</span>
                        <span className="font-semibold">R$ {service.price.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Data e Hora */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-4">Data e Horário</h2>
                <p>📅 {new Date(scheduledDate).toLocaleDateString('pt-BR')}</p>
                <p>⏰ {scheduledTime}</p>
            </div>

            {/* Campo de Cupom */}
            <div className="mb-6">
                <CouponInput
                    serviceIds={selectedServices.map(s => s.id)}
                    totalAmount={subtotal}
                    scheduledDate={scheduledDate}
                    scheduledTime={scheduledTime}
                    onCouponApplied={handleCouponApplied}
                />
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-4">Resumo do Pedido</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                        <div className="flex justify-between text-green-600 font-semibold">
                            <span>Desconto ({appliedCoupon.cupom.codigo}):</span>
                            <span>-R$ {appliedCoupon.desconto.valorDesconto.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-3 border-t">
                        <span>Total:</span>
                        <span className={appliedCoupon ? 'text-green-600' : ''}>
                            R$ {total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleBooking}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 transition"
            >
                Confirmar Agendamento
            </button>
        </div>
    );
}