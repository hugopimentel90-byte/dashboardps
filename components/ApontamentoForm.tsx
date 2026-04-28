import React, { useState, useEffect } from 'react';
import { Clock, HardHat, Calendar, FileText, Ship, Send, Loader2, X, Check, HelpCircle, Plus, Minus, Tag } from 'lucide-react';
import { ApontamentoHH } from '../types';
import { loadServicosOficina } from '../services/servicosStorage';

interface ApontamentoFormProps {
    oficinas: string[];
    onSave: (data: ApontamentoHH) => Promise<void>;
    onCancel: () => void;
}

const ApontamentoForm: React.FC<ApontamentoFormProps> = ({ oficinas, onSave, onCancel }) => {
    const [formData, setFormData] = useState<ApontamentoHH>({
        servico: '',
        tipo_servico: '',
        oficina: '',
        data: new Date().toISOString().split('T')[0],
        inicio: '',
        fim: '',
        qtd_militares: 1
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Estado para tipos de serviço configurados
    const [availableServicos, setAvailableServicos] = useState<string[]>([]);
    const [loadingServicos, setLoadingServicos] = useState(false);

    useEffect(() => {
        if (formData.oficina) {
            loadServicos(formData.oficina);
        } else {
            setAvailableServicos([]);
            setFormData(prev => ({ ...prev, tipo_servico: '' }));
        }
    }, [formData.oficina]);

    const loadServicos = async (oficinaName: string) => {
        setLoadingServicos(true);
        try {
            const servicos = await loadServicosOficina(oficinaName);
            setAvailableServicos(servicos);
        } catch (err) {
            setAvailableServicos([]);
        } finally {
            setLoadingServicos(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        setIsSubmitting(true);
        setShowConfirm(false);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Erro no formulário:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {/* Modal de Confirmação */}
            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowConfirm(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 md:p-8">
                            <div className="bg-indigo-100 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 md:mb-6">
                                <HelpCircle size={28} md:size={32} className="text-indigo-600" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Confirmar Apontamento?</h3>
                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed mb-6 md:mb-8">
                                Deseja salvar este registro de atividade para a oficina <strong>{formData.oficina}</strong>?
                            </p>

                            <div className="bg-slate-50 rounded-2xl p-4 md:p-5 border border-slate-100 mb-6 md:mb-8 space-y-3 md:space-y-4">
                                <div>
                                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serviço</span>
                                    <span className="text-xs font-bold text-slate-700 line-clamp-2">{formData.servico}</span>
                                    {formData.tipo_servico && (
                                        <span className="inline-block mt-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                            {formData.tipo_servico}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-slate-100">
                                    <div>
                                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data</span>
                                        <span className="text-xs font-bold text-slate-600">{formData.data.split('-').reverse().join('/')}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Horário</span>
                                        <span className="text-xs font-bold text-slate-600">{formData.inicio} - {formData.fim}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmSave}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center space-x-2"
                                >
                                    <Check size={18} />
                                    <span>Confirmar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in max-w-2xl mx-auto">
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Clock size={24} />
                        <h2 className="text-xl font-bold">Novo Apontamento HH</h2>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Ship size={14} className="mr-2" /> Oficina
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                value={formData.oficina}
                                onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
                            >
                                <option value="">Selecione a Oficina</option>
                                {oficinas.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Calendar size={14} className="mr-2" /> Data
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <FileText size={14} className="mr-2" /> Serviço Realizado (Descrição)
                        </label>
                        <textarea
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                            placeholder="Descreva detalhadamente o serviço..."
                            value={formData.servico}
                            onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <Tag size={14} className="mr-2" /> Tipo de Serviço
                        </label>
                        <div className="relative">
                            <select
                                required
                                disabled={!formData.oficina || availableServicos.length === 0}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
                                value={formData.tipo_servico || ''}
                                onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
                            >
                                <option value="">
                                    {!formData.oficina 
                                        ? "Selecione uma oficina primeiro..." 
                                        : availableServicos.length === 0 
                                            ? "Nenhum tipo cadastrado para esta oficina" 
                                            : "Selecione o tipo de serviço"}
                                </option>
                                {availableServicos.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {loadingServicos && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Clock size={14} className="mr-2" /> Início
                            </label>
                            <input
                                type="time"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.inicio}
                                onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Clock size={14} className="mr-2" /> Fim
                            </label>
                            <input
                                type="time"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.fim}
                                onChange={(e) => setFormData({ ...formData, fim: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <HardHat size={14} className="mr-2" /> Militares
                            </label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-[46px]">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, qtd_militares: Math.max(1, formData.qtd_militares - 1) })}
                                    className="px-4 h-full hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200 flex items-center justify-center active:bg-slate-200"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    required
                                    className="flex-1 bg-transparent text-center font-bold text-slate-700 outline-none w-full text-base"
                                    value={formData.qtd_militares}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setFormData({ ...formData, qtd_militares: Math.max(1, val) });
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, qtd_militares: formData.qtd_militares + 1 })}
                                    className="px-4 h-full hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200 flex items-center justify-center active:bg-slate-200"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            <span>Salvar Apontamento</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApontamentoForm;
