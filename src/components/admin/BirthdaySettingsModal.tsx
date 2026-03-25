'use client'

// src/components/admin/BirthdaySettingsModal.tsx

import { useState, useEffect } from 'react'
import { X, Gift, Zap, Settings, Info } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BirthdaySettings {
    birthdayAutoEnabled: boolean
    birthdayDiscountType: string
    birthdayDiscountValue: number
    birthdayValidDays: number
    birthdayMessage: string
    birthdayApplicableServices: string[] | null // ✅ novo
}

interface Service { // ✅ novo
    id: string
    name: string
    price: number
}

interface Props {
    onClose: () => void
    onSaved: () => void
}

export default function BirthdaySettingsModal({ onClose, onSaved }: Props) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [services, setServices] = useState<Service[]>([]) // ✅ novo

    const [settings, setSettings] = useState<BirthdaySettings>({
        birthdayAutoEnabled: false,
        birthdayDiscountType: 'PERCENTAGE',
        birthdayDiscountValue: 20,
        birthdayValidDays: 30,
        birthdayMessage: '',
        birthdayApplicableServices: null, // ✅ novo
    })

    useEffect(() => {
        fetchSettings()
        fetchServices()
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

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/birthday')
            const data = await res.json()
            if (data.success) {
                setSettings({
                    birthdayAutoEnabled: data.data.birthdayAutoEnabled,
                    birthdayDiscountType: data.data.birthdayDiscountType,
                    birthdayDiscountValue: data.data.birthdayDiscountValue,
                    birthdayValidDays: data.data.birthdayValidDays,
                    birthdayMessage: data.data.birthdayMessage || '',
                    birthdayApplicableServices: data.data.birthdayApplicableServices?.length > 0
                        ? data.data.birthdayApplicableServices
                        : null,
                })
            }
        } catch (error) {
            console.error('Erro ao buscar configurações:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/birthday', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            const data = await res.json()
            if (data.success) {
                onSaved()
                onClose()
            }
        } catch (error) {
            console.error('Erro ao salvar:', error)
        } finally {
            setSaving(false)
        }
    }

    const defaultMessage = `🎂 *Feliz Aniversário, {nome}!*\n\nO Henrique Bilro Cabeleireiros tem um presente especial para você! 🎁\n\n✨ *{desconto}* no seu próximo atendimento!\n\n🎫 *Cupom:* \`{codigo}\`\n📅 *Válido por {validade}*\n\nAproveite e venha nos visitar! 💕`

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-2 rounded-lg">
                            <Settings className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-charcoal">Configurações de Aniversário</h2>
                            <p className="text-sm text-gray-500">Configure o envio automático de cupons</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={22} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">

                        {/* Toggle modo automático */}
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className={settings.birthdayAutoEnabled ? 'text-purple-500' : 'text-gray-400'} size={22} />
                                    <div>
                                        <p className="font-bold text-charcoal">Modo Automático</p>
                                        <p className="text-sm text-gray-500">
                                            {settings.birthdayAutoEnabled
                                                ? 'O sistema envia o cupom automaticamente no dia do aniversário'
                                                : 'Você envia manualmente quando quiser'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, birthdayAutoEnabled: !s.birthdayAutoEnabled }))}
                                    className={`relative w-14 h-7 rounded-full transition-all ${settings.birthdayAutoEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${settings.birthdayAutoEnabled ? 'left-7' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Info sobre notificações */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700">
                                {settings.birthdayAutoEnabled ? (
                                    <>
                                        <p className="font-semibold mb-1">Com o modo automático ativo:</p>
                                        <p>• Você recebe uma notificação <strong>1 dia antes</strong> informando que o cupom será enviado amanhã</p>
                                        <p>• No dia do aniversário, o sistema envia automaticamente pelo WhatsApp</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold mb-1">No modo manual:</p>
                                        <p>• Você recebe uma notificação <strong>1 dia antes</strong> do aniversário da cliente</p>
                                        <p>• No dia, você acessa Aniversariantes e envia a oferta manualmente</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Configurações do cupom */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-charcoal flex items-center gap-2">
                                <Gift size={18} className="text-gold" />
                                Configurações do Cupom
                            </h3>

                            {/* Tipo de desconto */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Desconto</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'PERCENTAGE', label: '% Porcentagem' },
                                        { value: 'FIXED', label: 'R$ Valor Fixo' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSettings(s => ({ ...s, birthdayDiscountType: opt.value }))}
                                            className={`py-3 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${settings.birthdayDiscountType === opt.value
                                                ? 'border-gold bg-gold/10 text-charcoal'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Valor do desconto */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Valor do Desconto {settings.birthdayDiscountType === 'PERCENTAGE' ? '(%)' : '(R$)'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={settings.birthdayDiscountType === 'PERCENTAGE' ? 100 : 9999}
                                    value={settings.birthdayDiscountValue}
                                    onChange={e => setSettings(s => ({ ...s, birthdayDiscountValue: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none font-semibold text-lg"
                                />
                            </div>

                            {/* Validade */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Validade do Cupom (dias)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.birthdayValidDays}
                                    onChange={e => setSettings(s => ({ ...s, birthdayValidDays: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                />
                            </div>

                            {/* Mensagem personalizada (só modo automático) */}
                            {settings.birthdayAutoEnabled && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mensagem WhatsApp (opcional)
                                    </label>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Variáveis: <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> <code className="bg-gray-100 px-1 rounded">{'{desconto}'}</code> <code className="bg-gray-100 px-1 rounded">{'{codigo}'}</code> <code className="bg-gray-100 px-1 rounded">{'{validade}'}</code>
                                    </p>
                                    <textarea
                                        rows={6}
                                        value={settings.birthdayMessage}
                                        onChange={e => setSettings(s => ({ ...s, birthdayMessage: e.target.value }))}
                                        placeholder={defaultMessage}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none text-sm resize-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Deixe em branco para usar a mensagem padrão
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Serviços Aplicáveis */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Serviços Aplicáveis (modo automático)
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border-2 rounded-lg p-3">
                                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.birthdayApplicableServices === null}
                                        onChange={() => setSettings(s => ({ ...s, birthdayApplicableServices: null }))}
                                        className="rounded"
                                    />
                                    <span className="font-semibold text-purple-700">Todos os serviços</span>
                                </label>
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={
                                                settings.birthdayApplicableServices !== null &&
                                                settings.birthdayApplicableServices.includes(service.id)
                                            }
                                            onChange={() => {
                                                setSettings(s => {
                                                    if (s.birthdayApplicableServices === null) {
                                                        return { ...s, birthdayApplicableServices: [service.id] }
                                                    }
                                                    const already = s.birthdayApplicableServices.includes(service.id)
                                                    return {
                                                        ...s,
                                                        birthdayApplicableServices: already
                                                            ? s.birthdayApplicableServices.filter(id => id !== service.id)
                                                            : [...s.birthdayApplicableServices, service.id]
                                                    }
                                                })
                                            }}
                                            className="rounded"
                                        />
                                        <span className="text-sm">{service.name} - R$ {service.price.toFixed(2)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Preview do desconto */}
                        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                            <p className="text-sm font-semibold text-charcoal mb-1">Preview do cupom:</p>
                            <p className="text-sm text-gray-600">
                                {settings.birthdayDiscountType === 'PERCENTAGE'
                                    ? `${settings.birthdayDiscountValue}% de desconto`
                                    : `R$ ${settings.birthdayDiscountValue.toFixed(2)} de desconto`
                                } • Válido por {settings.birthdayValidDays} dias
                            </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" onClick={onClose} className="flex-1">
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
                                {saving ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}