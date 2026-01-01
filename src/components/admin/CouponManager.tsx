import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit, Trash2, BarChart3, Calendar, Clock, DollarSign, Users, TrendingUp, Search } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    minValue: number | null;
    maxUses: number | null;
    usedCount: number;
    validFrom: string;
    validUntil: string;
    active: boolean;
    applicableServices: string[];
    perUserLimit: boolean;
    daysOfWeek: number[];
    timeStart: string | null;
    timeEnd: string | null;
    usageCount?: number;
    remainingUses: number | null;
    isExpired: boolean;
    isActive: boolean;
}

interface Stats {
    coupon: any;
    summary: any;
    usageByDay: any[];
    usageByMonth: any[];
    topUsers: any[];
    recentUsage: any[];
}

const CouponManager = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [showStats, setShowStats] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const discountTypes = [
        { value: 'PERCENTAGE', label: 'Desconto Percentual (%)' },
        { value: 'FIXED', label: 'Desconto Fixo (R$)' }
    ];

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minValue: '',
        maxUses: '',
        perUserLimit: false,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        applicableServices: [] as string[],
        daysOfWeek: [] as number[],
        timeStart: '',
        timeEnd: '',
        active: true
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/coupons');
            const result = await response.json();
            if (result.success) {
                setCoupons(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar cupons:', error);
        }
        setLoading(false);
    };

    const loadStats = async (couponId: string) => {
        try {
            const response = await fetch(`/api/admin/coupons/${couponId}/stats`);
            const data = await response.json();
            setStats(data);
            setShowStats(couponId);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    const handleSubmit = async () => {
        const method = editingCoupon ? 'PUT' : 'POST';
        const url = editingCoupon
            ? `/api/admin/coupons?id=${editingCoupon.id}`
            : '/api/admin/coupons';

        const body = editingCoupon
            ? { ...formData, id: editingCoupon.id }
            : formData;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                resetForm();
                loadCoupons();
            } else {
                alert(result.message || 'Erro ao salvar cupom');
            }
        } catch (error) {
            console.error('Erro ao salvar cupom:', error);
            alert('Erro ao salvar cupom');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente desativar este cupom?')) return;

        try {
            const response = await fetch(`/api/admin/coupons?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                alert(result.message);
                loadCoupons();
            }
        } catch (error) {
            console.error('Erro ao deletar cupom:', error);
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minValue: coupon.minValue?.toString() || '',
            maxUses: coupon.maxUses?.toString() || '',
            perUserLimit: coupon.perUserLimit,
            validFrom: coupon.validFrom.split('T')[0],
            validUntil: coupon.validUntil.split('T')[0],
            applicableServices: coupon.applicableServices || [],
            daysOfWeek: coupon.daysOfWeek || [],
            timeStart: coupon.timeStart || '',
            timeEnd: coupon.timeEnd || '',
            active: coupon.active
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'PERCENTAGE',
            discountValue: '',
            minValue: '',
            maxUses: '',
            perUserLimit: false,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: '',
            applicableServices: [],
            daysOfWeek: [],
            timeStart: '',
            timeEnd: '',
            active: true
        });
        setEditingCoupon(null);
        setShowForm(false);
    };

    const filteredCoupons = coupons.filter(coupon => {
        const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase()) ||
            coupon.description.toLowerCase().includes(search.toLowerCase());

        if (filter === 'active') return matchesSearch && coupon.isActive;
        if (filter === 'expired') return matchesSearch && coupon.isExpired;
        if (filter === 'inactive') return matchesSearch && !coupon.active;

        return matchesSearch;
    });

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.discountType === 'PERCENTAGE') {
            return `${coupon.discountValue}% OFF`;
        }
        return `R$ ${coupon.discountValue.toFixed(2)} OFF`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (showStats && stats) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <button
                    onClick={() => { setShowStats(null); setStats(null); }}
                    className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
                >
                    ← Voltar aos cupons
                </button>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">🎟️ {stats.coupon.code}</h2>
                            <p className="text-gray-600">{stats.coupon.description}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full ${stats.coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {stats.coupon.active ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-blue-600 text-sm font-medium mb-1">Total de Usos</div>
                            <div className="text-3xl font-bold text-blue-900">{stats.summary.totalUses}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-green-600 text-sm font-medium mb-1">Usuários Únicos</div>
                            <div className="text-3xl font-bold text-green-900">{stats.summary.uniqueUsers}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-purple-600 text-sm font-medium mb-1">Desconto Total</div>
                            <div className="text-3xl font-bold text-purple-900">
                                R$ {stats.summary.totalDiscountGiven.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg">
                            <div className="text-pink-600 text-sm font-medium mb-1">Receita Gerada</div>
                            <div className="text-3xl font-bold text-pink-900">
                                R$ {stats.summary.totalRevenue.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button
                    onClick={resetForm}
                    className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
                >
                    ← Voltar aos cupons
                </button>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        {editingCoupon ? '✏️ Editar Cupom' : '➕ Novo Cupom'}
                    </h2>

                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código do Cupom *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder="Ex: NATAL2024"
                                    required
                                    disabled={!!editingCoupon}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Desconto *
                                </label>
                                <select
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                >
                                    {discountTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição *
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                placeholder="Ex: 15% OFF em todos os serviços"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valor do Desconto *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder={formData.discountType === 'PERCENTAGE' ? '15' : '50'}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Limite de Uso
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxUses}
                                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder="Vazio = ilimitado"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valor Mínimo (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.minValue}
                                    onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data Início *
                                </label>
                                <input
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data Fim *
                                </label>
                                <input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="perUserLimit"
                                checked={formData.perUserLimit}
                                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.checked })}
                                className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <label htmlFor="perUserLimit" className="text-sm font-medium text-gray-700">
                                Limitar a um uso por cliente
                            </label>
                        </div>

                        <div className="flex gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
                            >
                                {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">🎟️ Cupons de Desconto</h1>
                    <p className="text-gray-600 mt-1">Gerencie cupons promocionais do salão</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Cupom
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar cupons..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg transition ${filter === 'active' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setFilter('expired')}
                            className={`px-4 py-2 rounded-lg transition ${filter === 'expired' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Expirados
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredCoupons.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Nenhum cupom encontrado</p>
                    </div>
                ) : (
                    filteredCoupons.map(coupon => (
                        <div key={coupon.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full font-bold text-lg">
                                            🎟️ {coupon.code}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm ${coupon.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : coupon.isExpired
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {coupon.isActive ? '✓ Ativo' : coupon.isExpired ? '⏰ Expirado' : '⊘ Inativo'}
                                        </div>
                                    </div>

                                    <p className="text-gray-700 font-medium mb-3">{coupon.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            <span className="font-semibold">{formatDiscount(coupon)}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <TrendingUp className="w-4 h-4 mr-1" />
                                            Usado: <span className="font-semibold ml-1">{coupon.usedCount} vezes</span>
                                        </div>
                                        {coupon.remainingUses !== null && (
                                            <div className="flex items-center text-gray-600">
                                                Restam: <span className="font-semibold ml-1">{coupon.remainingUses} usos</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            Válido até: <span className="font-semibold ml-1">
                                                {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(coupon)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                        title="Editar"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => loadStats(coupon.id)}
                                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                                        title="Estatísticas"
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                        title="Desativar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CouponManager;