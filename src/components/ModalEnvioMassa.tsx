// src/components/ModalEnvioMassa.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Send, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Client {
    id: string
    name: string
    email: string
    phone: string | null
}

interface ModalEnvioMassaProps {
    isOpen: boolean
    onClose: () => void
    tipo: 'cupom' | 'combo'
    itemId: string
    itemName: string
}

export default function ModalEnvioMassa({
    isOpen,
    onClose,
    tipo,
    itemId,
    itemName
}: ModalEnvioMassaProps) {
    const [clientes, setClientes] = useState<Client[]>([])
    const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([])
    const [enviando, setEnviando] = useState(false)
    const [progresso, setProgresso] = useState(0)
    const [sucesso, setSucesso] = useState(0)
    const [erros, setErros] = useState(0)
    const [concluido, setConcluido] = useState(false)

    useEffect(() => {
        if (isOpen) {
            buscarClientes()
        }
    }, [isOpen])

    async function buscarClientes() {
        try {
            const response = await fetch('/api/admin/clients')
            const data = await response.json()

            if (data.success) {
                // Filtrar apenas clientes com telefone
                const clientesComTelefone = (data.data || []).filter((c: Client) => c.phone)
                setClientes(clientesComTelefone)
                setClientesSelecionados(clientesComTelefone.map((c: Client) => c.id))
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error)
        }
    }

    function toggleCliente(clienteId: string) {
        setClientesSelecionados(prev =>
            prev.includes(clienteId)
                ? prev.filter(id => id !== clienteId)
                : [...prev, clienteId]
        )
    }

    function selecionarTodos() {
        setClientesSelecionados(clientes.map(c => c.id))
    }

    function deselecionarTodos() {
        setClientesSelecionados([])
    }

    async function enviarMensagens() {
        if (clientesSelecionados.length === 0) {
            alert('Selecione pelo menos um cliente')
            return
        }

        setEnviando(true)
        setProgresso(0)
        setSucesso(0)
        setErros(0)
        setConcluido(false)

        const total = clientesSelecionados.length

        for (let i = 0; i < clientesSelecionados.length; i++) {
            const clienteId = clientesSelecionados[i]

            try {
                const response = await fetch('/api/notifications/send-mass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo,
                        itemId,
                        clienteId
                    })
                })

                if (response.ok) {
                    setSucesso(prev => prev + 1)
                } else {
                    setErros(prev => prev + 1)
                }
            } catch (error) {
                setErros(prev => prev + 1)
            }

            setProgresso(Math.round(((i + 1) / total) * 100))

            // Delay de 2 segundos entre envios para não ser spam
            if (i < clientesSelecionados.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }

        setEnviando(false)
        setConcluido(true)
    }

    function fechar() {
        if (!enviando) {
            setProgresso(0)
            setSucesso(0)
            setErros(0)
            setConcluido(false)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                {/* Modal */}
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gold to-yellow-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    📢 Envio em Massa
                                </h2>
                                <p className="text-white/90 mt-1">
                                    {tipo === 'cupom' ? '🎁 Cupom' : '✨ Combo'}: {itemName}
                                </p>
                            </div>
                            <button
                                onClick={fechar}
                                disabled={enviando}
                                className="text-white/80 hover:text-white disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Progresso */}
                    {enviando && (
                        <div className="bg-blue-50 border-b border-blue-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <span className="text-sm font-medium text-blue-900">
                                    Enviando mensagens... {progresso}%
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progresso}%` }}
                                />
                            </div>
                            <div className="flex gap-4 mt-3 text-sm">
                                <span className="text-green-600">✓ Sucesso: {sucesso}</span>
                                <span className="text-red-600">✗ Erros: {erros}</span>
                            </div>
                        </div>
                    )}

                    {/* Resultado */}
                    {concluido && (
                        <div className="bg-green-50 border-b border-green-200 p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">
                                        Envio concluído!
                                    </p>
                                    <p className="text-sm text-green-700">
                                        {sucesso} enviadas com sucesso, {erros} erros
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Conteúdo */}
                    <div className="p-6 overflow-y-auto max-h-[500px]">
                        {/* Ações de Seleção */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                <span className="font-medium">
                                    {clientesSelecionados.length} de {clientes.length} selecionados
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={selecionarTodos}
                                    disabled={enviando}
                                    className="text-sm text-gold hover:text-yellow-700 font-medium disabled:opacity-50"
                                >
                                    Selecionar todos
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={deselecionarTodos}
                                    disabled={enviando}
                                    className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
                                >
                                    Limpar seleção
                                </button>
                            </div>
                        </div>

                        {/* Lista de Clientes */}
                        <div className="space-y-2">
                            {clientes.map(cliente => (
                                <label
                                    key={cliente.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${clientesSelecionados.includes(cliente.id)
                                            ? 'border-pink-500 bg-pink-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${enviando ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={clientesSelecionados.includes(cliente.id)}
                                        onChange={() => toggleCliente(cliente.id)}
                                        disabled={enviando}
                                        className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{cliente.name}</p>
                                        <p className="text-sm text-gray-600">{cliente.phone}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {clientes.length === 0 && (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Nenhum cliente com telefone cadastrado</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 border-t flex items-center justify-between">
                        <button
                            onClick={fechar}
                            disabled={enviando}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            {concluido ? 'Fechar' : 'Cancelar'}
                        </button>

                        {!concluido && (
                            <button
                                onClick={enviarMensagens}
                                disabled={enviando || clientesSelecionados.length === 0}
                                className="px-6 py-2 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {enviando ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Enviar para {clientesSelecionados.length} {clientesSelecionados.length === 1 ? 'cliente' : 'clientes'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}