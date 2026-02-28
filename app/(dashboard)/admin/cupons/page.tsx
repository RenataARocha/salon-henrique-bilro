// app/(dashboard)/admin/cupons/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Calendar, Tag, Percent, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion'
import ModalEnvioMassa from '@/components/ModalEnvioMassa'
import { Send } from 'lucide-react'
interface Cupom {
    id: string;
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    active: boolean;
    validFrom: string;
    validUntil: string;
    maxUses: number | null;
    usedCount: number;
    createdAt: string;
}

interface FormData {
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: string;
    validFrom: string;
    validUntil: string;
    maxUses: string;
}

export default function AdminCuponsPage() {
    const [cupons, setCupons] = useState<Cupom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAtivo, setFilterAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [modalEnvioAberto, setModalEnvioAberto] = useState(false)
    const [cupomSelecionado, setCupomSelecionado] = useState<{ id: string; code: string } | null>(null)

    const [formData, setFormData] = useState<FormData>({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        validFrom: '',
        validUntil: '',
        maxUses: ''
    });

    useEffect(() => {
        carregarCupons();
    }, []);

    const carregarCupons = async () => {
        try {
            const response = await fetch('/api/admin/cupons');
            const result = await response.json();
            if (result.success) {
                setCupons(result.data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar cupons:', error);
            alert('Erro ao carregar cupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            code: formData.code.toUpperCase(),
            description: formData.description,
            discountType: formData.discountType,
            discountValue: parseFloat(formData.discountValue),
            validFrom: formData.validFrom,
            validUntil: formData.validUntil,
            maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
        };

        try {
            const url = editingId ? `/api/admin/cupons?id=${editingId}` : '/api/admin/cupons';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || (editingId ? 'Cupom atualizado!' : 'Cupom criado!'));
                setShowModal(false);
                resetForm();
                carregarCupons();
            } else {
                alert(result.message || 'Erro ao salvar cupom');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao salvar cupom');
        }
    };

    const handleEdit = (cupom: Cupom) => {
        setEditingId(cupom.id);
        setFormData({
            code: cupom.code,
            description: cupom.description,
            discountType: cupom.discountType,
            discountValue: cupom.discountValue.toString(),
            validFrom: cupom.validFrom ? cupom.validFrom.split('T')[0] : '',
            validUntil: cupom.validUntil ? cupom.validUntil.split('T')[0] : '',
            maxUses: cupom.maxUses?.toString() || ''
        });
        setShowModal(true);
    };

    const handleToggle = async (id: string, ativo: boolean) => {
        try {
            const response = await fetch('/api/admin/cupons/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ativo: !ativo })
            });

            if (response.ok) {
                carregarCupons();
            }
        } catch (error) {
            console.error('Erro ao alternar status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

        try {
            const response = await fetch(`/api/admin/cupons?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || 'Cupom excluído!');
                carregarCupons();
            } else {
                alert(result.message || 'Erro ao excluir cupom');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir cupom');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'PERCENTAGE',
            discountValue: '',
            validFrom: '',
            validUntil: '',
            maxUses: ''
        });
        setEditingId(null);
    };

    const cuponsFiltrados = cupons.filter(cupom => {
        const matchSearch = cupom.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cupom.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchAtivo = filterAtivo === 'todos' ||
            (filterAtivo === 'ativos' && cupom.active) ||
            (filterAtivo === 'inativos' && !cupom.active);

        return matchSearch && matchAtivo;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <div className="mb-6 flex justify-end gap-3">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >
                        <ArrowLeft size={20} />
                        Painel
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold "
                    >
                        <Home size={20} />
                        Voltar ao início
                    </Link>
                </div>

                {/* Header */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-6 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cupons</h1>
                            <p className="text-gray-600 mt-1">Crie e gerencie cupons de desconto</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="bg-rose-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition-colors"
                        >
                            <Plus size={20} />
                            Novo Cupom
                        </button>
                    </div>


                    {/* Filtros */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por código ou descrição..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterAtivo('todos')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filterAtivo === 'todos'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterAtivo('ativos')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filterAtivo === 'ativos'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => setFilterAtivo('inativos')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filterAtivo === 'inativos'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Inativos
                            </button>
                        </div>
                    </div>

                </motion.div>


                {/* Lista de Cupons */}
                <div className="grid gap-4">
                    {cuponsFiltrados.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Tag className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-500 text-lg">Nenhum cupom encontrado</p>
                        </div>
                    ) : (
                        cuponsFiltrados.map((cupom, index) => (
                            <motion.div
                                key={cupom.id}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl font-bold text-rose-600">{cupom.code}</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${cupom.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {cupom.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 mb-3">{cupom.description}</p>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Percent size={16} />
                                                <span>
                                                    {cupom.discountType === 'PERCENTAGE'
                                                        ? `${cupom.discountValue}% de desconto`
                                                        : `R$ ${cupom.discountValue.toFixed(2)} de desconto`
                                                    }
                                                </span>
                                            </div>

                                            {cupom.maxUses && (
                                                <div className="flex items-center gap-1">
                                                    <Tag size={16} />
                                                    <span>{cupom.usedCount} / {cupom.maxUses} usados</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <Calendar size={16} />
                                                <span>
                                                    {new Date(cupom.validFrom).toLocaleDateString('pt-BR')}
                                                    {' - '}
                                                    {new Date(cupom.validUntil).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleToggle(cupom.id, cupom.active)}
                                            className={`p-2 rounded-lg transition-colors ${cupom.active
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            title={cupom.active ? 'Desativar' : 'Ativar'}
                                        >
                                            {cupom.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>

                                        <button
                                            onClick={() => handleEdit(cupom)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={20} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(cupom.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={20} />
                                        </button>

                                        <button
                                            onClick={() => {
                                                setCupomSelecionado({ id: cupom.id, code: cupom.code })
                                                setModalEnvioAberto(true)
                                            }}
                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                            title="Enviar para Clientes"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">
                                {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Código *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent uppercase"
                                            placeholder="DESCONTO10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Desconto *
                                        </label>
                                        <select
                                            required
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        >
                                            <option value="PERCENTAGE">Percentual (%)</option>
                                            <option value="FIXED">Valor Fixo (R$)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        placeholder="10% de desconto em todos os serviços"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor do Desconto *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '50.00'}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formData.discountType === 'PERCENTAGE' ? 'Percentual de desconto (0-100)' : 'Valor em reais'}
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Data Início *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Data Fim *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantidade Máxima de Usos
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        placeholder="Deixe vazio para ilimitado"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                    >
                                        {editingId ? 'Salvar Alterações' : 'Criar Cupom'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )
            }

            {/* Modal de Envio em Massa */}
            {modalEnvioAberto && cupomSelecionado && (
                <ModalEnvioMassa
                    isOpen={modalEnvioAberto}
                    onClose={() => {
                        setModalEnvioAberto(false)
                        setCupomSelecionado(null)
                    }}
                    tipo="cupom"
                    itemId={cupomSelecionado.id}
                    itemName={cupomSelecionado.code}
                />
            )}
        </div >
    );
}