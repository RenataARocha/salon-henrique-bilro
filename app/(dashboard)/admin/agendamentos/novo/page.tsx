'use client'

// app/(dashboard)/admin/agendamentos/novo/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, Cake, CheckCircle, Gift, Check } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContainer'
import AdminHeader from '@/components/admin/AdminHeader'
import SmartCalendar from '@/components/SmartCalendar'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Service {
    id: string
    name: string
    description: string
    price: number
    duration: number
    active: boolean
    images?: string[]
}

interface Combo {
    id: string
    name: string
    description?: string
    comboPrice: number
    originalPrice: number
    discountPercent: number
    services: { id: string; name: string; duration: number; price: number }[]
}

type SelectionType = 'service' | 'combo' | null

// ── ServiceCard igual ao agendamento da cliente ──────────────────────────────
function ServiceCardWithCarousel({
    service,
    isSelected,
    onSelect
}: {
    service: Service
    isSelected: boolean
    onSelect: () => void
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const hasImages = service.images && service.images.length > 0

    useEffect(() => {
        if (!hasImages || service.images!.length <= 1) return
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % service.images!.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [hasImages, service.images])

    return (
        <div
            onClick={onSelect}
            className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected
                ? 'border-gold shadow-lg shadow-gold/20 ring-2 ring-gold/30 scale-[1.02]'
                : 'border-white/10 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10'
                }`}
        >
            {isSelected && (
                <div className="absolute top-3 right-3 bg-gold text-white rounded-full p-1 shadow-md z-10">
                    <Check size={16} />
                </div>
            )}
            {hasImages ? (
                <div className="relative h-48 bg-[#1a1a1a]">
                    {service.images!.map((image, index) => (
                        <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}>
                            <Image src={image} alt={`${service.name} - ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized={image.startsWith('http')} />
                        </div>
                    ))}
                    {service.images!.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                            {service.images!.map((_, index) => (
                                <button key={index} onClick={e => { e.stopPropagation(); setCurrentImageIndex(index) }}
                                    className={`h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5 hover:bg-white/80'}`} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-48 bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-white/20 text-sm">Sem imagem</span>
                </div>
            )}
            <div className={`p-5 transition-colors ${isSelected ? 'bg-[#1e1800]' : 'bg-[#161206]'}`}>
                <h3 className={`text-lg font-bold mb-1 transition-colors ${isSelected ? 'text-white' : 'text-white/80'}`}>{service.name}</h3>
                <p className="text-white/40 text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gold">R$ {service.price.toFixed(2)}</span>
                    <span className="text-sm text-white/30">{service.duration} min</span>
                </div>
            </div>
        </div>
    )
}

