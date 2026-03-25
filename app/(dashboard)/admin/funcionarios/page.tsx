'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Home, Plus, X } from 'lucide-react'

const ESPECIALIDADES_BASE = [
    'Corte Feminino',
    'Corte Masculino',
    'Coloração Completa',
    'Alisamento',
    'Escova Progressiva',
    'Mechas',
    'Iluminados',
    'Loiro Milhões',
    'Hidratação Profunda',
    'Manicure',
    'Pedicure',
    'Maquiagem',
    'Massagem',
    'Design de Sobrancelhas',
    'Depilação',
    'Outros',
]

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
    const [novaEspecialidade, setNovaEspecialidade] = useState('')
    const [especialidadesExtras, setEspecialidadesExtras] = useState<string[]>([])

    useEffect(() => {
        loadStaff()
    }, [])

    async function loadStaff() {
        try {
            const res = await fetch('/api/staff')
            const data = await res.json()
            if (data.success) setStaff(data.data)
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error)
        } finally {
            setLoading(false)
        }
    }

    function openAddModal() {
        setEditingStaff(null)
        setFormData({ name: '', email: '', phone: '', cpf: '', photo: '', specialties: [], commissionPercent: 30 })
        setNovaEspecialidade('')
        setEspecialidadesExtras([])
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
        setNovaEspecialidade('')
        const extras = s.specialties.filter(esp => !ESPECIALIDADES_BASE.includes(esp))
        setEspecialidadesExtras(extras)
        setShowModal(true)
    }

    function adicionarEspecialidade() {
        const nome = novaEspecialidade.trim()
        if (!nome) return
        const todasDisponiveis = [...ESPECIALIDADES_BASE, ...especialidadesExtras]
        if (todasDisponiveis.includes(nome)) {
            alert('Essa especialidade já existe na lista')
            return
        }
        setEspecialidadesExtras(prev => [...prev, nome])
        setFormData(prev => ({ ...prev, specialties: [...prev.specialties, nome] }))
        setNovaEspecialidade('')
    }

    function removerEspecialidadeExtra(nome: string) {
        setEspecialidadesExtras(prev => prev.filter(e => e !== nome))
        setFormData(prev => ({ ...prev, specialties: prev.specialties.filter(e => e !== nome) }))
    }

    function toggleSpecialty(specialty: string) {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty]
        }))
    }

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.name || formData.specialties.length === 0) {
            alert('Preencha nome e selecione pelo menos uma especialidade')
            return
        }

        try {
            setIsSubmitting(true)

            const method = editingStaff ? 'PATCH' : 'POST'

            const res = await fetch('/api/staff', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    editingStaff
                        ? { id: editingStaff.id, ...formData }
                        : formData
                )
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
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleToggleActive(id: string, active: boolean) {
        if (!confirm(`Deseja ${active ? 'inativar' : 'ativar'} este funcionário?`)) return
        try {
            if (active) {
                const url = new URL('/api/staff', window.location.origin)
                url.searchParams.set('id', id)
                const res = await fetch(url.toString(), { method: 'DELETE' })
                const data = await res.json()
                if (data.success) loadStaff()
                else alert(data.error || 'Erro ao inativar')
            } else {
                const res = await fetch('/api/staff', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, active: true })
                })
                const data = await res.json()
                if (data.success) loadStaff()
                else alert(data.error || 'Erro ao ativar')
            }
        } catch (error) {
            console.error('Erro ao alterar status:', error)
        }
    }

    async function handleExcluir(id: string, nome: string) {
        const confirmou = confirm(
            `⚠️ EXCLUIR PERMANENTEMENTE\n\nTem certeza que deseja excluir "${nome}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados deste funcionário.`
        )
        if (!confirmou) return
        try {
            const url = new URL('/api/staff/excluir', window.location.origin)
            url.searchParams.set('id', id)
            const res = await fetch(url.toString(), { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                alert('Funcionário excluído com sucesso!')
                loadStaff()
            } else {
                alert(data.error || 'Erro ao excluir')
            }
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir funcionário')
        }
    }

    const todasEspecialidades = [...ESPECIALIDADES_BASE, ...especialidadesExtras]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-beige">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-gold/20 border-t-gold mx-auto mb-5 shadow-md"></div>
                    <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal">👥 Funcionários</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Gerencie sua equipe</p>
                    </div>
                </motion.div>

                {/* Navegação + Ação */}
                <motion.div
                    className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Botão Novo Funcionário */}
                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center sm:justify-start gap-2 bg-gradient-gold text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg active:scale-[0.98] transition-all w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        Novo Funcionário
                    </button>

                    {/* Links de navegação */}
                    <div className="flex gap-2">
                        <Link
                            href="/admin"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-charcoal rounded-xl hover:shadow-md transition-all text-sm font-semibold border border-gray-100 flex-1 sm:flex-none"
                        >
                            <ArrowLeft size={16} />
                            Painel
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-charcoal rounded-xl hover:shadow-md transition-all text-sm font-semibold border border-gray-100 flex-1 sm:flex-none"
                        >
                            <Home size={16} />
                            Início
                        </Link>
                    </div>
                </motion.div>

                {/* Lista de Funcionários */}
                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 max-h-[90vh] overflow-y-auto p-2 sm:p-4">
                    {staff.map((s, index) => (
                        <motion.div
                            key={s.id}
                            className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${s.active ? 'border-gold/30' : 'border-gray-100 opacity-60'}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            {/* Topo do card */}
                            <div className="bg-gradient-gold text-white p-4 sm:p-5">
                                <div className="flex flex-col gap-4">

                                    {/* TOPO */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {s.photo ? (
                                                <Image
                                                    src={s.photo}
                                                    alt={s.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                                    {s.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-base sm:text-lg truncate">{s.name}</h3>
                                                <p className="text-xs text-gold-light">
                                                    {s._count.services} {s._count.services === 1 ? 'serviço' : 'serviços'} • {s.commissionPercent}%
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`flex-shrink-0 ml-2 text-xs px-2 py-1 rounded-full font-medium ${s.active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
                                            {s.active ? '🟢 Ativo' : '⚪ Inativo'}
                                        </span>
                                    </div>

                                    {/* VALORES */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                        <div>
                                            <p className="text-xs text-gold-light">Comissão</p>
                                            <p className="text-xl sm:text-2xl font-bold">{s.commissionPercent}%</p>
                                        </div>
                                        <div className="flex justify-between sm:justify-end gap-4 text-xs text-gold-light">
                                            <span>{s._count.services} serviços realizados</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Corpo do card */}
                            <div className="p-4 sm:p-5 space-y-4">

                                {/* Contato */}
                                <div className="space-y-1.5 text-sm text-gray-500">
                                    {s.phone && (
                                        <p className="flex items-center gap-2">
                                            <span>📞</span>
                                            <span className="truncate">{s.phone}</span>
                                        </p>
                                    )}
                                    {s.email && (
                                        <p className="flex items-center gap-2">
                                            <span>📧</span>
                                            <span className="truncate">{s.email}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Especialidades */}
                                {s.specialties.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-2">Especialidades</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {s.specialties.map(spec => (
                                                <span key={spec} className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-medium">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Botões */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        onClick={() => openEditModal(s)}
                                        className="flex items-center justify-center gap-1.5 bg-gold/10 text-gold px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/20 active:scale-[0.98] transition-all"
                                    >
                                        <span>✏️</span> Editar
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/funcionarios/${s.id}`)}
                                        className="flex items-center justify-center gap-1.5 bg-charcoal/5 text-charcoal px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-charcoal/10 active:scale-[0.98] transition-all"
                                    >
                                        <span>📊</span> Histórico
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(s.id, s.active)}
                                        title={s.active ? 'Inativar funcionário' : 'Ativar funcionário'}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all ${s.active
                                            ? 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                    >
                                        {s.active ? '🔴 Inativar' : '🟢 Ativar'}
                                    </button>
                                    <button
                                        onClick={() => handleExcluir(s.id, s.name)}
                                        title="Excluir permanentemente"
                                        className="flex items-center justify-center gap-1.5 bg-red-50 text-red-500 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all"
                                    >
                                        🗑️ Excluir
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {staff.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-4xl mb-3">👥</p>
                        <p className="text-gray-500 font-medium">Nenhum funcionário cadastrado ainda</p>
                        <button onClick={openAddModal} className="mt-4 text-sm text-gold hover:underline font-semibold">
                            Cadastrar primeiro funcionário
                        </button>
                    </div>
                )}

                {/* Modal de Cadastro / Edição */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header do modal */}
                            <div className="sticky top-0 bg-gradient-gold text-white p-5 rounded-t-2xl flex items-center justify-between">
                                <h2 className="text-lg sm:text-2xl font-bold">
                                    {editingStaff ? '✏️ Editar Funcionário' : '➕ Novo Funcionário'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                        placeholder="Nome completo"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">Telefone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                            placeholder="(84) 99999-9999"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">CPF</label>
                                        <input
                                            type="text"
                                            value={formData.cpf}
                                            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">Comissão (%) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.commissionPercent}
                                            onChange={e => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Especialidades */}
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Especialidades * <span className="text-gray-400 font-normal">(selecione pelo menos uma)</span>
                                    </label>

                                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 mb-3">
                                        {todasEspecialidades.map(spec => (
                                            <label
                                                key={spec}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gold/10 p-2 rounded-lg group transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.specialties.includes(spec)}
                                                    onChange={() => toggleSpecialty(spec)}
                                                    className="w-4 h-4 text-gold rounded focus:ring-gold flex-shrink-0"
                                                />
                                                <span className="text-sm text-charcoal flex-1 leading-tight">{spec}</span>
                                                {!ESPECIALIDADES_BASE.includes(spec) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            removerEspecialidadeExtra(spec)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition flex-shrink-0"
                                                        title="Remover especialidade"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Campo nova especialidade */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={novaEspecialidade}
                                            onChange={e => setNovaEspecialidade(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    adicionarEspecialidade()
                                                }
                                            }}
                                            placeholder="Ex: Penteado de Festa, Sobrancelha..."
                                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none text-sm transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={adicionarEspecialidade}
                                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-semibold 
    hover:bg-gold-dark active:scale-[0.98] transition-all"
                                        >
                                            <Plus size={16} />
                                            Adicionar
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        💡 Digite uma especialidade e clique em Adicionar (ou pressione Enter)
                                    </p>
                                </div>

                                {/* Botões do form */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">

                                    {/* CANCELAR */}
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-charcoal rounded-xl text-sm font-semibold 
        hover:bg-gray-50 active:scale-[0.98] transition-all 
        disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar
                                    </button>

                                    {/* SUBMIT */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-gradient-gold text-white rounded-xl text-sm font-semibold 
        hover:shadow-lg active:scale-[0.98] transition-all 
        disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting
                                            ? 'Salvando...'
                                            : editingStaff
                                                ? 'Atualizar'
                                                : 'Cadastrar'}
                                    </button>

                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}