// src/components/NotificationBell.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Volume2, VolumeX } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
    id: string
    title: string
    message: string
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
    read: boolean
    createdAt: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [voiceEnabled, setVoiceEnabled] = useState(true)

    // 🎤 FUNÇÃO DE VOZ FEMININA
    const speak = (text: string) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Configurações para VOZ FEMININA
        utterance.lang = 'pt-BR'
        utterance.rate = 0.95 // Velocidade natural
        utterance.pitch = 1.5 // Tom mais agudo = voz feminina
        utterance.volume = 1.0

        // Tentar voz feminina brasileira
        const voices = window.speechSynthesis.getVoices()
        const femaleVoice = voices.find(v =>
            (v.lang.includes('pt-BR') || v.lang.includes('pt-PT')) &&
            (v.name.includes('female') || v.name.includes('Luciana') || v.name.includes('Fernanda'))
        ) || voices.find(v => v.lang.includes('pt-BR'))

        if (femaleVoice) {
            utterance.voice = femaleVoice
        }

        window.speechSynthesis.speak(utterance)
    }

    async function fetchNotifications() {
        try {
            const response = await fetch('/api/notifications')
            const data = await response.json()

            if (data.success) {
                const newNotifications = data.notifications
                const oldIds = notifications.map(n => n.id)

                // Detectar novas não lidas
                const newUnread = newNotifications.filter(
                    (n: Notification) => !n.read && !oldIds.includes(n.id)
                )

                // Falar novas notificações
                newUnread.forEach((notif: Notification) => {
                    speak(`${notif.title}. ${notif.message}`)
                })

                setNotifications(newNotifications)
                setUnreadCount(newNotifications.filter((n: Notification) => !n.read).length)
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function markAsRead(notificationId: string) {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            })

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH'
            })

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error)
        }
    }

    function getIcon(type: string) {
        switch (type) {
            case 'SUCCESS': return '✅'
            case 'WARNING': return '⚠️'
            case 'ERROR': return '❌'
            default: return '🔔'
        }
    }

    return (
        <div className="relative">
            {/* Botão do Sino */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <Bell className="w-6 h-6 text-gray-700" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Notificações</h3>
                                <p className="text-sm text-gray-600">
                                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Botão de Voz */}
                                <button
                                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                                    className={`p-2 rounded-lg transition ${voiceEnabled
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
                                >
                                    {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </button>

                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                                    >
                                        Marcar todas
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''
                                            }`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-2xl">{getIcon(notification.type)}</span>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                        {notification.title}
                                                    </h4>

                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1" />
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                            <p className="text-xs text-gray-600">
                                {voiceEnabled ? (
                                    <span className="text-green-600 font-semibold">
                                        🎤 Voz ativada
                                    </span>
                                ) : (
                                    <span className="text-gray-500">
                                        🔇 Voz desativada
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}