// app/(dashboard)/admin/configuracoes/page.tsx

'use client'

import { useState } from 'react'
import { Settings, Save, Clock, Calendar, Mail, MapPin, Phone, Shield, Lock, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/ToastContainer'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SalonConfig {
    name: string
    phone: string
    email: string
    address: string
    openTime: string
    closeTime: string
    slotDuration: number
    minAdvanceBooking: number
    maxAdvanceBooking: number
    cancellationDeadline: number
}

export default function ConfiguracoesPage() {
    const { showToast } = useToast()
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loadingCredentials, setLoadingCredentials] = useState(false)

    const [config, setConfig] = useState<SalonConfig>({
        name: 'Henrique Bilro Cabeleireiros',
        phone: '(84) 99999-9999',
        email: 'contato@henriquebilro.com',
        address: 'Rua Principal, 123 - Centro',
        openTime: '09:00',
        closeTime: '18:00',
        slotDuration: 30,
        minAdvanceBooking: 2,
        maxAdvanceBooking: 30,
        cancellationDeadline: 24
    })

    const [credentials, setCredentials] = useState({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handleSaveConfig = async () => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            showToast('Configurações salvas com sucesso!', 'success')
        } catch (error) {
            showToast('Erro ao salvar configurações', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault()

        if (credentials.newPassword !== credentials.confirmPassword) {
            showToast('As senhas não coincidem', 'error')
            return
        }

        if (credentials.newPassword && credentials.newPassword.length < 8) {
            showToast('A senha deve ter no mínimo 8 caracteres', 'error')
            return
        }

        if (!credentials.newEmail && !credentials.newPassword) {
            showToast('Preencha pelo menos um campo (email ou senha)', 'error')
            return
        }

        setLoadingCredentials(true)

        try {
            const res = await fetch('/api/admin/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: credentials.currentPassword,
                    newEmail: credentials.newEmail,
                    newPassword: credentials.newPassword
                })
            })

            const data = await res.json()

            if (data.success) {
                showToast('Credenciais atualizadas! Faça login novamente.', 'success')
                setTimeout(() => {
                    router.push('/api/auth/signout')
                }, 2000)
            } else {
                showToast(data.error || 'Erro ao atualizar credenciais', 'error')
            }
        } catch (error) {
            console.error('Erro:', error)
            showToast('Erro ao atualizar credenciais', 'error')
        } finally {
            setLoadingCredentials(false)
        }
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-gold text-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings size={40} />
                        <h1 className="text-4xl font-bold">Configurações</h1>
                    </div>
                    <p className="text-white/90">Configure as preferências do salão</p>
                </div>

                {/* 🔐 CREDENCIAIS DE ADMINISTRADOR */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="text-red-600" size={24} />
                        <h2 className="text-2xl font-bold text-charcoal">Credenciais de Administrador</h2>
                    </div>

                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6 flex items-start gap-3">
                        <AlertTriangle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-sm text-orange-900 font-semibold mb-2">
                                ⚠️ Importante - Leia com atenção!
                            </p>
                            <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                                <li>Estas são suas credenciais <strong>ÚNICAS</strong> de administrador</li>
                                <li>Não há recuperação de senha por email</li>
                                <li>Guarde essas informações em local seguro</li>
                                <li>Se perder o acesso, será necessário suporte técnico</li>
                            </ul>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateCredentials} className="space-y-6">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>Email atual:</strong> {session?.user?.email}
                            </p>
                        </div>

                        <Input
                            id="currentPassword"
                            type="password"
                            label="Senha Atual"
                            placeholder="Digite sua senha atual"
                            required
                            value={credentials.currentPassword}
                            onChange={(e) => setCredentials({ ...credentials, currentPassword: e.target.value })}
                            icon={<Lock size={20} />}
                        />

                        <div className="border-t-2 border-gray-200 pt-6">
                            <h3 className="text-lg font-bold text-charcoal mb-4">Novas Credenciais</h3>

                            <div className="space-y-4">
                                <Input
                                    id="newEmail"
                                    type="email"
                                    label="Novo Email (opcional)"
                                    placeholder="novo@email.com"
                                    value={credentials.newEmail}
                                    onChange={(e) => setCredentials({ ...credentials, newEmail: e.target.value })}
                                    icon={<Mail size={20} />}
                                />

                                <Input
                                    id="newPassword"
                                    type="password"
                                    label="Nova Senha (opcional)"
                                    placeholder="Mínimo 8 caracteres"
                                    value={credentials.newPassword}
                                    onChange={(e) => setCredentials({ ...credentials, newPassword: e.target.value })}
                                    icon={<Lock size={20} />}
                                />

                                {credentials.newPassword && (
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        label="Confirmar Nova Senha"
                                        placeholder="Digite novamente"
                                        required
                                        value={credentials.confirmPassword}
                                        onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                                        icon={<Lock size={20} />}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                            <p className="text-sm text-yellow-900">
                                💡 <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos. Anote em local seguro!
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="danger"
                            loading={loadingCredentials}
                            className="w-full"
                            disabled={!credentials.currentPassword || (!credentials.newEmail && !credentials.newPassword)}
                        >
                            <Shield size={20} />
                            Atualizar Credenciais de Admin
                        </Button>
                    </form>
                </div>

                {/* Informações do Salão */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="text-gold" size={24} />
                        <h2 className="text-2xl font-bold text-charcoal">Informações do Salão</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Nome do Salão
                            </label>
                            <input
                                type="text"
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-2">
                                    <Phone size={16} className="inline mr-1" />
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={config.phone}
                                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-2">
                                    <Mail size={16} className="inline mr-1" />
                                    Email de Contato
                                </label>
                                <input
                                    type="email"
                                    value={config.email}
                                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Endereço
                            </label>
                            <input
                                type="text"
                                value={config.address}
                                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Horário de Funcionamento */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="text-gold" size={24} />
                        <h2 className="text-2xl font-bold text-charcoal">Horário de Funcionamento</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Abertura
                            </label>
                            <input
                                type="time"
                                value={config.openTime}
                                onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Fechamento
                            </label>
                            <input
                                type="time"
                                value={config.closeTime}
                                onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Configurações de Agendamento */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="text-gold" size={24} />
                        <h2 className="text-2xl font-bold text-charcoal">Regras de Agendamento</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Duração padrão dos slots (minutos)
                            </label>
                            <input
                                type="number"
                                value={config.slotDuration}
                                onChange={(e) => setConfig({ ...config, slotDuration: Number(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                min="15"
                                step="15"
                            />
                            <p className="text-xs text-gray-500 mt-1">Intervalo entre horários disponíveis</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Antecedência mínima para agendar (horas)
                            </label>
                            <input
                                type="number"
                                value={config.minAdvanceBooking}
                                onChange={(e) => setConfig({ ...config, minAdvanceBooking: Number(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tempo mínimo antes do horário desejado</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Antecedência máxima para agendar (dias)
                            </label>
                            <input
                                type="number"
                                value={config.maxAdvanceBooking}
                                onChange={(e) => setConfig({ ...config, maxAdvanceBooking: Number(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Quantos dias no futuro é possível agendar</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-2">
                                Prazo para cancelamento (horas)
                            </label>
                            <input
                                type="number"
                                value={config.cancellationDeadline}
                                onChange={(e) => setConfig({ ...config, cancellationDeadline: Number(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none"
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tempo mínimo antes do agendamento para cancelar</p>
                        </div>
                    </div>
                </div>

                {/* Resumo */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                    <h3 className="font-bold text-charcoal mb-4">📋 Resumo</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>• Funcionamento: <strong>{config.openTime}</strong> às <strong>{config.closeTime}</strong></p>
                        <p>• Horários a cada <strong>{config.slotDuration} minutos</strong></p>
                        <p>• Agendar com no mínimo <strong>{config.minAdvanceBooking}h de antecedência</strong></p>
                        <p>• Agendar até <strong>{config.maxAdvanceBooking} dias</strong> no futuro</p>
                        <p>• Cancelar até <strong>{config.cancellationDeadline}h antes</strong></p>
                    </div>
                </div>

                {/* Botão Salvar Config Salão */}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        onClick={handleSaveConfig}
                        loading={loading}
                        className="px-8"
                    >
                        <Save size={20} />
                        Salvar Configurações do Salão
                    </Button>
                </div>
            </div>
        </div>
    )
}