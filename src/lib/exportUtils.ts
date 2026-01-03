// lib/exportUtils.ts

// Exportar para CSV
export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

    // Pegar as chaves do primeiro objeto
    const headers = Object.keys(data[0])

    // Criar CSV
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Escapar vírgulas e aspas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`
                }
                return value
            }).join(',')
        )
    ].join('\n')

    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
}

// Exportar Relatório Completo para CSV
export function exportReportToCSV(data: any) {
    const reportData = [
        { secao: '=== RESUMO ===' },
        { secao: 'Receita Total', valor: `R$ ${data.summary.totalRevenue.toFixed(2)}` },
        { secao: 'Total de Agendamentos', valor: data.summary.totalAppointments },
        { secao: 'Ticket Médio', valor: `R$ ${data.summary.avgTicket.toFixed(2)}` },
        { secao: 'Taxa de Conclusão', valor: `${data.summary.completionRate.toFixed(1)}%` },
        { secao: 'Novos Clientes', valor: data.summary.newClients },
        { secao: '' },
        { secao: '=== TOP SERVIÇOS ===' },
        ...data.services.slice(0, 10).map((s: any, i: number) => ({
            posicao: i + 1,
            servico: s.name,
            quantidade: s.count,
            receita: `R$ ${s.revenue.toFixed(2)}`,
            percentual: `${s.percentage.toFixed(1)}%`
        })),
        { secao: '' },
        { secao: '=== TOP CLIENTES ===' },
        ...data.topClients.map((c: any, i: number) => ({
            posicao: i + 1,
            cliente: c.name,
            visitas: c.visits,
            total_gasto: `R$ ${c.totalSpent.toFixed(2)}`
        })),
        { secao: '' },
        { secao: '=== CANCELAMENTOS ===' },
        { secao: 'Taxa de Cancelamento', valor: `${data.cancellations.rate.toFixed(1)}%` },
        { secao: 'Total Cancelado', valor: data.cancellations.total },
        ...data.cancellations.byReason.map((r: any) => ({
            motivo: r.reason,
            quantidade: r.count
        }))
    ]

    exportToCSV(reportData, 'relatorio_completo')
}

// Exportar para "PDF" (na verdade vai gerar um HTML imprimível)
export function exportToPDF(data: any) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        alert('Por favor, permita pop-ups para exportar PDF')
        return
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório - Salão</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px;
                    color: #2C2C2C;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #D4AF37;
                }
                h1 { color: #D4AF37; font-size: 32px; margin-bottom: 10px; }
                .date { color: #666; font-size: 14px; }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .card {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #D4AF37;
                }
                .card-title { color: #666; font-size: 12px; margin-bottom: 5px; }
                .card-value { font-size: 24px; font-weight: bold; color: #2C2C2C; }
                .section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                h2 {
                    color: #D4AF37;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #D4AF37;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #D4AF37;
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer {
                    margin-top: 60px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Relatório de Desempenho</h1>
                <p class="date">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div class="summary">
                <div class="card">
                    <div class="card-title">Receita Total</div>
                    <div class="card-value">R$ ${data.summary.totalRevenue.toFixed(2)}</div>
                </div>
                <div class="card">
                    <div class="card-title">Agendamentos</div>
                    <div class="card-value">${data.summary.totalAppointments}</div>
                </div>
                <div class="card">
                    <div class="card-title">Ticket Médio</div>
                    <div class="card-value">R$ ${data.summary.avgTicket.toFixed(2)}</div>
                </div>
                <div class="card">
                    <div class="card-title">Taxa de Conclusão</div>
                    <div class="card-value">${data.summary.completionRate.toFixed(1)}%</div>
                </div>
                <div class="card">
                    <div class="card-title">Novos Clientes</div>
                    <div class="card-value">${data.summary.newClients}</div>
                </div>
            </div>

            <div class="section">
                <h2>🏆 Top 10 Serviços Mais Vendidos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Serviço</th>
                            <th>Quantidade</th>
                            <th>Receita</th>
                            <th>% do Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.services.slice(0, 10).map((s: any, i: number) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.name}</td>
                                <td>${s.count}</td>
                                <td>R$ ${s.revenue.toFixed(2)}</td>
                                <td>${s.percentage.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>👑 Top 10 Melhores Clientes</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Visitas</th>
                            <th>Total Gasto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.topClients.map((c: any, i: number) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${c.name}</td>
                                <td>${c.visits}</td>
                                <td>R$ ${c.totalSpent.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>📊 Análise de Cancelamentos</h2>
                <p style="margin-bottom: 20px;">
                    <strong>Taxa de Cancelamento:</strong> ${data.cancellations.rate.toFixed(1)}% 
                    (${data.cancellations.total} agendamentos)
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Motivo</th>
                            <th>Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.cancellations.byReason.map((r: any) => `
                            <tr>
                                <td>${r.reason}</td>
                                <td>${r.count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>Relatório gerado automaticamente pelo Sistema de Gestão</p>
            </div>

            <script>
                // Auto-print ao carregar
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
}