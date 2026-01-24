import React, { useState, useEffect } from 'react'
import { Bell, X, Volume2, VolumeX } from 'lucide-react'

interface Notification {
    id: string
    title: string
    message: string
    type: 'INFO' | 'SUCCESS' | 'WARNING'
    read: boolean
    createdAt: string
}

export default function NotificationBellWithVoice() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [voiceEnabled, setVoiceEnabled] = useState(true)

    // 🎤 FUNÇÃO DE VOZ IA
    const speak = (text: string) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return

        // Cancela qualquer fala anterior
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Configurações da voz
        utterance.lang = 'pt-BR'
        utterance.rate = 1.1 // Velocidade (1.0 é normal, 1.1 um pouco mais rápido)
        utterance.pitch = 1.2 // Tom (1.0 é normal, 1.2 mais agudo/feminino)
        utterance.volume = 1.0 // Volume (0.0 a 1.0)

        // Tentar usar voz feminina brasileira
        const voices = window.speechSynthesis.getVoices()
        const brazilianVoice = voices.find(v =>
            v.lang.includes('pt-BR') || v.lang.includes('pt-PT')
        )
        if (brazilianVoice) {
            utterance.voice = brazilianVoice
        }

        window.speechSynthesis.speak(utterance)
    }

    // Buscar notificações do backend
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            const data = await res.json()

            if (data.success) {
                const newNotifications = data.data
                const oldIds = notifications.map(n => n.id)

                // Detectar novas notificações não lidas
                const newUnread = newNotifications.filter(
                    (n: Notification) => !n.read && !oldIds.includes(n.id)
                )

                // 🎤 FALAR CADA NOVA NOTIFICAÇÃO
                newUnread.forEach((notif: Notification) => {
                    const voiceText = `${notif.title}. ${notif.message}`
                    speak(voiceText)
                })

                setNotifications(newNotifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error)
        }
    }

    // Buscar a cada 10 segundos
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 10000)
        return () => clearInterval(interval)
    }, [notifications])

    // Marcar como lida
    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
            fetchNotifications()
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    // Marcar todas como lidas
    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' })
            fetchNotifications()
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    // Testar voz
    const testVoice = () => {
        speak('Confirmação de agendamento. Cliente Renata Rocha')
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return '✅'
            case 'WARNING': return '⚠️'
            default: return '🔔'
        }
    }

    return (
        <div className="relative">
            {/* Botão do Sino */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Bell size={24} className="text-gray-700" />

                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Bell size={20} />
                            Notificações
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* Botão de Voz */}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className={`p-2 rounded-lg transition-colors ${voiceEnabled
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
                            >
                                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>

                            {/* Testar Voz */}
                            <button
                                onClick={testVoice}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                                title="Testar voz"
                            >
                                🎤 Testar
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Marcar todas
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-semibold">Nenhuma notificação</p>
                                <p className="text-sm">Você está em dia! 🎉</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getTypeIcon(notif.type)}</span>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <h4 className={`font-semibold text-sm ${!notif.read ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer com status da voz */}
                    <div className="p-3 border-t bg-gray-50 text-center">
                        <p className="text-xs text-gray-600">
                            {voiceEnabled ? (
                                <span className="text-green-600 font-semibold">
                                    🎤 Voz ativada - Você ouvirá as notificações
                                </span>
                            ) : (
                                <span className="text-gray-500">
                                    🔇 Voz desativada
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}