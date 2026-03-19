// src/components/WhatsAppButton.tsx
'use client'

import { Phone } from 'lucide-react'

interface WhatsAppButtonProps {
    phone?: string
    message?: string
    position?: 'bottom-right' | 'bottom-left'
}

export default function WhatsAppButton({
    phone = '5584988814965',
    message = 'Olá! Gostaria de agendar um horário 💅',
    position = 'bottom-right'
}: WhatsAppButtonProps = {}) {

    function handleClick() {
        const encodedMessage = encodeURIComponent(message)
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`
        window.open(whatsappUrl, '_blank')
    }

    const positionClasses = position === 'bottom-right'
        ? 'bottom-6 right-6'
        : 'bottom-6 left-6'

    return (
        <>
            {/* Botão Principal */}
            <button
                onClick={handleClick}
                className={`fixed ${positionClasses} z-40 group`}
                aria-label="Falar no WhatsApp"
            >
                <div className="relative">
                    {/* Círculo pulsante de fundo */}
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />

                    {/* Botão com ícone de telefone */}
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-110">
                        <Phone className="w-4 h-4" />
                    </div>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                    <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                        💬 Fale conosco no WhatsApp
                        <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
                    </div>
                </div>
            </button>

            {/* Injetar CSS de animação */}
            <style jsx>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .animate-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </>
    )
}