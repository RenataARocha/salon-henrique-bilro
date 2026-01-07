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
    Star, // ← ADICIONADO
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastContainer";
import AdminHeader from "@/components/admin/AdminHeader";

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    featured?: boolean; // ← ADICIONADO
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

    // ← NOVA FUNÇÃO: Toggle Featured
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
            <div className="min-h-screen bg-beige py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Serviços"
                    description="Gerencie os serviços oferecidos pelo salão"
                    showBackButton={true}
                />
                <div className="flex justify-between items-center">
                    <Button variant="primary" onClick={() => openModal()}>
                        <Plus size={20} />
                        Novo Serviço
                    </Button>
                </div>

                {services.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${!service.active ? "opacity-60" : ""
                                    } ${service.featured ? "ring-2 ring-yellow-400" : ""
                                    }`}
                            >
                                {/* ← Badge de Featured */}
                                {service.featured && (
                                    <div className="mb-3 flex items-center gap-2 text-yellow-600 text-sm font-bold">
                                        <Star size={16} className="fill-yellow-400" />
                                        <span>Destaque na Home</span>
                                    </div>
                                )}

                                {service.images && service.images.length > 0 && (
                                    <div className="mb-4 h-48 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={service.images[0]}
                                            alt={service.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-charcoal">
                                        {service.name}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${service.active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {service.active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {service.description}
                                </p>

                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Preço</p>
                                        <p className="text-2xl font-bold text-gold flex items-center gap-1">
                                            <DollarSign size={20} />
                                            {service.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Duração</p>
                                        <p className="text-lg font-bold text-charcoal flex items-center gap-1">
                                            <Clock size={18} />
                                            {service.duration} min
                                        </p>
                                    </div>
                                </div>

                                {/* ← BOTÕES ATUALIZADOS */}
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => openModal(service)}
                                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(service)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 ${service.active
                                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                    >
                                        <Power size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* ← NOVO BOTÃO: Toggle Featured */}
                                <button
                                    onClick={() => handleToggleFeatured(service)}
                                    className={`w-full py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${service.featured
                                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <Star size={16} className={service.featured ? "fill-yellow-400" : ""} />
                                    {service.featured ? "Remover da Home" : "Destacar na Home"}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-6xl mb-4">💇‍♀️</p>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">
                            Nenhum serviço cadastrado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Adicione serviços para começar a receber agendamentos
                        </p>
                        <Button variant="primary" onClick={() => openModal()}>
                            + Adicionar Primeiro Serviço
                        </Button>
                    </div>
                )}

                {/* MODAL - Mantém igual, já está correto */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-3xl font-bold text-charcoal">
                                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
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
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none resize-none"
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
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            {formData.images.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Imagem ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label
                                            className={`w-full px-4 py-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 font-semibold ${uploadLoading
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-gold text-white hover:bg-gold-dark"
                                                }`}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                disabled={uploadLoading}
                                            />
                                            {uploadLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Fazendo upload...
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={20} />
                                                    Escolher Imagens do Computador
                                                </>
                                            )}
                                        </label>

                                        <div>
                                            <p className="text-xs text-gray-500 text-center mb-2">
                                                ou cole uma URL
                                            </p>
                                            <div className="flex gap-2">
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
                                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold focus:outline-none text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddImage}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2">
                                        {formData.images.length}/5 imagens • Você pode adicionar até 5 imagens
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeModal}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1">
                                        {editingService ? "Salvar Alterações" : "Criar Serviço"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}