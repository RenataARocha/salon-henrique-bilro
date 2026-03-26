'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Volume2, VolumeX, Trash2 } from 'lucide-react'
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
    const [toast, setToast] = useState<Notification | null>(null)
    const spokenIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)
    const [expandedIds, setExpandedIds] = useState<string[]>([])

    const cleanText = (text: string) => {
        return text
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/✅|⚠️|❌|🔔|🎁|🎂|💅|📅|⏰|👤/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    }

    const speak = (text: string) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return
        window.speechSynthesis.cancel()

        const cleanedText = cleanText(text)
        const utterance = new SpeechSynthesisUtterance(cleanedText)
        utterance.lang = 'pt-BR'
        utterance.rate = 0.9
        utterance.pitch = 1.2
        utterance.volume = 1.0

        const trySpeak = () => {
            const voices = window.speechSynthesis.getVoices()
            const femaleVoice =
                voices.find(v => v.name === 'Microsoft Maria - Portuguese (Brazil)') ||
                voices.find(v => v.name.includes('Maria')) ||
                voices.find(v => v.name.includes('Luciana')) ||
                voices.find(v => v.name.includes('Fernanda')) ||
                voices.find(v => v.lang === 'pt-BR')

            if (femaleVoice) utterance.voice = femaleVoice
            window.speechSynthesis.speak(utterance)
        }

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true })
        } else {
            trySpeak()
        }
    }

    function showToast(notif: Notification) {
        setToast(notif)
        setTimeout(() => setToast(null), 8000)
    }

    async function fetchNotifications() {
        try {
            const response = await fetch('/api/notifications')
            const data = await response.json()

            if (data.success) {
                const newNotifications: Notification[] = data.notifications

                if (isFirstLoad.current) {
                    newNotifications.forEach(n => spokenIds.current.add(n.id))
                    isFirstLoad.current = false
                } else {
                    const newUnread = newNotifications.filter(
                        n => !n.read && !spokenIds.current.has(n.id)
                    )
                    newUnread.forEach(notif => {
                        spokenIds.current.add(notif.id)
                        speak(`${cleanText(notif.title)}. ${cleanText(notif.message)}`)
                        showToast(notif)
                    })
                }

                setNotifications(newNotifications)
                setUnreadCount(newNotifications.filter(n => !n.read).length)
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
            await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function deleteNotification(notificationId: string) {
        try {
            await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            setUnreadCount(prev => {
                const wasUnread = notifications.find(n => n.id === notificationId)?.read === false
                return wasUnread ? Math.max(0, prev - 1) : prev
            })
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function clearReadNotifications() {
        try {
            await fetch('/api/notifications/clear-read', { method: 'DELETE' })
            setNotifications(prev => prev.filter(n => !n.read))
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/notifications/read-all', { method: 'PATCH' })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Erro:', error)
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

    function getToastColor(type: string) {
        switch (type) {
            case 'SUCCESS': return 'bg-green-500'
            case 'WARNING': return 'bg-orange-500'
            case 'ERROR': return 'bg-red-500'
            default: return 'bg-blue-500'
        }
    }

    function toggleExpand(id: string) {
        setExpandedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        )
    }

    const readCount = notifications.filter(n => n.read).length

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] ${getToastColor(toast.type)} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm`}
                    style={{ animation: 'slideInRight 0.3s ease-out' }}>
                    <span className="text-2xl flex-shrink-0">{getIcon(toast.type)}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{toast.title}</p>
                        <p className="text-xs opacity-90 mt-1 line-clamp-2">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 flex-shrink-0 ml-2">
                        <X size={18} />
                    </button>
                    <style>{`
                        @keyframes slideInRight {
                            from { opacity: 0; transform: translateX(100px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                    `}</style>
                </div>
            )}

            <div className="relative">
                {/* Sino */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full bg-gold hover:bg-gold-dark transition"
                >
                    <Bell className="w-6 h-6 text-gray-100" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">

                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg">Notificações</h3>
                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        className={`p-2 rounded-lg transition ${voiceEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                                        title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
                                    >
                                        {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        {unreadCount > 0
                                            ? <span className="text-pink-600 font-semibold">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</span>
                                            : <span className="text-gray-500">Tudo lido ✓</span>
                                        }
                                    </p>
                                    <div className="flex gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Marcar todas
                                            </button>
                                        )}
                                        {readCount > 0 && (
                                            <button
                                                onClick={clearReadNotifications}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                            >
                                                <Trash2 size={12} />
                                                Limpar lidas ({readCount})
                                            </button>
                                        )}
                                    </div>
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
                                            className={`p-4 border-b border-gray-100 transition group ${!notification.read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex gap-3">
                                                <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(notification.type)}</span>
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => {
                                                        toggleExpand(notification.id)
                                                        if (!notification.read) markAsRead(notification.id)
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className={`text-sm text-gray-600 mt-1 ${expandedIds.includes(notification.id) ? '' : 'line-clamp-2'
                                                        }`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition flex-shrink-0 p-1"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                <p className="text-xs">
                                    {voiceEnabled
                                        ? <span className="text-green-600 font-semibold">🎤 Voz ativada — Maria</span>
                                        : <span className="text-gray-500">🔇 Voz desativada</span>
                                    }
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}