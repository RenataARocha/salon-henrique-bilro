import Link from 'next/link'

interface LogoProps {
    variant?: 'header' | 'footer'
}

export default function Logo({ variant = 'header' }: LogoProps) {
    const size = variant === 'header' ? 'md' : 'sm'

    return (
        <Link href="/" className="flex items-center gap-3 group">
            {/* Iniciais HB */}
            <div className={`
        ${size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}
        bg-gradient-to-br from-[#C9A65C] to-[#A68B4E]
        rounded-sm
        flex items-center justify-center
        transform transition-transform duration-300
        group-hover:scale-105
        shadow-lg
      `}>
                <span className={`
          ${size === 'md' ? 'text-xl' : 'text-lg'}
          font-bold text-white tracking-tight
        `}>
                    HB
                </span>
            </div>

            {/* Nome completo */}
            <div className="flex flex-col">
                <span className={`
          ${size === 'md' ? 'text-lg md:text-xl' : 'text-base'}
          font-bold tracking-wide text-[#2C2C2C]
          transition-colors duration-300
          group-hover:text-[#C9A65C]
        `}>
                    HENRIQUE BILRO
                </span>
                <span className={`
          ${size === 'md' ? 'text-[10px] md:text-xs' : 'text-[9px]'}
          tracking-[0.2em] text-gray-500 font-light
        `}>
                    CABELEIREIROS
                </span>
            </div>
        </Link>
    )
}