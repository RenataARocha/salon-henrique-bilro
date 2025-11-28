interface SectionTitleProps {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
}

export default function SectionTitle({ title, subtitle, align = 'center' }: SectionTitleProps) {
    return (
        <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                {title}
            </h2>
            {subtitle && (
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                    {subtitle}
                </p>
            )}
        </div>
    )
}