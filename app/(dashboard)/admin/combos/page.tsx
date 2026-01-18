'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Gift, Percent, X, Check } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'

interface Service {
    id: string
    name: string
    price: number
    duration: number
    active?: boolean
}

interface Combo {
    id: string
    name: string
    description?: string
    active: boolean
    featured?: boolean
    discountPercent: number
    services: Service[]
    originalPrice: number
    comboPrice: number
    createdAt: string
    updatedAt: string
}

export default function AdminCombosPage() {
    const [combos, setCombos] = useState<Combo[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCombo, setEditingCombo] = useState<Combo | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountPercent: 10,
        selectedServiceIds: [] as string[]
    })

    useEffect(() => {
        fetchCombos()
        fetchServices()
    }, [])

    const fetchCombos = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/combos')
            const data = await res.json()
            if (data.success) {
                setCombos(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar combos:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services')
            const data = await res.json()
            if (data.success) {
                setServices(data.data.filter((s: Service) => s.active))
            }
        } catch (error) {
            console.error('Erro ao buscar serviços:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.selectedServiceIds.length < 2) {
            alert('Selecione pelo menos 2 serviços para criar um combo')
            return
        }

        try {
            const url = editingCombo
                ? `/api/admin/combos/${editingCombo.id}`
                : '/api/admin/combos'

            const method = editingCombo ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    discountPercent: formData.discountPercent,
                    serviceIds: formData.selectedServiceIds
                })
            })

            const data = await res.json()

            if (data.success) {
                alert(data.message)
                fetchCombos()
                handleCloseModal()
            } else {
                alert(data.message || 'Erro ao salvar combo')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao salvar combo')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este combo?')) return

        try {
            const res = await fetch(`/api/admin/combos/${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                alert(data.message)
                fetchCombos()
            } else {
                alert(data.message || 'Erro ao excluir combo')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao excluir combo')
        }
    }

    const handleToggleActive = async (combo: Combo) => {
        try {
            const res = await fetch(`/api/admin/combos/${combo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !combo.active })
            })

            const data = await res.json()

            if (data.success) {
                fetchCombos()
            } else {
                alert(data.message || 'Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao atualizar status')
        }
    }

    // Adicione esta função junto com as outras (depois de handleToggleActive)
    const handleToggleFeatured = async (combo: Combo) => {
        try {
            const newFeaturedState = !combo.featured

            const res = await fetch(`/api/admin/combos/${combo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featured: newFeaturedState })
            })

            const data = await res.json()

            if (data.success) {
                // ✅ Feedback adequado
                const message = newFeaturedState
                    ? '✅ Combo destacado na home! A página inicial será atualizada em instantes.'
                    : '✅ Combo removido da home! A página inicial será atualizada em instantes.'

                alert(message)

                // ✅ Atualiza lista de combos do admin
                await fetchCombos()

                // ✅ Dispara evento para atualizar componente FeaturedCombos
                window.dispatchEvent(new Event('combos-updated'))

                // ✅ Se tiver a home aberta em outra aba, ela também atualizará
                console.log('🔔 Evento de atualização disparado')

            } else {
                alert(data.message || 'Erro ao atualizar combo')
            }
        } catch (error) {
            console.error('❌ Erro:', error)
            alert('Erro ao atualizar combo')
        }
    }

    const handleOpenModal = (combo?: Combo) => {
        if (combo) {
            setEditingCombo(combo)
            setFormData({
                name: combo.name,
                description: combo.description || '',
                discountPercent: combo.discountPercent,
                selectedServiceIds: combo.services.map(s => s.id)
            })
        } else {
            setEditingCombo(null)
            setFormData({
                name: '',
                description: '',
                discountPercent: 10,
                selectedServiceIds: []
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCombo(null)
        setFormData({
            name: '',
            description: '',
            discountPercent: 10,
            selectedServiceIds: []
        })
    }

    const toggleServiceSelection = (serviceId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedServiceIds: prev.selectedServiceIds.includes(serviceId)
                ? prev.selectedServiceIds.filter(id => id !== serviceId)
                : [...prev.selectedServiceIds, serviceId]
        }))
    }

    const calculatePreview = () => {
        const selectedServices = services.filter(s => formData.selectedServiceIds.includes(s.id))
        const originalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
        const comboPrice = originalPrice * (1 - formData.discountPercent / 100)
        const savings = originalPrice - comboPrice

        return { originalPrice, comboPrice, savings, selectedServices }
    }

    const preview = calculatePreview()

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Combos Promocionais"
                    description="Crie pacotes de serviços com desconto"
                    showBackButton={true}
                />

                {/* Botão Adicionar */}
                <div className="flex justify-end">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        <Plus size={20} />
                        Criar Novo Combo
                    </button>
                </div>

                {/* Lista de Combos */}
                {combos.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {combos.map(combo => (
                            <div
                                key={combo.id}
                                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${combo.active ? 'border-gold' : 'border-gray-300 '
                                    } ${combo.featured ? 'ring-2 ring-yellow-400' : ''}`}  // ✅ ADICIONAR
                            >
                                {combo.featured && (
                                    <div className="mb-3 flex items-center gap-2 text-yellow-600 text-sm font-bold">
                                        <Gift size={16} className="fill-yellow-400" />
                                        <span>Destaque na Home</span>
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gold/10 p-3 rounded-lg">
                                            <Gift className="text-gold" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-charcoal">
                                                {combo.name}
                                            </h3>
                                            {combo.description && (
                                                <p className="text-sm text-gray-600">{combo.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(combo)}
                                            className={`p-2 rounded-lg transition-colors ${combo.active
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            title={combo.active ? 'Desativar' : 'Ativar'}
                                        >
                                            {combo.active ? <Check size={18} /> : <X size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(combo)}
                                            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(combo.id)}
                                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Serviços do Combo */}
                                <div className="bg-beige/50 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Serviços inclusos:</p>
                                    <ul className="space-y-1">
                                        {combo.services.map(service => (
                                            <li key={service.id} className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                                                {service.name} - R$ {service.price.toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleToggleFeatured(combo)}
                                    className={`w-full mb-3 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${combo.featured
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Gift size={16} className={combo.featured ? 'fill-yellow-400' : ''} />
                                    {combo.featured ? 'Remover da Home' : 'Destacar na Home'}
                                </button>
                                {/* Preços */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Valor original:</span>
                                        <span className="text-sm text-gray-400 line-through">
                                            R$ {combo.originalPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                                            <Percent size={14} />
                                            Desconto ({combo.discountPercent}%):
                                        </span>
                                        <span className="text-sm font-semibold text-green-600">
                                            - R$ {(combo.originalPrice - combo.comboPrice).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex items-center justify-between">
                                        <span className="text-lg font-bold text-charcoal">Valor do combo:</span>
                                        <span className="text-2xl font-bold text-gold">
                                            R$ {combo.comboPrice.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Gift size={64} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-charcoal mb-2">
                            Nenhum combo criado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Crie combos promocionais para oferecer pacotes de serviços com desconto
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-gradient-gold text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Criar Primeiro Combo
                        </button>
                    </div>
                )}

                {/* Modal de Criar/Editar */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b sticky top-0 bg-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-charcoal">
                                        {editingCombo ? 'Editar Combo' : 'Criar Novo Combo'}
                                    </h2>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Nome do Combo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ex: Combo Beleza Completa"
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                                    />
                                </div>

                                {/* Descrição */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Descrição (opcional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descreva o que está incluído neste combo..."
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-none"
                                    />
                                </div>

                                {/* Desconto */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Desconto (%) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="90"
                                        value={formData.discountPercent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                                    />
                                </div>

                                {/* Seleção de Serviços */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Serviços do Combo * (mínimo 2)
                                    </label>
                                    <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border-2 border-gray-300 rounded-lg p-4">
                                        {services.map(service => (
                                            <label
                                                key={service.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.selectedServiceIds.includes(service.id)
                                                    ? 'border-gold bg-gold/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedServiceIds.includes(service.id)}
                                                    onChange={() => toggleServiceSelection(service.id)}
                                                    className="mt-1 rounded text-gold focus:ring-gold"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-charcoal">{service.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        R$ {service.price.toFixed(2)} • {service.duration} min
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview dos Valores */}
                                {preview.selectedServices.length >= 2 && (
                                    <div className="bg-gradient-to-br from-gold/10 to-yellow-50 rounded-xl p-6">
                                        <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
                                            <Gift size={20} className="text-gold" />
                                            Preview do Combo
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Valor original:</span>
                                                <span className="text-gray-400 line-through">
                                                    R$ {preview.originalPrice.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-green-600 font-semibold">
                                                <span>Desconto ({formData.discountPercent}%):</span>
                                                <span>- R$ {preview.savings.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t pt-2 flex justify-between text-lg">
                                                <span className="font-bold text-charcoal">Valor do combo:</span>
                                                <span className="font-bold text-gold">
                                                    R$ {preview.comboPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botões */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-charcoal rounded-lg font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formData.selectedServiceIds.length < 2}
                                        className="flex-1 px-6 py-3 bg-gradient-gold text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingCombo ? 'Salvar Alterações' : 'Criar Combo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}