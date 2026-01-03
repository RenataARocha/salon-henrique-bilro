import React, { useState } from 'react';
import { Check, X, Mail, MessageCircle, Download, Trash2, Loader } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onConfirm: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onExport: () => void;
    onSendEmail: () => void;
    onSendWhatsApp: () => void;
    onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onConfirm,
    onCancel,
    onDelete,
    onExport,
    onSendEmail,
    onSendWhatsApp,
    onClearSelection
}) => {
    const [loading, setLoading] = useState(false);

    if (selectedCount === 0) return null;

    const handleAction = async (action: () => void) => {
        setLoading(true);
        try {
            await action();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl z-50 animate-slide-up">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Info */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span className="font-bold text-lg">
                                ☑️ {selectedCount} {selectedCount === 1 ? 'agendamento selecionado' : 'agendamentos selecionados'}
                            </span>
                        </div>

                        <button
                            onClick={onClearSelection}
                            className="text-white/80 hover:text-white underline text-sm"
                        >
                            Limpar seleção
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleAction(onConfirm)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Confirmar selecionados"
                        >
                            <Check size={20} />
                            Confirmar
                        </button>

                        <button
                            onClick={() => handleAction(onCancel)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Cancelar selecionados"
                        >
                            <X size={20} />
                            Cancelar
                        </button>

                        <button
                            onClick={() => handleAction(onSendEmail)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Enviar email"
                        >
                            <Mail size={20} />
                            Email
                        </button>

                        <button
                            onClick={() => handleAction(onSendWhatsApp)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Enviar WhatsApp"
                        >
                            <MessageCircle size={20} />
                            WhatsApp
                        </button>

                        <button
                            onClick={() => handleAction(onExport)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Exportar"
                        >
                            <Download size={20} />
                            Exportar
                        </button>

                        <div className="w-px h-8 bg-white/30"></div>

                        <button
                            onClick={() => {
                                if (confirm(`Tem certeza que deseja deletar ${selectedCount} agendamento(s)?`)) {
                                    handleAction(onDelete);
                                }
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg font-semibold transition disabled:opacity-50"
                            title="Deletar selecionados"
                        >
                            <Trash2 size={20} />
                            Deletar
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <Loader className="animate-spin" size={32} />
                </div>
            )}
        </div>
    );
};

export default BulkActionsBar;