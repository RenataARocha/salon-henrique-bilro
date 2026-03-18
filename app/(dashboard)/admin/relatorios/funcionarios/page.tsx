// app/(dashboard)/admin/relatorios/funcionarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, CheckCircle, Home, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // ✅ IMPORTAÇÃO CORRETA
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface StaffReport {
    staff: {
        id: string
        name: string
        photo: string | null
        commissionPercent: number
    }
    totalServices: number
    totalRevenue: number
    totalCommission: number
    commissionPaid: number
    commissionPending: number
    services: any[]
}

interface Totals {
    totalServices: number
    totalRevenue: number
    totalCommission: number
    commissionPaid: number
    commissionPending: number
}

export default function RelatoriosFuncionariosPage() {
    const [reports, setReports] = useState<StaffReport[]>([])
    const [totals, setTotals] = useState<Totals | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')
    const [selectedStaff, setSelectedStaff] = useState<string>('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loadingExcel, setLoadingExcel] = useState(false)
    const [loadingPDF, setLoadingPDF] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        loadReports()
    }, [period, selectedStaff])

    async function loadReports() {
        try {
            setLoading(true)

            let url = `/api/staff/reports?period=${period}`

            if (selectedStaff) {
                url += `&staffId=${selectedStaff}`
            }

            if (period === 'custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`
            }

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setReports(data.data)
                setTotals(data.totals)
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
        } finally {
            setLoading(false)
        }
    }

    // ✅ EXPORTAR PARA EXCEL
    async function exportToExcel() {
        if (!reports.length || !totals) { // Verificação extra
            toast.error('Nenhum dado para exportar');
            return;
        }

        const resumo = [
            ['RELATÓRIO DE FUNCIONÁRIOS'],
            ['Período:', getPeriodLabel()],
            [''],
            ['RESUMO GERAL'],
            ['Total de Serviços', totals.totalServices],
            ['Faturamento Total', `R$ ${totals.totalRevenue.toFixed(2)}`],
            ['Total Comissões', `R$ ${totals.totalCommission.toFixed(2)}`],
            ['Comissões Pagas', `R$ ${totals.commissionPaid.toFixed(2)}`],
            ['Comissões Pendentes', `R$ ${totals.commissionPending.toFixed(2)}`],
        ];

        // Sheet 2: Detalhes por Funcionário
        const detalhes = [
            ['Funcionário', 'Total Serviços', 'Faturamento', 'Comissão Total', 'Comissão Paga', 'Comissão Pendente', '% Comissão'],
            ...reports.map(r => [
                r.staff.name,
                r.totalServices,
                `R$ ${r.totalRevenue.toFixed(2)}`,
                `R$ ${r.totalCommission.toFixed(2)}`,
                `R$ ${r.commissionPaid.toFixed(2)}`,
                `R$ ${r.commissionPending.toFixed(2)}`,
                `${r.staff.commissionPercent}%`
            ])
        ]

        // Criar workbook
        const wb = XLSX.utils.book_new()
        const ws1 = XLSX.utils.aoa_to_sheet(resumo)
        const ws2 = XLSX.utils.aoa_to_sheet(detalhes)

        XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Geral')
        XLSX.utils.book_append_sheet(wb, ws2, 'Detalhes por Funcionário')


        // Download
        XLSX.writeFile(wb, `Relatorio_Funcionarios_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.success('Excel exportado com sucesso!')
        setTimeout(() => setSuccessMessage(''), 3000)
    }

    // ✅ EXPORTAR PARA PDF - CORRIGIDO
    async function exportToPDF() {
        if (!reports.length || !totals) {
            toast.error('Nenhum dado para exportar');
            return;
        }

        const doc = new jsPDF()

        // Título
        doc.setFontSize(20)
        doc.setTextColor(212, 175, 55) // Gold
        doc.text('RELATÓRIO DE FUNCIONÁRIOS', 105, 20, { align: 'center' })

        // Período
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text(`Período: ${getPeriodLabel()}`, 20, 35)

        // Resumo Geral
        doc.setFontSize(14)
        doc.setTextColor(212, 175, 55)
        doc.text('Resumo Geral', 20, 50)

        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`Total de Serviços: ${totals.totalServices}`, 20, 60);
        doc.text(`Faturamento Total: R$ ${totals.totalRevenue.toFixed(2)}`, 20, 68);
        doc.text(`Total Comissões: R$ ${totals.totalCommission.toFixed(2)}`, 20, 76);
        doc.text(`Comissões Pagas: R$ ${totals.commissionPaid.toFixed(2)}`, 20, 84);
        doc.text(`Comissões Pendentes: R$ ${totals.commissionPending.toFixed(2)}`, 20, 92);

        // ✅ TABELA CORRIGIDA
        autoTable(doc, {
            startY: 105,
            head: [['Funcionário', 'Serviços', 'Faturamento', 'Comissão', 'Pago', 'Pendente']],
            body: reports.map(r => [
                r.staff.name,
                r.totalServices,
                `R$ ${r.totalRevenue.toFixed(2)}`,
                `R$ ${r.totalCommission.toFixed(2)}`,
                `R$ ${r.commissionPaid.toFixed(2)}`,
                `R$ ${r.commissionPending.toFixed(2)}`
            ]),
            headStyles: { fillColor: [212, 175, 55] }
        })

        // Download
        doc.save(`Relatorio_Funcionarios_${new Date().toISOString().split('T')[0]}.pdf`);

        toast.success('PDF exportado com sucesso!')
        setTimeout(() => setSuccessMessage(''), 3000)
    }

    function getPeriodLabel() {
        switch (period) {
            case 'today': return 'Hoje'
            case 'week': return 'Esta Semana'
            case 'fortnight': return 'Últimos 15 Dias'
            case 'month': return 'Este Mês'
            case 'custom': return `${startDate} até ${endDate}`
            default: return period
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-beige gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                <p className="text-gray-500 text-sm">Carregando relatórios...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-charcoal">📊 Relatórios - Funcionários</h1>
                        <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua equipe</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={async () => {
                                setLoadingExcel(true)
                                try {
                                    await exportToExcel()
                                } finally {
                                    setLoadingExcel(false)
                                }
                            }}
                            disabled={loadingExcel}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingExcel ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Exportando...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Excel
                                </>
                            )}
                        </button>

                        <button
                            onClick={async () => {
                                setLoadingPDF(true)
                                try {
                                    await exportToPDF()
                                } finally {
                                    setLoadingPDF(false)
                                }
                            }}
                            disabled={loadingPDF}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingPDF ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Exportando...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    PDF
                                </>
                            )}
                        </button>

                        {successMessage && (
                            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-center font-semibold">
                                {successMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navegação */}
                <motion.div
                    className="mb-6 flex flex-col sm:flex-row sm:justify-end gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/admin"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >

                        <ArrowLeft size={20} />
                        Painel
                    </Link>
                    <Link
                        href="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        <Home size={20} />
                        Voltar ao início
                    </Link>
                </motion.div>


                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-t-4 border-gold">
                    <h2 className="text-lg font-bold text-charcoal mb-4">Filtros</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Período */}
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Período
                            </label>
                            <select
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                            >
                                <option value="today">Hoje</option>
                                <option value="week">Esta Semana</option>
                                <option value="fortnight">Últimos 15 Dias</option>
                                <option value="month">Este Mês</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>

                        {/* Data Inicial (se personalizado) */}
                        {period === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Data Inicial
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Data Final
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {/* Botão Gerar */}
                        {period === 'custom' && (
                            <div className="flex items-end">
                                <button
                                    onClick={loadReports}
                                    className="w-full bg-gradient-gold text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                                >
                                    Gerar Relatório
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ RESUMO GERAL - 5 CARDS COM COMISSÕES PAGAS */}
                {totals && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white border-t-4 border-blue-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-blue-500" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Total de Serviços</p>
                            </div>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold">{totals.totalServices}</p>
                        </div>

                        <div className="bg-white border-t-4 border-gold text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-gold" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Faturamento Total</p>
                            </div>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gold">R$ {totals.totalRevenue.toFixed(2)}</p>
                        </div>

                        <div className="bg-white border-t-4 border-gold text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="text-gold" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Total Comissões</p>
                            </div>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gold">R$ {totals.totalCommission.toFixed(2)}</p>
                        </div>

                        {/* ✅ NOVO CARD - COMISSÕES PAGAS */}
                        <div className="bg-white border-t-4 border-green-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="text-green-600" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Comissões Pagas</p>
                            </div>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">R$ {totals.commissionPaid.toFixed(2)}</p>
                        </div>

                        <div className="bg-white border-t-4 border-orange-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-orange-600" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Pendente</p>
                            </div>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-600">R$ {totals.commissionPending.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* Relatórios por Funcionário */}
                <div className="space-y-6 max-h-[70vh] sm:max-h-[80vh] lg:max-h-[90vh] overflow-y-auto p-2 sm:p-4">
                    {reports.length > 0 ? (
                        reports.map((report, index) => (
                            <div key={report.staff.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gold/20">

                                {/* Header do Funcionário */}
                                <div className="bg-gradient-gold text-white p-4 sm:p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="text-xl sm:text-3xl font-bold text-white/50">
                                                #{index + 1}
                                            </div>
                                            {report.staff.photo ? (
                                                <img
                                                    src={report.staff.photo}
                                                    alt={report.staff.name}
                                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 sm:border-4 border-white shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-bold border-2 border-white/30">
                                                    {report.staff.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg sm:text-2xl font-bold leading-tight">{report.staff.name}</h3>
                                                <p className="text-xs sm:text-sm text-white/80">
                                                    Comissão: {report.staff.commissionPercent}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-row justify-between sm:flex-col sm:text-right border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
                                            <p className="text-xs sm:text-sm text-white/80 uppercase tracking-wider">Serviços</p>
                                            <p className="text-2xl sm:text-4xl font-black">{report.totalServices}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Métricas - Grid 2x2 no mobile, 1x4 no desktop */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 sm:gap-4 sm:p-4 bg-gray-50/50">
                                    <MetricCard
                                        label="Faturamento"
                                        value={report.totalRevenue}
                                        color="text-charcoal"
                                    />
                                    <MetricCard
                                        label="Total Comissão"
                                        value={report.totalCommission}
                                        color="text-gold"
                                    />
                                    <MetricCard
                                        label="Pago"
                                        value={report.commissionPaid}
                                        color="text-green-600"
                                    />
                                    <MetricCard
                                        label="Pendente"
                                        value={report.commissionPending}
                                        color="text-orange-600"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-gold/20">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-500 text-lg">Nenhum serviço registrado no período selecionado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    {/* Sub-componente para limpar o código principal */ }
    function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
        return (
            <div className="bg-white p-3 sm:p-5 text-center rounded-lg border border-gray-100 shadow-sm">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold mb-1">{label}</p>
                <p className={`text-sm sm:text-xl font-bold ${color}`}>
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        );
    }


}