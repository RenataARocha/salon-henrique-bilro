// src/components/admin/BirthdayOfferModal.tsx

import { useState, useEffect } from 'react'
import { X, Gift, Mail, MessageCircle, Percent, DollarSign } from 'lucide-react'

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
    const [services, setServices] = useState<Service[]>([])
    const [formData, setFormData] = useState({
        discountType: 'PERCENTAGE',
        discountValue: 20,
        validDays: 30,
        applicableServices: [] as string[],
        sendEmail: true,
        sendWhatsApp: false
    })

    useEffect(() => {
        fetchServices()
    }, [])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/admin/birthdays/send-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: birthday.id,
                    ...formData
                })
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Oferta criada e enviada com sucesso!')
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
        setFormData(prev => ({
            ...prev,
            applicableServices: prev.applicableServices.includes(serviceId)
                ? prev.applicableServices.filter(id => id !== serviceId)
                : [...prev.applicableServices, serviceId]
        }))
    }

    const firstName = birthday.name.split(' ')[0]
    const couponCode = `ANIVERSARIO-${firstName.toUpperCase()}-${new Date().getFullYear()}`

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <Gift size={28} />
                                Criar Oferta de Aniversário
                            </h2>
                            <p className="text-white/90">Para: {birthday.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Preview do Cupom */}
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border-2 border-dashed border-pink-300">
                        <p className="text-sm text-gray-600 mb-2">Cupom que será criado:</p>
                        <p className="text-2xl font-bold text-purple-700">{couponCode}</p>
                    </div>

                    {/* Tipo de Desconto */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Tipo de Desconto
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.discountType === 'PERCENTAGE'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Percent className="mx-auto mb-2 text-purple-500" size={32} />
                                <p className="font-semibold">Porcentagem</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, discountType: 'FIXED' })}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.discountType === 'FIXED'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
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
                            onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                            min="1"
                            max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                            className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-bold"
                            required
                        />
                    </div>

                    {/* Validade */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Válido por (dias)
                        </label>
                        <select
                            value={formData.validDays}
                            onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Serviços Aplicáveis
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border-2 rounded-lg p-3">
                            <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.applicableServices.length === 0}
                                    onChange={() => setFormData({ ...formData, applicableServices: [] })}
                                    className="rounded text-purple-500 focus:ring-purple-500"
                                />
                                <span className="font-semibold text-purple-700">Todos os serviços</span>
                            </label>
                            {services.map(service => (
                                <label key={service.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.applicableServices.includes(service.id)}
                                        onChange={() => toggleService(service.id)}
                                        className="rounded text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="text-sm">
                                        {service.name} - R$ {service.price.toFixed(2)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Opções de Envio */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <p className="font-semibold text-gray-700 mb-3">Enviar para:</p>

                        {birthday.email && (
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.sendEmail}
                                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                                    className="rounded text-purple-500 focus:ring-purple-500 w-5 h-5"
                                />
                                <Mail className="text-blue-500" size={20} />
                                <div>
                                    <p className="font-semibold">Email</p>
                                    <p className="text-sm text-gray-600">{birthday.email}</p>
                                </div>
                            </label>
                        )}

                        {birthday.phone && (
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.sendWhatsApp}
                                    onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
                                    className="rounded text-purple-500 focus:ring-purple-500 w-5 h-5"
                                />
                                <MessageCircle className="text-green-500" size={20} />
                                <div>
                                    <p className="font-semibold">WhatsApp</p>
                                    <p className="text-sm text-gray-600">{birthday.phone}</p>
                                </div>
                            </label>
                        )}
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
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
                            disabled={loading}
                        >
                            {loading ? 'Criando...' : '🎁 Criar e Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}