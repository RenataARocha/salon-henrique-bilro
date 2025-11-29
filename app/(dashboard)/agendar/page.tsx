'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/NavBar'

interface Service {
    id: string
    name: string
    description: string
    price: number
    duration: number
}

export default function AgendarPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(false)

    // Dados do agendamento
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState('')
    const [notes, setNotes] = useState('')

    // Buscar serviços ao carregar
    useEffect(() => {
        fetchServices()
    }, [])

    // Redirecionar se não estiver logado
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services')
            const data = await res.json()
            if (data.success) {
                setServices(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar serviços:', error)
        }
    }

    const fetchAvailableSlots = async (date: string) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/available-slots?date=${date}`)
            const data = await res.json()

            if (data.success) {
                setAvailableSlots(data.data)
                if (data.data.length === 0) {
                    alert(data.message || 'Não há horários disponíveis para esta data')
                }
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error)
            alert('Erro ao buscar horários disponíveis')
        } finally {
            setLoading(false)
        }
    }

    const handleDateChange = (date: string) => {
        setSelectedDate(date)
        setSelectedTime('')
        fetchAvailableSlots(date)
    }

    const handleSubmit = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            alert('Por favor, preencha todos os campos obrigatórios')
            return
        }

        try {
            setLoading(true)
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    date: selectedDate,
                    time: selectedTime,
                    notes
                })
            })

            const data = await res.json()

            if (data.success) {
                alert('🎉 Agendamento realizado com sucesso!\n\nVocê receberá uma confirmação no WhatsApp 24h antes.')
                router.push('/dashboard')
            } else {
                alert(data.error || 'Erro ao criar agendamento')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao criar agendamento')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-beige flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    const getMinDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    }

    const getMaxDate = () => {
        const maxDate = new Date()
        maxDate.setMonth(maxDate.getMonth() + 2)
        return maxDate.toISOString().split('T')[0]
    }

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
                            <StepIndicator number={1} active={step === 1} completed={step > 1} label="Serviço" />
                            <div className="w-12 h-1 bg-gray-300"></div>
                            <StepIndicator number={2} active={step === 2} completed={step > 2} label="Data/Hora" />
                            <div className="w-12 h-1 bg-gray-300"></div>
                            <StepIndicator number={3} active={step === 3} label="Confirmar" />
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* STEP 1: Escolher Serviço */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-charcoal mb-6">Escolha o Serviço</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {services.map((service) => (
                                        <div
                                            key={service.id}
                                            onClick={() => setSelectedService(service)}
                                            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedService?.id === service.id
                                                    ? 'border-gold bg-gold bg-opacity-10'
                                                    : 'border-gray-200 hover:border-gold hover:shadow-lg'
                                                }`}
                                        >
                                            <h3 className="text-xl font-bold text-charcoal mb-2">{service.name}</h3>
                                            <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-bold text-gold">
                                                    R$ {service.price.toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {service.duration} min
                                                </span>
                                            </div>
                                        </div>
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
                                <h2 className="text-2xl font-bold text-charcoal mb-6">Escolha Data e Horário</h2>

                                {/* Serviço selecionado */}
                                <div className="bg-beige p-4 rounded-lg mb-6">
                                    <p className="text-sm text-gray-600 mb-1">Serviço selecionado:</p>
                                    <p className="text-lg font-bold text-charcoal">{selectedService?.name}</p>
                                </div>

                                {/* Seletor de data */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Data
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        🕐 Horário: Terça a Sábado, 10:00 - 17:00
                                    </p>
                                </div>

                                {/* Horários disponíveis */}
                                {selectedDate && (
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Horários Disponíveis
                                        </label>
                                        {loading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {availableSlots.map((time) => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`p-3 rounded-lg font-semibold transition-all ${selectedTime === time
                                                                ? 'bg-gradient-gold text-white'
                                                                : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                <p className="text-gray-600">😔 Nenhum horário disponível para esta data</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Observações */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Observações (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Alguma preferência ou observação?"
                                        rows={3}
                                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-gray-200 text-charcoal py-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedDate || !selectedTime}
                                        className="flex-1 bg-gradient-gold text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Confirmar */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-charcoal mb-6">Confirmar Agendamento</h2>

                                <div className="space-y-4">
                                    <InfoBox label="Serviço" value={selectedService?.name || ''} />
                                    <InfoBox label="Valor" value={`R$ ${selectedService?.price.toFixed(2)}`} />
                                    <InfoBox label="Duração" value={`${selectedService?.duration} minutos`} />
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
                                    {notes && <InfoBox label="Observações" value={notes} />}
                                </div>

                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        📱 <strong>Importante:</strong> Você receberá uma mensagem de confirmação no WhatsApp 24 horas antes do seu horário.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex-1 bg-gray-200 text-charcoal py-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-gold text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

function StepIndicator({ number, active, completed, label }: { number: number, active?: boolean, completed?: boolean, label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${completed ? 'bg-green-500 text-white' : active ? 'bg-gradient-gold text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                {completed ? '✓' : number}
            </div>
            <span className="text-xs mt-2 text-gray-600 font-semibold">{label}</span>
        </div>
    )
}

function InfoBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-beige p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-lg font-bold text-charcoal">{value}</p>
        </div>
    )
}