// app/(dashboard)/admin/relatorios/funcionarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, CheckCircle, Home, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // ✅ IMPORTAÇÃO CORRETA
import { motion } from 'framer-motion'
import Link from 'next/link'

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
    function exportToExcel() {
        if (!reports.length) {
            alert('Nenhum dado para exportar')
            return
        }

        // Sheet 1: Resumo Geral
        const resumo = [
            ['RELATÓRIO DE FUNCIONÁRIOS'],
            ['Período:', getPeriodLabel()],
            [''],
            ['RESUMO GERAL'],
            ['Total de Serviços', totals?.totalServices || 0],
            ['Faturamento Total', `R$ ${totals?.totalRevenue.toFixed(2) || '0.00'}`],
            ['Total Comissões', `R$ ${totals?.totalCommission.toFixed(2) || '0.00'}`],
            ['Comissões Pagas', `R$ ${totals?.commissionPaid.toFixed(2) || '0.00'}`],
            ['Comissões Pendentes', `R$ ${totals?.commissionPending.toFixed(2) || '0.00'}`],
        ]

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
        XLSX.writeFile(wb, `Relatorio_Funcionarios_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    // ✅ EXPORTAR PARA PDF - CORRIGIDO
    function exportToPDF() {
        if (!reports.length) {
            alert('Nenhum dado para exportar')
            return
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
        doc.text(`Total de Serviços: ${totals?.totalServices || 0}`, 20, 60)
        doc.text(`Faturamento Total: R$ ${totals?.totalRevenue.toFixed(2) || '0.00'}`, 20, 68)
        doc.text(`Total Comissões: R$ ${totals?.totalCommission.toFixed(2) || '0.00'}`, 20, 76)
        doc.text(`Comissões Pagas: R$ ${totals?.commissionPaid.toFixed(2) || '0.00'}`, 20, 84)
        doc.text(`Comissões Pendentes: R$ ${totals?.commissionPending.toFixed(2) || '0.00'}`, 20, 92)

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
        doc.save(`Relatorio_Funcionarios_${new Date().toISOString().split('T')[0]}.pdf`)
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
            <div className="flex items-center justify-center min-h-screen bg-beige">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-beige p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal">📊 Relatórios - Funcionários</h1>
                        <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua equipe</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            <Download size={20} />
                            Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                        >
                            <Download size={20} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Navegação */}
                <motion.div
                    className="mb-6 justify-end flex gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >

                        <ArrowLeft size={20} />
                        Painel
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white border-t-4 border-blue-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-blue-500" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Total de Serviços</p>
                            </div>
                            <p className="text-4xl font-bold">{totals.totalServices}</p>
                        </div>

                        <div className="bg-white border-t-4 border-gold text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-gold" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Faturamento Total</p>
                            </div>
                            <p className="text-4xl font-bold text-gold">R$ {totals.totalRevenue.toFixed(2)}</p>
                        </div>

                        <div className="bg-white border-t-4 border-gold text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="text-gold" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Total Comissões</p>
                            </div>
                            <p className="text-4xl font-bold text-gold">R$ {totals.totalCommission.toFixed(2)}</p>
                        </div>

                        {/* ✅ NOVO CARD - COMISSÕES PAGAS */}
                        <div className="bg-white border-t-4 border-green-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="text-green-600" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Comissões Pagas</p>
                            </div>
                            <p className="text-4xl font-bold text-green-600">R$ {totals.commissionPaid.toFixed(2)}</p>
                        </div>

                        <div className="bg-white border-t-4 border-orange-500 text-charcoal p-6 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-orange-600" size={24} />
                                <p className="text-sm font-semibold text-gray-600">Pendente</p>
                            </div>
                            <p className="text-4xl font-bold text-orange-600">R$ {totals.commissionPending.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* Relatórios por Funcionário */}
                <div className="space-y-6 max-h-[90vh] overflow-y-auto p-4">
                    {reports.length > 0 ? (
                        reports.map((report, index) => (
                            <div key={report.staff.id} className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gold/20">
                                {/* Header do Funcionário */}
                                <div className="bg-gradient-gold text-white p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl font-bold text-white/50 ">
                                                #{index + 1}
                                            </div>
                                            {report.staff.photo ? (
                                                <img
                                                    src={report.staff.photo}
                                                    alt={report.staff.name}
                                                    className="w-16 h-16 rounded-full object-cover border-4 border-white"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full  bg-gold-dark bg-opacity-20 flex items-center justify-center text-2xl font-bold ">
                                                    {report.staff.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-bold">{report.staff.name}</h3>
                                                <p className="text-white/80">
                                                    Comissão: {report.staff.commissionPercent}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-white/80">Total de Serviços</p>
                                            <p className="text-5xl font-bold">{report.totalServices}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Métricas */}
                                <div className="grid grid-cols-4 divide-x divide-gray-200">
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Faturamento</p>
                                        <p className="text-3xl font-bold text-charcoal">
                                            R$ {report.totalRevenue.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Total Comissão</p>
                                        <p className="text-3xl font-bold text-gold">
                                            R$ {report.totalCommission.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Pago</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            R$ {report.commissionPaid.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Pendente</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            R$ {report.commissionPending.toFixed(2)}
                                        </p>
                                    </div>
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
}