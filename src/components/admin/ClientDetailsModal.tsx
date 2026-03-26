'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, TrendingUp, Star, Edit, Save, MessageCircle, Award } from 'lucide-react'

interface ClientDetails {
    client: {
        id: string
        name: string
        email: string
        phone: string
        birthDate: string | null
        image: string | null
        createdAt: string
    }
    stats: {
        totalAppointments: number
        completedAppointments: number
        cancelledAppointments: number
        noShowAppointments: number
        pendingAppointments: number
        totalSpent: number
        avgTicket: number
        attendanceRate: number
        avgRating: number
        lastAppointment: string | null
        daysSinceLastAppointment: number | null
        topServices: Array<{
            name: string
            count: number
            revenue: number
        }>
    }
    appointments: Array<{
        id: string
        date: string
        time: string
        status: string
        finalPrice: number
        service: {
            name: string
            price: number
        } | null
        combo?: {
            name: string
        } | null
    }>
    reviews: Array<{
        id: string
        rating: number
        comment: string
        createdAt: string
        service: {
            name: string
        }
    }>


}

type UpdateClientPayload = {
    name: string
    email: string
    phone: string
    birthDate?: string
}


export default function ClientDetailsModal({
    clientId,
    onClose,
    onUpdate
}: {
    clientId: string
    onClose: () => void
    onUpdate?: () => void
}) {
    const [data, setData] = useState<ClientDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: ''
    })

    useEffect(() => {
        fetchClientDetails()
    }, [clientId])

    const fetchClientDetails = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/clients/${clientId}`)
            const response = await res.json()

            if (response.success) {
                setData(response.data)

                // CORREÇÃO: Formatar a data para o input type="date" (YYYY-MM-DD)
                let formattedBirthDate = ''
                if (response.data.client.birthDate) {
                    const date = new Date(response.data.client.birthDate)
                    // Formata para YYYY-MM-DD
                    formattedBirthDate = date.toISOString().split('T')[0]
                }

                setEditForm({
                    name: response.data.client.name,
                    email: response.data.client.email,
                    phone: response.data.client.phone,
                    birthDate: formattedBirthDate
                })
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do cliente:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            // CORREÇÃO: Preparar dados para envio
            const dataToSend: UpdateClientPayload = {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone
            }

            // CORREÇÃO: Converter data do formato YYYY-MM-DD para ISO mantendo o dia correto
            if (editForm.birthDate) {
                // Pega a data no formato YYYY-MM-DD e cria objeto Date
                const [year, month, day] = editForm.birthDate.split('-')
                // Cria a data em UTC para evitar problemas de timezone
                const birthDateISO = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))).toISOString()
                dataToSend.birthDate = birthDateISO
            }

            const res = await fetch(`/api/admin/clients/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            })

            const result = await res.json()

            if (res.ok && result.success) {
                await fetchClientDetails()
                setIsEditing(false)
                // CORREÇÃO: Chamar onUpdate se existir para atualizar a lista principal
                if (onUpdate) {
                    onUpdate()
                }
                alert('Cliente atualizado com sucesso!')
            } else {
                alert(result.error || 'Erro ao atualizar cliente')
            }
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error)
            alert('Erro ao atualizar cliente')
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            CONFIRMED: 'bg-green-100 text-green-700',
            PENDING: 'bg-orange-100 text-orange-700',
            CANCELLED: 'bg-red-100 text-red-700',
            COMPLETED: 'bg-blue-100 text-blue-700',
            NO_SHOW: 'bg-gray-100 text-gray-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            CONFIRMED: 'Confirmado',
            PENDING: 'Pendente',
            CANCELLED: 'Cancelado',
            COMPLETED: 'Concluído',
            NO_SHOW: 'Não Compareceu'
        }
        return labels[status] || status
    }

    // CORREÇÃO: Função para formatar data de nascimento para exibição (DD/MM/YYYY)
    const formatBirthDateDisplay = (isoDate: string | null) => {
        if (!isoDate) return 'Não informado'

        const date = new Date(isoDate)
        // Usar UTC para evitar problema de timezone
        const day = String(date.getUTCDate()).padStart(2, '0')
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const year = date.getUTCFullYear()

        return `${day}/${month}/${year}`
    }

    // CORREÇÃO: Calcular idade corretamente
    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return null

        const today = new Date()
        const birth = new Date(birthDate)

        let age = today.getFullYear() - birth.getUTCFullYear()
        const monthDiff = today.getMonth() - birth.getUTCMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getUTCDate())) {
            age--
        }

        return age
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    const { client, stats, appointments, reviews } = data
    const clientAge = calculateAge(client.birthDate)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full my-8">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-gold to-yellow-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white text-gold flex items-center justify-center text-3xl font-bold">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{client.name}</h2>
                                <p className="text-white/80">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Estatísticas Principais */}
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
                            <p className="text-sm text-gray-600 mb-1">Total de Visitas</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.completedAppointments}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.pendingAppointments} pendentes
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <DollarSign className="mx-auto mb-2 text-green-600" size={24} />
                            <p className="text-sm text-gray-600 mb-1">Total Gasto</p>
                            <p className="text-2xl font-bold text-green-600">R$ {stats.totalSpent.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Ticket: R$ {stats.avgTicket.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                            <TrendingUp className="mx-auto mb-2 text-purple-600" size={24} />
                            <p className="text-sm text-gray-600 mb-1">Taxa de Comparecimento</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.noShowAppointments} faltas
                            </p>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                            <Star className="mx-auto mb-2 text-yellow-600" size={24} />
                            <p className="text-sm text-gray-600 mb-1">Avaliação Média</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'} ⭐
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {reviews.length} avaliações
                            </p>
                        </div>
                    </div>

                    {/* Top Serviços */}
                    {stats.topServices.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="text-purple-600" size={24} />
                                <h3 className="text-lg font-bold text-charcoal">Serviços Favoritos</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.topServices.slice(0, 3).map((service, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                                            <div>
                                                <p className="font-semibold text-charcoal">{service.name}</p>
                                                <p className="text-sm text-gray-600">{service.count} vezes</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gold">R$ {service.revenue.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Informações Pessoais */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-charcoal">Informações Pessoais</h3>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                >
                                    <Edit size={16} />
                                    Editar
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Save size={16} />
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            // Restaurar valores originais
                                            let formattedBirthDate = ''
                                            if (client.birthDate) {
                                                formattedBirthDate = new Date(client.birthDate).toISOString().split('T')[0]
                                            }
                                            setEditForm({
                                                name: client.name,
                                                email: client.email,
                                                phone: client.phone,
                                                birthDate: formattedBirthDate
                                            })
                                        }}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                                    />
                                ) : (
                                    <p className="text-charcoal font-semibold">{client.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                                    />
                                ) : (
                                    <p className="text-charcoal font-semibold">{client.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                                    />
                                ) : (
                                    <p className="text-charcoal font-semibold">{client.phone}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editForm.birthDate}
                                        onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                                    />
                                ) : (
                                    <p className="text-charcoal font-semibold">
                                        {client.birthDate
                                            ? `${formatBirthDateDisplay(client.birthDate)}${clientAge ? ` (${clientAge} anos)` : ''}`
                                            : 'Não informado'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Última Visita</label>
                                <p className="text-charcoal font-semibold">
                                    {stats.lastAppointment
                                        ? `${new Date(stats.lastAppointment).toLocaleDateString('pt-BR')} (${stats.daysSinceLastAppointment} dias atrás)`
                                        : 'Nunca'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avaliações */}
                    {reviews.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                                <Star className="text-yellow-600" size={20} />
                                Avaliações ({reviews.length})
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-charcoal">{review.service.name}</span>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        className={i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-gray-700 mb-2">&quot;{review.comment}&quot;</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Histórico de Agendamentos */}
                    <div>
                        <h3 className="text-lg font-bold text-charcoal mb-4">
                            Histórico de Agendamentos ({appointments.length})
                        </h3>

                        {appointments.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {appointments.map((apt) => {
                                    // Pegar nome do serviço ou combo
                                    const serviceName = apt.combo?.name || apt.service?.name || 'Serviço não identificado';
                                    const servicePrice = apt.finalPrice || (apt.combo ? 0 : apt.service?.price || 0);

                                    return (
                                        <div key={apt.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="font-semibold text-charcoal">
                                                            {apt.combo && '🎁 '}
                                                            {serviceName}
                                                        </p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                                                            {getStatusLabel(apt.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>📅 {new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                                                        <span>🕐 {apt.time}</span>
                                                        <span className="font-semibold text-gold">
                                                            R$ {servicePrice.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">Nenhum agendamento encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer com ações */}
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-between">
                    <button
                        onClick={() => {
                            const phone = client.phone.replace(/\D/g, '')
                            const message = `Olá, ${client.name}! 😊

Aqui é da Henrique Bilro Cabeleireiros.
Estou entrando em contato para falarmos sobre seus atendimentos conosco.

Fico à disposição 💛`

                            const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
                            window.open(url, '_blank')
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                        <MessageCircle size={20} />
                        Enviar WhatsApp
                    </button>

                </div>
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
            `}</style>
        </div>
    )
}