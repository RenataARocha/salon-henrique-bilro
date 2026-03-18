// app/(dashboard)/admin/servicos/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Power,
    DollarSign,
    Clock,
    X,
    Image as ImageIcon,
    Star,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastContainer";
import AdminHeader from "@/components/admin/AdminHeader";
import Image from "next/image";
import { motion } from 'framer-motion'

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    featured?: boolean;
    images?: string[];
}

export default function AdminServicosPage() {
    const { showToast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration: "",
        images: [] as string[],
        newImageUrl: "",
    });
    const [uploadLoading, setUploadLoading] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/services");
            const data = await res.json();
            if (data.success) {
                setServices(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            showToast("Erro ao carregar serviços", "error");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description,
                price: service.price.toString(),
                duration: service.duration.toString(),
                images: service.images || [],
                newImageUrl: "",
            });
        } else {
            setEditingService(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                duration: "",
                images: [],
                newImageUrl: "",
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingService(null);
        setFormData({
            name: "",
            description: "",
            price: "",
            duration: "",
            images: [],
            newImageUrl: "",
        });
    };

    const handleAddImage = () => {
        if (!formData.newImageUrl.trim()) {
            showToast("Digite uma URL válida", "error");
            return;
        }

        if (!formData.newImageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
            showToast("URL deve ser uma imagem (.jpg, .png, .gif, .webp)", "error");
            return;
        }

        if (formData.images.length >= 5) {
            showToast("Você pode adicionar no máximo 5 imagens", "error");
            return;
        }

        setFormData({
            ...formData,
            images: [...formData.images, formData.newImageUrl],
            newImageUrl: "",
        });
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, index) => index !== indexToRemove),
        });
        showToast("Imagem removida", "info");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (formData.images.length + files.length > 5) {
            showToast("Você pode adicionar no máximo 5 imagens", "error");
            return;
        }

        const formDataUpload = new FormData();
        Array.from(files).forEach((file) => {
            formDataUpload.append("files", file);
        });

        try {
            setUploadLoading(true);
            showToast(
                `Fazendo upload de ${files.length} ${files.length === 1 ? "imagem" : "imagens"}...`,
                "info"
            );

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formDataUpload,
            });

            const data = await res.json();

            if (data.success) {
                setFormData({
                    ...formData,
                    images: [...formData.images, ...data.urls],
                });
                showToast(
                    `✅ ${data.urls.length} ${data.urls.length === 1 ? "imagem adicionada" : "imagens adicionadas"}!`,
                    "success"
                );
            } else {
                showToast(data.error || "Erro ao fazer upload", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao fazer upload das imagens", "error");
        } finally {
            setUploadLoading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.duration) {
            showToast("Preencha todos os campos obrigatórios", "error");
            return;
        }

        try {
            const url = editingService
                ? `/api/admin/services?id=${editingService.id}`
                : "/api/admin/services";

            const method = editingService ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    duration: parseInt(formData.duration),
                    images: formData.images,
                }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(
                    editingService ? "Serviço atualizado!" : "Serviço criado!",
                    "success"
                );
                fetchServices();
                closeModal();
            } else {
                showToast(data.error || "Erro ao salvar serviço", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao salvar serviço", "error");
        }
    };

    const handleToggleActive = async (service: Service) => {
        try {
            const res = await fetch(`/api/admin/services?id=${service.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !service.active }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(
                    service.active ? "Serviço desativado" : "Serviço ativado",
                    "success"
                );
                fetchServices();
            } else {
                showToast(data.error || "Erro ao atualizar serviço", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao atualizar serviço", "error");
        }
    };

    const handleToggleFeatured = async (service: Service) => {
        try {
            const res = await fetch(`/api/admin/services?id=${service.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featured: !service.featured }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(
                    service.featured
                        ? "Serviço removido da home"
                        : "Serviço destacado na home!",
                    "success"
                );
                fetchServices();
            } else {
                showToast(data.error || "Erro ao atualizar serviço", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao atualizar serviço", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

        try {
            const res = await fetch(`/api/admin/services?id=${id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (data.success) {
                showToast("Serviço excluído com sucesso!", "success");
                fetchServices();
            } else {
                showToast(data.error || "Erro ao excluir serviço", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao excluir serviço", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-beige py-6 sm:py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-16 sm:py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600 text-sm sm:text-base">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige py-6 sm:py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <div className="animate-fade-in">
                    <AdminHeader
                        title="Serviços"
                        description="Gerencie os serviços oferecidos pelo salão"
                    />
                </div>

                <motion.div
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-center gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Button
                        variant="primary"
                        onClick={() => openModal()}
                        className="w-full sm:w-auto px-4 py-2 text-sm flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Novo Serviço
                    </Button>
                </motion.div>

                {services.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[90vh] overflow-y-auto p-3 sm:p-4">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all transform hover:scale-105 animate-slide-up ${!service.active ? "opacity-60" : ""
                                    } ${service.featured ? "ring-2 ring-yellow-400" : ""}`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {service.featured && (
                                    <div className="mb-2 sm:mb-3 flex items-center gap-2 text-yellow-600 text-xs sm:text-sm font-bold animate-fade-in">
                                        <Star size={14} className="fill-yellow-400 animate-pulse" />
                                        <span>Destaque na Home</span>
                                    </div>
                                )}

                                {service.images && service.images.length > 0 && (
                                    <div className="mb-3 sm:mb-4 h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100 animate-scale-in">
                                        <img
                                            src={service.images[0]}
                                            alt={service.name}
                                            className="w-full h-full object-cover transition-transform hover:scale-110"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
                                    <h3 className="text-lg sm:text-xl font-bold text-charcoal">
                                        {service.name}
                                    </h3>
                                    <span
                                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all w-fit ${service.active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {service.active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                    {service.description}
                                </p>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Preço</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gold flex items-center gap-1 break-words">
                                            <DollarSign size={18} />
                                            {service.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Duração</p>
                                        <p className="text-base sm:text-lg font-bold text-charcoal flex items-center gap-1">
                                            <Clock size={16} />
                                            {service.duration} min
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                    <button
                                        onClick={() => openModal(service)}
                                        className="w-full sm:flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-1 transform hover:scale-105 text-xs sm:text-sm"
                                    >
                                        <Edit size={14} />
                                        Editar
                                    </button>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleToggleActive(service)}
                                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 transform hover:scale-105 text-xs sm:text-sm ${service.active
                                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                : "bg-green-100 text-green-700 hover:bg-green-200"
                                                }`}
                                        >
                                            <Power size={14} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-1 transform hover:scale-105 text-xs sm:text-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleFeatured(service)}
                                    className={`w-full py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 transform hover:scale-105 text-xs sm:text-sm ${service.featured
                                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <Star size={14} className={service.featured ? "fill-yellow-400" : ""} />
                                    {service.featured ? "Remover da Home" : "Destacar na Home"}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 lg:p-12 text-center animate-fade-in">
                        <p className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">💇‍♀️</p>

                        <h3 className="text-xl sm:text-2xl font-bold text-charcoal mb-2">
                            Nenhum serviço cadastrado
                        </h3>

                        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 px-2 sm:px-0">
                            Adicione serviços para começar a receber agendamentos
                        </p>

                        <Button
                            variant="primary"
                            onClick={() => openModal()}
                            className="w-full sm:w-auto justify-center text-sm sm:text-base"
                        >
                            + Adicionar Primeiro Serviço
                        </Button>
                    </div>
                )}

                {/* MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-3xl font-bold text-charcoal">
                                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 text-2xl transition-colors hover:rotate-90 transform"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    id="name"
                                    type="text"
                                    label="Nome do Serviço"
                                    placeholder="Ex: Corte Feminino"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />

                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none resize-none transition-all"
                                        rows={3}
                                        placeholder="Descreva o serviço..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        id="price"
                                        type="number"
                                        label="Preço (R$)"
                                        placeholder="0.00"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: e.target.value })
                                        }
                                        icon={<DollarSign size={20} />}
                                    />

                                    <Input
                                        id="duration"
                                        type="number"
                                        label="Duração (minutos)"
                                        placeholder="60"
                                        required
                                        min="15"
                                        step="15"
                                        value={formData.duration}
                                        onChange={(e) =>
                                            setFormData({ ...formData, duration: e.target.value })
                                        }
                                        icon={<Clock size={20} />}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        <ImageIcon size={16} className="inline mr-1" />
                                        Imagens do Serviço
                                    </label>

                                    {formData.images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                                            {formData.images.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 animate-scale-in group"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Imagem ${index + 1}`}
                                                        className="w-full h-full object-contain p-1 sm:p-2 transition-transform group-hover:scale-110"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all transform hover:scale-110"
                                                    >
                                                        <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="block w-full cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gold transition-all hover:bg-gray-50">
                                                <ImageIcon size={28} className="sm:w-[32px] sm:h-[32px] mx-auto mb-2 text-gray-400" />
                                                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                                                    {uploadLoading ? 'Fazendo upload...' : 'Clique para fazer upload'}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500">
                                                    JPG, PNG, GIF ou WebP • Máx 5MB
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploadLoading || formData.images.length >= 5}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <p className="text-[10px] sm:text-xs text-gray-500 text-center mb-2">
                                            ou cole uma URL
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="url"
                                                value={formData.newImageUrl}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        newImageUrl: e.target.value,
                                                    })
                                                }
                                                placeholder="https://exemplo.com/imagem.jpg"
                                                className="w-full sm:flex-1 px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none text-xs sm:text-sm transition-all"
                                            />

                                            <button
                                                type="button"
                                                onClick={handleAddImage}
                                                className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 flex items-center justify-center"
                                            >
                                                <Plus size={14} className="sm:w-[16px] sm:h-[16px]" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center sm:text-left">
                                        {formData.images.length}/5 imagens • Você pode adicionar até 5 imagens
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeModal}
                                        className="w-full sm:flex-1 text-sm sm:text-base justify-center"
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full sm:flex-1 text-sm sm:text-base justify-center"
                                    >
                                        {editingService ? "Salvar Alterações" : "Criar Serviço"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .text-gold { color: #D4AF37; }
                .bg-gold { background-color: #D4AF37; }
                .border-gold { border-color: #D4AF37; }
                .ring-gold { --tw-ring-color: #D4AF37; }
                .hover\\:text-gold:hover { color: #D4AF37; }
                .hover\\:bg-gold:hover { background-color: #D4AF37; }
                .focus\\:ring-gold:focus { --tw-ring-color: #D4AF37; }
                .text-charcoal { color: #2C2C2C; }
                .bg-charcoal { background-color: #2C2C2C; }
                .bg-beige { background-color: #F5F5DC; }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                
                .animate-slide-up {
                    animation: slideUp 0.5s ease-out forwards;
                }
                
                .animate-scale-in {
                    animation: scaleIn 0.4s ease-out forwards;
                }
            `}</style>
        </div >
    );
}