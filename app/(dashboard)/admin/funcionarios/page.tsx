// app/(dashboard)/admin/funcionarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Staff {
    id: string
    name: string
    email: string | null
    phone: string | null
    photo: string | null
    cpf: string | null
    specialties: string[]
    commissionPercent: number
    active: boolean
    hireDate: string
    _count: {
        services: number
    }
}

export default function FuncionariosPage() {
    const router = useRouter()
    const [staff, setStaff] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        photo: '',
        specialties: [] as string[],
        commissionPercent: 30
    })

    const availableSpecialties = [
        'Corte Feminino',
        'Corte Masculino',
        'Coloração',
        'Mechas',
        'Alisamento',
        'Escova',
        'Manicure',
        'Pedicure',
        'Design de Sobrancelhas',
        'Maquiagem',
        'Depilação',
        'Massagem'
    ]

    useEffect(() => {
        loadStaff()
    }, [])

    async function loadStaff() {
        try {
            const res = await fetch('/api/staff')
            const data = await res.json()

            if (data.success) {
                setStaff(data.data)
            }
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error)
        } finally {
            setLoading(false)
        }
    }

    function openAddModal() {
        setEditingStaff(null)
        setFormData({
            name: '',
            email: '',
            phone: '',
            cpf: '',
            photo: '',
            specialties: [],
            commissionPercent: 30
        })
        setShowModal(true)
    }

    function openEditModal(s: Staff) {
        setEditingStaff(s)
        setFormData({
            name: s.name,
            email: s.email || '',
            phone: s.phone || '',
            cpf: s.cpf || '',
            photo: s.photo || '',
            specialties: s.specialties,
            commissionPercent: s.commissionPercent
        })
        setShowModal(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.name || formData.specialties.length === 0) {
            alert('Preencha nome e selecione pelo menos uma especialidade')
            return
        }

        try {
            const url = editingStaff ? '/api/staff' : '/api/staff'
            const method = editingStaff ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingStaff ? { id: editingStaff.id, ...formData } : formData)
            })

            const data = await res.json()

            if (data.success) {
                alert(data.message)
                setShowModal(false)
                loadStaff()
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao salvar')
        }
    }

    async function handleToggleActive(id: string, active: boolean) {
        if (!confirm(`Deseja ${active ? 'desativar' : 'ativar'} este funcionário?`)) return

        try {
            const res = await fetch('/api/staff', {
                method: active ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(active ? null : { id, active: true })
            })

            if (active) {
                const url = new URL('/api/staff', window.location.origin)
                url.searchParams.set('id', id)
                const deleteRes = await fetch(url.toString(), { method: 'DELETE' })
                const data = await deleteRes.json()

                if (data.success) {
                    loadStaff()
                }
            } else {
                const data = await res.json()
                if (data.success) {
                    loadStaff()
                }
            }
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    function toggleSpecialty(specialty: string) {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty]
        }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">👥 Funcionários</h1>
                    <p className="text-gray-600 mt-1">Gerencie sua equipe</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                    + Novo Funcionário
                </button>
            </div>

            {/* Lista de Funcionários */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {staff.map(s => (
                    <div
                        key={s.id}
                        className={`bg-white rounded-xl shadow-md p-6 border-2 ${s.active ? 'border-green-200' : 'border-gray-200 opacity-60'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {s.photo ? (
                                    <Image
                                        src={s.photo}
                                        alt={s.name}
                                        width={60}
                                        height={60}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-15 h-15 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {s.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{s.name}</h3>
                                    <span className={`text-sm px-2 py-1 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {s.active ? '🟢 Ativo' : '⚪ Inativo'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                            {s.phone && (
                                <p className="flex items-center gap-2">
                                    📞 {s.phone}
                                </p>
                            )}
                            {s.email && (
                                <p className="flex items-center gap-2">
                                    📧 {s.email}
                                </p>
                            )}
                            <p className="flex items-center gap-2">
                                💰 Comissão: <span className="font-semibold text-pink-600">{s.commissionPercent}%</span>
                            </p>
                            <p className="flex items-center gap-2">
                                📊 Serviços realizados: <span className="font-semibold">{s._count.services}</span>
                            </p>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Especialidades:</p>
                            <div className="flex flex-wrap gap-1">
                                {s.specialties.map(spec => (
                                    <span
                                        key={spec}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                    >
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => openEditModal(s)}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                onClick={() => router.push(`/admin/funcionarios/${s.id}`)}
                                className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition"
                            >
                                📊 Histórico
                            </button>
                            <button
                                onClick={() => handleToggleActive(s.id, s.active)}
                                className={`px-4 py-2 rounded-lg text-sm transition ${s.active
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                                    }`}
                            >
                                {s.active ? '🔴' : '🟢'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {staff.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Nenhum funcionário cadastrado ainda</p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 text-pink-600 hover:underline"
                    >
                        Cadastrar primeiro funcionário
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-xl">
                            <h2 className="text-2xl font-bold">
                                {editingStaff ? '✏️ Editar Funcionário' : '➕ Novo Funcionário'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                        placeholder="(84) 99999-9999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    CPF
                                </label>
                                <input
                                    type="text"
                                    value={formData.cpf}
                                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Comissão (%) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.commissionPercent}
                                    onChange={e => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Especialidades * (selecione pelo menos uma)
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
                                    {availableSpecialties.map(spec => (
                                        <label key={spec} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={formData.specialties.includes(spec)}
                                                onChange={() => toggleSpecialty(spec)}
                                                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                                            />
                                            <span className="text-sm text-gray-700">{spec}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg"
                                >
                                    {editingStaff ? 'Atualizar' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}