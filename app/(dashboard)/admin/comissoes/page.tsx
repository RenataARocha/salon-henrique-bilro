// app/(dashboard)/admin/comissoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DollarSign, CheckCircle, Clock, Calendar } from 'lucide-react'

interface MonthlyReport {
    id: string
    year: number
    month: number
    totalServices: number
    totalRevenue: number
    totalCommission: number
    paid: boolean
    paidAt: string | null
    paymentNotes: string | null
    staff: {
        id: string
        name: string
        photo: string | null
        commissionPercent: number
    }
}

export default function ComissoesPage() {
    const [reports, setReports] = useState<MonthlyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [paymentNotes, setPaymentNotes] = useState('')
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null)

    useEffect(() => {
        loadReports()
    }, [selectedMonth, selectedYear])

    async function loadReports() {
        try {
            setLoading(true)

            // Buscar relatórios mensais
            const month = selectedMonth || new Date().getMonth() + 1
            const year = selectedYear

            const res = await fetch(`/api/staff/reports?period=month&year=${year}&month=${month}`)
            const data = await res.json()

            if (data.success) {
                // Converter para formato de relatórios mensais
                // TODO: Ajustar API para retornar relatórios mensais consolidados
                setReports([])
            }
        } catch (error) {
            console.error('Erro ao carregar comissões:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handlePayCommission(report: MonthlyReport) {
        setSelectedReport(report)
        setShowPayModal(true)
    }

    async function confirmPayment() {
        if (!selectedReport) return

        try {
            const res = await fetch('/api/staff/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: selectedReport.staff.id,
                    year: selectedReport.year,
                    month: selectedReport.month,
                    paymentNotes
                })
            })

            const data = await res.json()

            if (data.success) {
                alert('Comissão marcada como paga!')
                setShowPayModal(false)
                setPaymentNotes('')
                loadReports()
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao processar pagamento')
        }
    }

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Agrupar por status
    const pendingReports = reports.filter(r => !r.paid)
    const paidReports = reports.filter(r => r.paid)

    const totalPending = pendingReports.reduce((sum, r) => sum + r.totalCommission, 0)
    const totalPaid = paidReports.reduce((sum, r) => sum + r.totalCommission, 0)

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">💰 Comissões</h1>
                <p className="text-gray-600 mt-1">Gerencie os pagamentos de comissões da equipe</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mês
                        </label>
                        <select
                            value={selectedMonth || currentMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        >
                            {monthNames.map((name, index) => (
                                <option key={index} value={index + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ano
                        </label>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                        >
                            {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={loadReports}
                            className="w-full bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700 transition"
                        >
                            Buscar
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-white/80" size={24} />
                        <p className="text-sm font-semibold opacity-90">Comissões Pendentes</p>
                    </div>
                    <p className="text-4xl font-bold">R$ {totalPending.toFixed(2)}</p>
                    <p className="text-sm text-orange-100 mt-2">{pendingReports.length} funcionário(s)</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="text-white/80" size={24} />
                        <p className="text-sm font-semibold opacity-90">Comissões Pagas</p>
                    </div>
                    <p className="text-4xl font-bold">R$ {totalPaid.toFixed(2)}</p>
                    <p className="text-sm text-green-100 mt-2">{paidReports.length} funcionário(s)</p>
                </div>
            </div>

            {/* Lista de Comissões Pendentes */}
            {pendingReports.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="text-orange-500" size={24} />
                        Pendentes
                    </h2>

                    <div className="space-y-4">
                        {pendingReports.map(report => (
                            <div key={report.id} className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {report.staff.photo ? (
                                            <img
                                                src={report.staff.photo}
                                                alt={report.staff.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                {report.staff.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{report.staff.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {monthNames[report.month - 1]} {report.year} • {report.totalServices} serviços
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Comissão</p>
                                            <p className="text-2xl font-bold text-orange-600">
                                                R$ {report.totalCommission.toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handlePayCommission(report)}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                                        >
                                            Marcar como Pago
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de Comissões Pagas */}
            {paidReports.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={24} />
                        Pagas
                    </h2>

                    <div className="space-y-4">
                        {paidReports.map(report => (
                            <div key={report.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {report.staff.photo ? (
                                            <img
                                                src={report.staff.photo}
                                                alt={report.staff.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                {report.staff.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{report.staff.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {monthNames[report.month - 1]} {report.year} • {report.totalServices} serviços
                                            </p>
                                            {report.paidAt && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✅ Pago em {new Date(report.paidAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Comissão</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            R$ {report.totalCommission.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nenhuma comissão */}
            {reports.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <p className="text-gray-500 text-lg">Nenhuma comissão encontrada para este período</p>
                </div>
            )}

            {/* Modal Pagamento */}
            {showPayModal && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
                            <h2 className="text-2xl font-bold">💰 Confirmar Pagamento</h2>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Funcionário:</p>
                                <p className="text-lg font-bold text-gray-900">{selectedReport.staff.name}</p>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Período:</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {monthNames[selectedReport.month - 1]} {selectedReport.year}
                                </p>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Valor da Comissão:</p>
                                <p className="text-3xl font-bold text-green-600">
                                    R$ {selectedReport.totalCommission.toFixed(2)}
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                                    placeholder="Ex: Pago via PIX, Transferência bancária..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPayModal(false)
                                        setPaymentNotes('')
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}