"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import { Tag, CheckCircle, XCircle, Loader2, Percent, DollarSign } from 'lucide-react';
import Image from 'next/image';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    images?: string[]; // ← ADICIONADO
}

interface CupomValidado {
    valido: boolean;
    erro?: string;
    cupom?: {
        id: string;
        codigo: string;
        descricao: string;
        tipoDesconto: 'PERCENTUAL' | 'FIXO';
        valorDesconto: number;
    };
    desconto?: {
        valorOriginal: number;
        valorDesconto: number;
        valorFinal: number;
        percentual: number | null;
    };
}

// ========================================
// COMPONENTE: Card de Serviço com Carrossel
// ========================================
function ServiceCardWithCarousel({
    service,
    isSelected,
    onSelect
}: {
    service: Service;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const hasImages = service.images && service.images.length > 0;

    useEffect(() => {
        if (!hasImages || service.images!.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % service.images!.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [hasImages, service.images]);

    return (
        <div
            onClick={onSelect}
            className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected
                    ? "border-gold shadow-lg"
                    : "border-gray-200 hover:border-gold hover:shadow-md"
                }`}
        >
            {/* Carrossel de Imagens */}
            {hasImages ? (
                <div className="relative h-48 bg-gray-100">
                    {service.images!.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${service.name} - ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                unoptimized={image.startsWith('http')}
                            />
                        </div>
                    ))}

                    {/* Indicadores de imagem */}
                    {service.images!.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                            {service.images!.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`h-1.5 rounded-full transition-all ${index === currentImageIndex
                                            ? 'bg-white w-6'
                                            : 'bg-white/50 w-1.5 hover:bg-white/80'
                                        }`}
                                    aria-label={`Ver imagem ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Sem imagem</span>
                </div>
            )}

            {/* Conteúdo do Card - CORRIGIDO PROBLEMA DE COR */}
            <div className={`p-6 ${isSelected ? 'bg-gold/5' : 'bg-white'}`}>
                <h3 className="text-xl font-bold text-charcoal mb-2">
                    {service.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                </p>
                <div className="flex justify-between items-center">
                    {/* ← CORRIGIDO: Agora o preço sempre fica visível */}
                    <span className="text-2xl font-bold text-gold">
                        R$ {service.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                        {service.duration} min
                    </span>
                </div>
            </div>
        </div>
    );
}

// ========================================
// COMPONENTE: StepIndicator
// ========================================
function StepIndicator({
    number,
    active,
    completed,
    label,
}: {
    number: number;
    active?: boolean;
    completed?: boolean;
    label: string;
}) {
    return (
        <div className="flex flex-col items-center">
            <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${completed
                        ? "bg-gold text-white"
                        : active
                            ? "bg-gold text-white"
                            : "bg-gray-300 text-gray-600"
                    }`}
            >
                {completed ? "✓" : number}
            </div>
            <span className={`text-xs mt-2 font-semibold ${active ? 'text-gold' : 'text-gray-600'}`}>
                {label}
            </span>
        </div>
    );
}

// ========================================
// COMPONENTE: InfoBox
// ========================================
function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-beige/50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-lg font-bold text-charcoal">{value}</p>
        </div>
    );
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AgendarPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);

    // Dados do agendamento
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

    // Estados do cupom
    const [codigoCupom, setCodigoCupom] = useState('');
    const [validandoCupom, setValidandoCupom] = useState(false);
    const [cupomValidado, setCupomValidado] = useState<CupomValidado | null>(null);
    const [mostrarCampoCupom, setMostrarCampoCupom] = useState(false);

    // Buscar serviços ao carregar
    useEffect(() => {
        fetchServices();
    }, []);

    // Redirecionar se não estiver logado
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            if (data.success) {
                setServices(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
        }
    };

    const fetchAvailableSlots = async (date: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/available-slots?date=${date}`);
            const data = await res.json();

            if (data.success) {
                setAvailableSlots(data.data);
                if (data.data.length === 0) {
                    alert(data.message || "Não há horários disponíveis para esta data");
                }
            }
        } catch (error) {
            console.error("Erro ao buscar horários:", error);
            alert("Erro ao buscar horários disponíveis");
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedTime("");
        fetchAvailableSlots(date);
    };

    const validarCupom = async () => {
        if (!codigoCupom.trim()) {
            alert('Digite um código de cupom');
            return;
        }

        if (!selectedService) {
            alert('Selecione um serviço primeiro');
            return;
        }

        setValidandoCupom(true);
        setCupomValidado(null);

        try {
            const response = await fetch('/api/cupons/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo: codigoCupom.toUpperCase(),
                    valorServico: selectedService.price
                })
            });

            const data: CupomValidado = await response.json();
            setCupomValidado(data);
        } catch (error) {
            console.error('Erro ao validar cupom:', error);
            setCupomValidado({
                valido: false,
                erro: 'Erro ao validar cupom. Tente novamente.'
            });
        } finally {
            setValidandoCupom(false);
        }
    };

    const removerCupom = () => {
        setCodigoCupom('');
        setCupomValidado(null);
    };

    const valorFinal = cupomValidado?.valido
        ? cupomValidado.desconto?.valorFinal || 0
        : selectedService?.price || 0;

    const handleSubmit = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            alert("Por favor, preencha todos os campos obrigatórios");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    date: selectedDate,
                    time: selectedTime,
                    notes,
                    paymentMethod: selectedPaymentMethod,
                    cupomId: cupomValidado?.valido ? cupomValidado.cupom?.id : null,
                    valorOriginal: selectedService.price,
                    valorDesconto: cupomValidado?.valido ? cupomValidado.desconto?.valorDesconto : 0,
                    valorFinal: valorFinal
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert(
                    "🎉 Agendamento realizado com sucesso!\n\nVocê receberá uma confirmação no WhatsApp 24h antes."
                );
                router.push("/meus-agendamentos");
            } else {
                alert(data.error || "Erro ao criar agendamento");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao criar agendamento");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-beige flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 2);
        return maxDate.toISOString().split("T")[0];
    };

    return (
        <>
            <Navbar />
            <div className="h-20" />

            <div className="min-h-screen bg-beige py-12">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                            Agendar Serviço
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Escolha seu serviço, data e horário preferido
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex justify-center mb-12">
                        <div className="flex items-center space-x-4">
                            <StepIndicator
                                number={1}
                                active={step === 1}
                                completed={step > 1}
                                label="Serviço"
                            />
                            <div className="w-12 h-1 bg-gray-300"></div>
                            <StepIndicator
                                number={2}
                                active={step === 2}
                                completed={step > 2}
                                label="Data/Hora"
                            />
                            <div className="w-12 h-1 bg-gray-300"></div>
                            <StepIndicator
                                number={3}
                                active={step === 3}
                                label="Confirmar"
                            />
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* STEP 1: Escolher Serviço */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-charcoal mb-6">
                                    Escolha o Serviço
                                </h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {services.map((service) => (
                                        <ServiceCardWithCarousel
                                            key={service.id}
                                            service={service}
                                            isSelected={selectedService?.id === service.id}
                                            onSelect={() => {
                                                setSelectedService(service);
                                                setCupomValidado(null);
                                                setCodigoCupom('');
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedService}
                                    className="w-full bg-gradient-gold text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Escolher Data e Hora */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gold hover:underline mb-4"
                                >
                                    ← Voltar
                                </button>

                                <h2 className="text-2xl font-bold text-charcoal mb-6">
                                    Escolha Data e Horário
                                </h2>

                                {/* Serviço selecionado */}
                                <div className="bg-beige/50 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-gray-600 mb-1">
                                        Serviço selecionado:
                                    </p>
                                    <p className="text-lg font-bold text-charcoal">
                                        {selectedService?.name}
                                    </p>
                                    <p className="text-gold font-semibold">
                                        R$ {selectedService?.price.toFixed(2)}
                                    </p>
                                </div>

                                {/* Campo de Cupom */}
                                <div className="space-y-3">
                                    {!mostrarCampoCupom && !cupomValidado?.valido && (
                                        <button
                                            type="button"
                                            onClick={() => setMostrarCampoCupom(true)}
                                            className="flex items-center gap-2 text-gold hover:text-yellow-600 transition-colors text-sm font-semibold"
                                        >
                                            <Tag size={18} />
                                            🎉 Tenho um cupom de desconto
                                        </button>
                                    )}

                                    {(mostrarCampoCupom || cupomValidado) && (
                                        <div className="bg-gradient-to-r from-gold/10 to-yellow-50 rounded-xl p-5 border-2 border-gold/30">
                                            <label className="block text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                                                <Tag size={18} className="text-gold" />
                                                Cupom de Desconto
                                            </label>

                                            {cupomValidado?.valido ? (
                                                <div className="space-y-3">
                                                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-2">
                                                                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                                                                <div>
                                                                    <p className="font-bold text-green-900">{cupomValidado.cupom?.codigo}</p>
                                                                    <p className="text-sm text-green-700">{cupomValidado.cupom?.descricao}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={removerCupom}
                                                                className="text-green-600 hover:text-green-700 text-sm font-medium ml-2"
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                                                        <div className="flex justify-between text-gray-600">
                                                            <span>Valor original:</span>
                                                            <span>R$ {selectedService?.price.toFixed(2)}</span>
                                                        </div>

                                                        <div className="flex justify-between text-green-600 font-semibold">
                                                            <span className="flex items-center gap-1">
                                                                {cupomValidado.cupom?.tipoDesconto === 'PERCENTUAL' ? (
                                                                    <>
                                                                        <Percent size={14} />
                                                                        Desconto ({cupomValidado.cupom?.valorDesconto}%):
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DollarSign size={14} />
                                                                        Desconto:
                                                                    </>
                                                                )}
                                                            </span>
                                                            <span>- R$ {cupomValidado.desconto?.valorDesconto.toFixed(2)}</span>
                                                        </div>

                                                        <div className="flex justify-between text-lg font-bold text-charcoal pt-2 border-t border-gray-200">
                                                            <span>Total a pagar:</span>
                                                            <span className="text-gold">R$ {valorFinal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={codigoCupom}
                                                            onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                                                            onKeyPress={(e) => e.key === 'Enter' && validarCupom()}
                                                            placeholder="Digite o código do cupom"
                                                            disabled={validandoCupom}
                                                            className="flex-1 px-4 py-3 border-2 border-gold/30 rounded-lg focus:border-gold focus:outline-none uppercase font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={validarCupom}
                                                            disabled={validandoCupom || !codigoCupom.trim()}
                                                            className="px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
                                                        >
                                                            {validandoCupom ? (
                                                                <>
                                                                    <Loader2 size={18} className="animate-spin" />
                                                                    Validando...
                                                                </>
                                                            ) : (
                                                                'Aplicar'
                                                            )}
                                                        </button>
                                                    </div>

                                                    {cupomValidado && !cupomValidado.valido && (
                                                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                                                            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                                                            <p className="text-sm text-red-700">{cupomValidado.erro}</p>
                                                        </div>
                                                    )}

                                                    {mostrarCampoCupom && !cupomValidado && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMostrarCampoCupom(false);
                                                                setCodigoCupom('');
                                                            }}
                                                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                                        >
                                                            Não tenho cupom
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Seletor de data */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-charcoal">
                                        Data do Agendamento *
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                                    />
                                </div>

                                {/* Horários disponíveis */}
                                {selectedDate && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-charcoal">
                                            Horário Disponível *
                                        </label>

                                        {loading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                                {availableSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedTime(slot)}
                                                        className={`py-3 px-4 rounded-lg font-semibold transition-all ${selectedTime === slot
                                                                ? "bg-gold text-white shadow-lg"
                                                                : "bg-white border-2 border-gray-300 text-charcoal hover:border-gold"
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : selectedDate ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                <p className="text-gray-600">Nenhum horário disponível para esta data</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Observações */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-charcoal">
                                        Observações (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Alguma observação especial para seu agendamento?"
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!selectedDate || !selectedTime}
                                    className="w-full bg-gradient-gold text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar
                                </button>
                            </div>
                        )}

                        {/* STEP 3: Confirmar */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-gold hover:underline mb-4"
                                >
                                    ← Voltar
                                </button>

                                <h2 className="text-2xl font-bold text-charcoal mb-6">
                                    Confirmar Agendamento
                                </h2>

                                {/* Resumo do Agendamento */}
                                <div className="bg-beige/30 rounded-xl p-6 space-y-4">
                                    <h3 className="font-bold text-lg text-charcoal border-b border-gray-300 pb-2">
                                        Resumo do Agendamento
                                    </h3>

                                    <div className="space-y-3">
                                        <InfoBox
                                            label="Serviço"
                                            value={selectedService?.name || ""}
                                        />

                                        <InfoBox
                                            label="Data"
                                            value={new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        />

                                        <InfoBox label="Horário" value={selectedTime} />

                                        <InfoBox
                                            label="Duração"
                                            value={`${selectedService?.duration} minutos`}
                                        />

                                        {notes && <InfoBox label="Observações" value={notes} />}
                                    </div>
                                </div>

                                {/* Sistema de Cupom */}
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg text-charcoal flex items-center gap-2">
                                            <Tag className="h-5 w-5 text-gold" />
                                            Cupom de Desconto
                                        </h3>
                                        {!mostrarCampoCupom && !cupomValidado?.valido && (
                                            <button
                                                onClick={() => setMostrarCampoCupom(true)}
                                                className="text-sm text-gold hover:underline font-semibold"
                                            >
                                                Tenho um cupom
                                            </button>
                                        )}
                                    </div>

                                    {(mostrarCampoCupom || cupomValidado?.valido) && (
                                        <div className="space-y-3">
                                            {!cupomValidado?.valido ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={codigoCupom}
                                                        onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                                                        placeholder="Digite o código do cupom"
                                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 uppercase"
                                                        disabled={validandoCupom}
                                                    />
                                                    <button
                                                        onClick={validarCupom}
                                                        disabled={validandoCupom || !codigoCupom.trim()}
                                                        className="px-6 py-2 bg-gold text-white rounded-lg font-semibold hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {validandoCupom ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Validando...
                                                            </>
                                                        ) : (
                                                            'Aplicar'
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div className="flex-1">
                                                                <p className="font-bold text-green-800 mb-1">
                                                                    Cupom "{cupomValidado.cupom?.codigo}" aplicado!
                                                                </p>
                                                                {cupomValidado.cupom?.descricao && (
                                                                    <p className="text-sm text-green-700 mb-2">
                                                                        {cupomValidado.cupom.descricao}
                                                                    </p>
                                                                )}
                                                                <div className="text-sm space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        {cupomValidado.cupom?.tipoDesconto === 'PERCENTUAL' ? (
                                                                            <>
                                                                                <Percent className="h-4 w-4 text-green-600" />
                                                                                <span className="text-green-700">
                                                                                    Desconto de {cupomValidado.cupom?.valorDesconto}%
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                                                <span className="text-green-700">
                                                                                    Desconto de R$ {cupomValidado.cupom?.valorDesconto.toFixed(2)}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={removerCupom}
                                                            className="text-red-600 hover:text-red-800 text-sm font-semibold ml-2"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {cupomValidado && !cupomValidado.valido && (
                                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                                                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold text-red-800 mb-1">Cupom inválido</p>
                                                        <p className="text-sm text-red-700">{cupomValidado.erro}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Resumo de Valores */}
                                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6 space-y-3">
                                    <h3 className="font-bold text-lg text-charcoal border-b border-gray-300 pb-2">
                                        Valores
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Valor do serviço:</span>
                                            <span className="font-semibold text-charcoal">
                                                R$ {selectedService?.price.toFixed(2)}
                                            </span>
                                        </div>

                                        {cupomValidado?.valido && (
                                            <>
                                                <div className="flex justify-between items-center text-green-600">
                                                    <span>Desconto:</span>
                                                    <span className="font-semibold">
                                                        - R$ {cupomValidado.desconto?.valorDesconto.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-gray-300 pt-2"></div>
                                            </>
                                        )}

                                        <div className="flex justify-between items-center text-xl">
                                            <span className="font-bold text-charcoal">Total:</span>
                                            <span className="font-bold text-gold">
                                                R$ {valorFinal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Forma de Pagamento */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-charcoal">
                                        Forma de Pagamento *
                                    </label>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX'].map((method) => (
                                            <button
                                                key={method}
                                                onClick={() => setSelectedPaymentMethod(method)}
                                                className={`py-3 px-4 rounded-lg font-semibold transition-all border-2 ${selectedPaymentMethod === method
                                                        ? "bg-gold text-white border-gold shadow-lg"
                                                        : "bg-white border-gray-300 text-charcoal hover:border-gold"
                                                    }`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Botão de Confirmação */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !selectedPaymentMethod}
                                    className="w-full bg-gradient-gold text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        'Confirmar Agendamento'
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    Você receberá uma confirmação por WhatsApp 24h antes do horário agendado.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}