// ── ComboCard igual ao agendamento da cliente ─────────────────────────────────
function ComboCardAdmin({
    combo,
    isSelected,
    onSelect
}: {
    combo: Combo
    isSelected: boolean
    onSelect: () => void
}) {
    return (
        <div onClick={onSelect} className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected ? 'border-gold shadow-lg shadow-gold/20 ring-2 ring-gold/30' : 'border-white/10 shadow-lg hover:border-gold/50'
            }`}>
            <div className="relative h-48 bg-gradient-to-br from-[#2a1f0a] to-[#1a1200] flex flex-col items-center justify-center">
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{combo.discountPercent}% OFF
                </div>
                <Gift size={64} className="text-gold/70 mb-2" />
                <p className="text-gold/60 font-bold text-lg tracking-widest uppercase">Combo Promocional</p>
            </div>
            <div className={`p-5 transition-colors ${isSelected ? 'bg-[#1e1800]' : 'bg-[#161206]'}`}>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">🎁 {combo.name}</h3>
                {combo.description && <p className="text-white/40 text-sm mb-3 line-clamp-2">{combo.description}</p>}
                <div className={`rounded-lg p-3 mb-4 border transition-colors ${isSelected ? 'bg-gold/10 border-gold/20' : 'bg-white/5 border-white/8'}`}>
                    <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Serviços inclusos:</p>
                    <ul className="space-y-1">
                        {combo.services.map(s => (
                            <li key={s.id} className="text-xs text-white/70 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gold rounded-full flex-shrink-0" />{s.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white/30 line-through">R$ {combo.originalPrice.toFixed(2)}</span>
                        <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/30 px-2 py-0.5 rounded-full font-semibold">
                            Economize R$ {(combo.originalPrice - combo.comboPrice).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gold">R$ {combo.comboPrice.toFixed(2)}</span>
                        <span className="text-sm text-white/30">{combo.services.reduce((s, sv) => s + sv.duration, 0)} min</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function NovoAgendamentoAdminPage() {
    const router = useRouter()
    const { showToast } = useToast()

    // Dados da cliente
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [clientEmail, setClientEmail] = useState('')
    const [clientBirthDate, setClientBirthDate] = useState('')

    // Serviços/Combo — igual ao agendamento da cliente
    const [services, setServices] = useState<Service[]>([])
    const [combos, setCombos] = useState<Combo[]>([])
    const [selectedServices, setSelectedServices] = useState<Map<string, number>>(new Map())
    const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)

    // Data/Hora
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Pagamento e obs
    const [paymentMethod, setPaymentMethod] = useState('')
    const [notes, setNotes] = useState('')

    // Cupom
    const [couponCode, setCouponCode] = useState('')
    const [couponData, setCouponData] = useState<any>(null)
    const [couponError, setCouponError] = useState('')
    const [validatingCoupon, setValidatingCoupon] = useState(false)
    const [discountFromApi, setDiscountFromApi] = useState(0)
    const [finalPriceFromApi, setFinalPriceFromApi] = useState(0)

    const [loadingStep, setLoadingStep] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    useEffect(() => { fetchServicesAndCombos() }, [])
    useEffect(() => { if (selectedDate) fetchSlots(selectedDate) }, [selectedDate])

    const fetchServicesAndCombos = async () => {
        const [sRes, cRes] = await Promise.all([fetch('/api/services'), fetch('/api/combos')])
        const [sData, cData] = await Promise.all([sRes.json(), cRes.json()])
        if (sData.success) setServices(sData.data.filter((s: Service) => s.active))
        if (cData.success) setCombos(cData.data)
    }

    const fetchSlots = async (date: string) => {
        setLoadingSlots(true)
        setSelectedTime('')
        try {
            const res = await fetch(`/api/available-slots?date=${date}`)
            const data = await res.json()
            setAvailableSlots(data.success ? data.data : [])
        } catch { setAvailableSlots([]) }
        finally { setLoadingSlots(false) }
    }

    // Igual ao agendamento da cliente
    const addService = (serviceId: string) => {
        setSelectedServices(prev => {
            const newMap = new Map(prev)
            if (newMap.has(serviceId)) newMap.delete(serviceId)
            else newMap.set(serviceId, 1)
            return newMap
        })
        setSelectedCombo(null)
        setCouponData(null); setCouponCode('')
    }

    const getSelectedServicesDetails = () => {
        const servicesList: Array<Service & { quantity: number }> = []
        let totalPrice = 0
        let totalDuration = 0
        selectedServices.forEach((quantity, serviceId) => {
            const service = services.find(s => s.id === serviceId)
            if (service) {
                servicesList.push({ ...service, quantity })
                totalPrice += service.price * quantity
                totalDuration += service.duration * quantity
            }
        })
        return { servicesList, totalPrice, totalDuration }
    }

    const getPrice = () => {
        if (selectedCombo) return selectedCombo.comboPrice
        return getSelectedServicesDetails().totalPrice
    }

    const discountAmount = couponData ? discountFromApi : 0
    const finalPrice = couponData ? finalPriceFromApi : getPrice()

    const getMinDate = () => new Date().toISOString().split('T')[0]
    const getMaxDate = () => {
        const d = new Date(); d.setMonth(d.getMonth() + 3)
        return d.toISOString().split('T')[0]
    }

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return
        setValidatingCoupon(true)
        setCouponError('')
        try {
            const res = await fetch('/api/cupons/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: couponCode, valorServico: getPrice() })
            })
            const data = await res.json()
            if (data.valido) {
                setCouponData({
                    code: data.cupom.codigo,
                    description: data.cupom.descricao,
                    discountType: data.cupom.tipoDesconto === 'PERCENTUAL' ? 'PERCENTAGE' : 'FIXED',
                    discountValue: data.cupom.valorDesconto,
                    id: data.cupom.id
                })
                setDiscountFromApi(data.desconto.valorDesconto)
                setFinalPriceFromApi(data.desconto.valorFinal)
            } else {
                setCouponError(data.erro || 'Cupom inválido')
            }
        } catch { setCouponError('Erro ao validar cupom') }
        finally { setValidatingCoupon(false) }
    }

    const { servicesList, totalPrice } = getSelectedServicesDetails()
    const canGoStep2 = clientName.trim() && clientPhone.trim() && (selectedServices.size > 0 || selectedCombo)
    const canGoStep3 = selectedDate && selectedTime

    const handleSubmit = async () => {
        if (!canGoStep2 || !canGoStep3) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/criar-agendamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ✅ CORRETO - envia services quando há múltiplos
                body: JSON.stringify({
                    clientName: clientName.trim(),
                    clientPhone: clientPhone.trim(),
                    clientEmail: clientEmail.trim() || null,
                    clientBirthDate: clientBirthDate || null,
                    serviceId: servicesList.length === 1 ? servicesList[0].id : null,
                    comboId: selectedCombo?.id || null,
                    services: servicesList.length > 1 ? servicesList.map(s => ({
                        serviceId: s.id,
                        quantity: s.quantity,
                        price: s.price
                    })) : null,
                    date: selectedDate,
                    time: selectedTime,
                    notes: notes.trim() || null,
                    paymentMethod: paymentMethod || null,
                    couponCode: couponData?.code || null,
                    discountAmount,
                    finalPrice,
                })
            })
            const data = await res.json()
            if (data.success) {
                showToast(`✅ Agendamento criado para ${clientName}!`, 'success')
                router.push('/admin/agendamentos')
            } else {
                showToast(data.error || 'Erro ao criar agendamento', 'error')
            }
        } catch { showToast('Erro ao criar agendamento', 'error') }
        finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                <AdminHeader title="Novo Agendamento" description="Cadastre uma cliente e agende o horário"
                    showBackButton backUrl="/admin/agendamentos" />

                {/* Steps */}
                <div className="flex items-center gap-2">
                    {[{ n: 1, label: 'Cliente & Serviço' }, { n: 2, label: 'Data & Hora' }, { n: 3, label: 'Confirmar' }].map(({ n, label }, i) => (
                        <div key={n} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === n ? 'bg-gold text-white' :
                                step > n ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30' :
                                    'bg-white/5 text-white/30 border border-white/8'
                                }`}>
                                {step > n ? <CheckCircle size={12} /> : <span>{n}</span>}
                                <span className="hidden sm:inline">{label}</span>
                            </div>
                            {i < 2 && <div className="w-6 h-px bg-white/10" />}
                        </div>
                    ))}
                </div>

                <div className="bg-[#141414] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 p-5 sm:p-8">

                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                            {/* Dados da cliente */}
                            <h2 className="text-lg font-bold text-white">Dados da Cliente</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><User size={13} /> Nome Completo *</label>
                                    <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome da cliente"
                                        className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:border-gold/60 focus:outline-none text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Phone size={13} /> Telefone *</label>
                                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(84) 99999-9999"
                                        className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:border-gold/60 focus:outline-none text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Mail size={13} /> Email <span className="text-white/25">(opcional)</span></label>
                                    <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@exemplo.com" type="email"
                                        className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:border-gold/60 focus:outline-none text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Cake size={13} /> Aniversário <span className="text-white/25">(opcional)</span></label>
                                    <input value={clientBirthDate} onChange={e => setClientBirthDate(e.target.value)} type="date"
                                        className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white focus:border-gold/60 focus:outline-none text-sm" />
                                </div>
                            </div>

                            <div className="border-t border-white/8 pt-6 space-y-6">
                                <h2 className="text-lg font-bold text-white">Serviço ou Combo *</h2>

                                {/* Combos */}
                                {combos.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Gift className="text-gold" size={22} />
                                            <h3 className="text-base font-bold text-white">Combos Promocionais</h3>
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">OFERTA</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {combos.map((combo, i) => (
                                                <motion.div key={combo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                                                    <ComboCardAdmin combo={combo} isSelected={selectedCombo?.id === combo.id}
                                                        onSelect={() => { setSelectedCombo(combo); setSelectedServices(new Map()); setCouponData(null); setCouponCode('') }} />
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-[#141414] px-4 text-xs text-white/40 font-semibold tracking-widest uppercase">ou escolha um serviço individual</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Serviços individuais */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {services.map((service, i) => (
                                        <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <ServiceCardWithCarousel service={service} isSelected={selectedServices.has(service.id)} onSelect={() => addService(service.id)} />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Resumo selecionados */}
                                {selectedServices.size > 0 && (
                                    <div className="bg-white/5 border border-white/8 rounded-lg p-4 space-y-2">
                                        <p className="font-semibold text-white/80">✂️ Serviços escolhidos:</p>
                                        {servicesList.map(s => (
                                            <p key={s.id} className="text-sm text-white/50">• {s.name}</p>
                                        ))}
                                        <div className="border-t border-white/10 pt-2">
                                            <p className="text-sm font-semibold text-gold">Total: R$ {totalPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedServices.size > 0 && (
                                    <p className="text-sm text-white/40 text-center">{selectedServices.size} serviço(s) selecionado(s)</p>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setLoadingStep(2)
                                    setTimeout(() => {
                                        setStep(2)
                                        setLoadingStep(null)
                                    }, 200)
                                }}
                                disabled={!canGoStep2 || loadingStep === 2}
                                className="w-full bg-gradient-gold text-white py-3.5 rounded-lg font-semibold 
    hover:shadow-lg hover:shadow-gold/20 transition-all active:scale-95 
    disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingStep === 2 ? 'Carregando...' : 'Continuar'}
                            </button>
                        </motion.div>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <button onClick={() => setStep(1)} className="text-gold hover:underline text-sm">← Voltar</button>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Calendar size={18} className="text-gold" /> Selecione a Data</h2>
                            <SmartCalendar onDateSelect={setSelectedDate} selectedDate={selectedDate} minDate={getMinDate()} maxDate={getMaxDate()} />

                            {selectedDate && (
                                <div>
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2"><Clock size={15} className="text-gold" /> Horários disponíveis</h3>
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" /></div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {availableSlots.map(slot => (
                                                <button key={slot} onClick={() => setSelectedTime(slot)}
                                                    className={`py-3 rounded-lg font-semibold text-sm transition-all ${selectedTime === slot
                                                        ? 'bg-gold text-white shadow-lg shadow-gold/30'
                                                        : 'bg-white/5 border border-white/10 text-white/70 hover:border-gold/50 hover:text-white'
                                                        }`}>
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-white/4 rounded-lg">
                                            <p className="text-white/40 text-sm">Nenhum horário disponível para esta data</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/60">Observações (opcional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação?" rows={3}
                                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:border-gold/60 focus:outline-none text-sm resize-none" />
                            </div>

                            <button
                                onClick={() => {
                                    setLoadingStep(3)
                                    setTimeout(() => {
                                        setStep(3)
                                        setLoadingStep(null)
                                    }, 200)
                                }}
                                disabled={!canGoStep3 || loadingStep === 3}
                                className="w-full bg-gradient-gold text-white py-3.5 rounded-lg font-semibold 
    hover:shadow-lg hover:shadow-gold/20 transition-all active:scale-95 
    disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingStep === 3 ? 'Carregando...' : 'Continuar'}
                            </button>
                        </motion.div>
                    )}

                    {/* ── STEP 3 ── */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <button onClick={() => setStep(2)} className="text-gold hover:underline text-sm">← Voltar</button>
                            <h2 className="text-lg font-bold text-white">Confirmar Agendamento</h2>

                            {/* Resumo */}
                            <div className="bg-white/4 border border-white/8 rounded-xl p-5 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-white/50">Cliente</span><span className="text-white font-semibold">{clientName}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-white/50">Telefone</span><span className="text-white">{clientPhone}</span></div>
                                {clientBirthDate && (
                                    <div className="flex justify-between text-sm"><span className="text-white/50">Aniversário</span><span className="text-white">{new Date(clientBirthDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
                                )}
                                <div className="border-t border-white/8 pt-3">
                                    {selectedCombo ? (
                                        <div className="bg-gold/8 rounded-lg p-3 border border-gold/20">
                                            <p className="text-sm text-white/40 mb-1">Combo</p>
                                            <p className="text-white font-semibold">🎁 {selectedCombo.name}</p>
                                            {selectedCombo.services.map(s => <p key={s.id} className="text-xs text-white/50">• {s.name}</p>)}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {servicesList.map(s => (
                                                <div key={s.id} className="flex justify-between text-sm">
                                                    <span className="text-white/70">{s.quantity}x {s.name}</span>
                                                    <span className="text-gold">R$ {(s.price * s.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm"><span className="text-white/50">Data</span><span className="text-white">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-white/50">Horário</span><span className="text-white">{selectedTime}</span></div>
                                <div className="border-t border-white/8 pt-3 flex justify-between">
                                    <span className="text-white font-bold">Total</span>
                                    <span className="text-gold font-bold text-lg">R$ {getPrice().toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Cupom */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/60">Cupom de Desconto (opcional)</label>
                                <div className="flex gap-2">
                                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        onKeyPress={e => e.key === 'Enter' && handleValidateCoupon()}
                                        placeholder="Código do cupom" disabled={!!couponData || validatingCoupon}
                                        className="flex-1 px-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:border-gold/60 focus:outline-none text-sm uppercase disabled:opacity-50" />
                                    {!couponData ? (
                                        <button onClick={handleValidateCoupon} disabled={validatingCoupon || !couponCode.trim()}
                                            className="px-4 py-3 bg-gradient-gold text-white rounded-lg font-semibold text-sm disabled:opacity-40 hover:shadow-lg transition-all">
                                            {validatingCoupon ? '...' : 'Aplicar'}
                                        </button>
                                    ) : (
                                        <button onClick={() => { setCouponData(null); setCouponCode(''); setDiscountFromApi(0); setFinalPriceFromApi(0) }}
                                            className="px-4 py-3 bg-red-950/40 text-red-400 border border-red-800/30 rounded-lg font-semibold text-sm hover:bg-red-950/60 transition-all">
                                            Remover
                                        </button>
                                    )}
                                </div>
                                {couponData && (
                                    <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-3 text-xs space-y-1">
                                        <p className="text-emerald-300 font-semibold">✅ Cupom: {couponData.code}</p>
                                        <p className="text-emerald-400/70">{couponData.description}</p>
                                        <div className="flex justify-between text-white/50 pt-1 border-t border-white/8">
                                            <span>Desconto:</span><span className="text-emerald-400 font-semibold">- R$ {discountAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-white">Total final:</span><span className="text-gold">R$ {finalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                            </div>

                            {/* Pagamento */}
                            <div>
                                <label className="text-xs font-semibold text-white/60 block mb-2">Forma de Pagamento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(method => (
                                        <button key={method} onClick={() => setPaymentMethod(method)}
                                            className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border ${paymentMethod === method ? 'bg-gold text-white border-gold' : 'bg-white/5 border-white/10 text-white/70 hover:border-gold/40'
                                                }`}>
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3 text-xs text-blue-300/80">
                                💡 Agendamento criado como <strong className="text-blue-300">Confirmado</strong>. Se a cliente não tiver cadastro, será criado automaticamente.
                            </div>

                            <button onClick={handleSubmit} disabled={loading}
                                className="w-full bg-gradient-gold text-white py-4 rounded-lg font-bold text-base hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Criando...</> : '✅ Confirmar Agendamento'}
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}