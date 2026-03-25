// src/components/admin/BirthdayOfferModal.tsx
// ✅ Carrega configurações salvas automaticamente

import { useState, useEffect } from 'react'
import { X, Gift, Percent, DollarSign, Zap, Settings } from 'lucide-react'

interface Birthday {
    id: string
    name: string
    email: string
    phone?: string
}

interface BirthdayOfferModalProps {
    birthday: Birthday
    onClose: () => void
    onSuccess: () => void
}

interface Service {
    id: string
    name: string
    price: number
}

export default function BirthdayOfferModal({ birthday, onClose, onSuccess }: BirthdayOfferModalProps) {
    const [loading, setLoading] = useState(false)
    const [loadingSettings, setLoadingSettings] = useState(true)
    const [services, setServices] = useState<Service[]>([])
    const [autoEnabled, setAutoEnabled] = useState(false)
    const [formData, setFormData] = useState({
        discountType: 'PERCENTAGE',
        discountValue: 20,
        validDays: 30,
        applicableServices: null as string[] | null,
        sendEmail: true,
        sendWhatsApp: true,
    })

    useEffect(() => {
        Promise.all([fetchServices(), fetchSettings()])
    }, [])

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services')
            const data = await res.json()
            if (data.success) setServices(data.data)
        } catch (error) {
            console.error('Erro ao buscar serviços:', error)
        }
    }

    // ✅ Carrega configurações salvas e pré-preenche o formulário
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/birthday')
            const data = await res.json()
            if (data.success) {
                setAutoEnabled(data.data.birthdayAutoEnabled)
                setFormData(prev => ({
                    ...prev,
                    discountType: data.data.birthdayDiscountType || 'PERCENTAGE',
                    discountValue: data.data.birthdayDiscountValue || 20,
                    validDays: data.data.birthdayValidDays || 30,
                }))
            }
        } catch (error) {
            console.error('Erro ao buscar configurações:', error)
        } finally {
            setLoadingSettings(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/birthdays/send-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: birthday.id,
                    ...formData,
                    sendWhatsApp: true,
                })
            })
            const data = await res.json()
            if (data.success) {
                alert('✅ Oferta criada e enviada com sucesso via WhatsApp e Email!')
                onSuccess()
            } else {
                alert('❌ ' + (data.message || 'Erro ao criar oferta'))
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('❌ Erro ao criar oferta')
        } finally {
            setLoading(false)
        }
    }

    const toggleService = (serviceId: string) => {
        setFormData(prev => {
            if (prev.applicableServices === null) {
                return { ...prev, applicableServices: [serviceId] }
            }
            const alreadySelected = prev.applicableServices.includes(serviceId)
            return {
                ...prev,
                applicableServices: alreadySelected
                    ? prev.applicableServices.filter(id => id !== serviceId)
                    : [...prev.applicableServices, serviceId]
            }
        })
    }

    const firstName = birthday.name.split(' ')[0]
    const couponCode = `ANIVERSARIO-${firstName.toUpperCase()}-${new Date().getFullYear()}`
    const discountPreview = formData.discountType === 'PERCENTAGE'
        ? `${formData.discountValue}% de desconto`
        : `R$ ${formData.discountValue.toFixed(2)} de desconto`

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="bg-gradient-gold text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                                <Gift size={28} />
                                Criar Oferta de Aniversário
                            </h2>
                            <p className="text-white/90">Para: {birthday.name}</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {loadingSettings ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

                        {/* Banner modo automático */}
                        {autoEnabled && (
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-center gap-3">
                                <Zap className="text-purple-500 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-semibold text-purple-800 text-sm">Modo Automático ativo</p>
                                    <p className="text-xs text-purple-600">
                                        O sistema já envia automaticamente no dia do aniversário.
                                        Aqui você pode enviar uma oferta adicional ou personalizada.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Preview do Cupom */}
                        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border-2 border-dashed border-pink-300">
                            <p className="text-sm text-gray-600 mb-1">Cupom que será criado:</p>
                            <p className="text-2xl font-bold text-purple-700">{couponCode}</p>
                            <p className="text-sm text-gold font-semibold mt-2">{discountPreview} • Válido por {formData.validDays} dias</p>
                            <p className="text-xs text-gray-500 mt-1">
                                ✅ Será enviado via <strong>WhatsApp</strong> e <strong>Email</strong>
                            </p>
                        </div>

                        {/* Aviso sobre configurações */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                            <Settings size={16} className="text-blue-500 flex-shrink-0" />
                            <p className="text-xs text-blue-700">
                                Os valores abaixo foram carregados das suas <strong>Configurações</strong>. Você pode ajustar para esta cliente específica.
                            </p>
                        </div>

                        {/* Tipo de Desconto */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Desconto</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.discountType === 'PERCENTAGE' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <Percent className="mx-auto mb-2 text-purple-500" size={32} />
                                    <p className="font-semibold">Porcentagem</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, discountType: 'FIXED' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.discountType === 'FIXED' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <DollarSign className="mx-auto mb-2 text-purple-500" size={32} />
                                    <p className="font-semibold">Valor Fixo</p>
                                </button>
                            </div>
                        </div>

                        {/* Valor do Desconto */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {formData.discountType === 'PERCENTAGE' ? 'Porcentagem de Desconto (%)' : 'Valor do Desconto (R$)'}
                            </label>
                            <input
                                type="number"
                                value={formData.discountValue}
                                onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                                min="1"
                                max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-bold"
                                required
                            />
                        </div>

                        {/* Validade */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Válido por (dias)</label>
                            <select
                                value={formData.validDays}
                                onChange={e => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                            >
                                <option value={7}>7 dias</option>
                                <option value={15}>15 dias</option>
                                <option value={30}>30 dias</option>
                                <option value={60}>60 dias</option>
                                <option value={90}>90 dias</option>
                            </select>
                        </div>

                        {/* Serviços Aplicáveis */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Serviços Aplicáveis</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border-2 rounded-lg p-3">
                                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.applicableServices === null}
                                        onChange={() => setFormData({ ...formData, applicableServices: null })}
                                        className="rounded text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="font-semibold text-purple-700">Todos os serviços</span>
                                </label>
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.applicableServices !== null && formData.applicableServices.includes(service.id)}
                                            onChange={() => toggleService(service.id)}
                                            className="rounded text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-sm">{service.name} - R$ {service.price.toFixed(2)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Info de envio */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="font-semibold text-green-800 mb-2">📤 Envio automático:</p>
                            <div className="space-y-1 text-sm text-green-700">
                                <p>✅ <strong>Email</strong> — {birthday.email}</p>
                                {birthday.phone && <p>✅ <strong>WhatsApp</strong> — {birthday.phone}</p>}
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : '🎁 Criar e Enviar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}