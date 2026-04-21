
import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, Legend
} from 'recharts';
import {
    TrendingUp, HardHat, Clock, BarChart3,
    ArrowLeft, Users, Zap, LayoutDashboard, Calendar, Filter, X
} from 'lucide-react';
import { ApontamentoHH } from '../types';
import { KPICard } from './KPICard';

interface HHDashboardFilters {
    startDate: string;
    endDate: string;
    oficina: string;
}

interface HHDashboardProps {
    data: ApontamentoHH[];
    loading: boolean;
    oficinas: string[];
    onBack: () => void;
}

const HHDashboard: React.FC<HHDashboardProps> = ({ data, loading, oficinas, onBack }) => {
    const [filters, setFilters] = useState<HHDashboardFilters>({
        startDate: '',
        endDate: '',
        oficina: 'TODAS'
    });

    // Função auxiliar para calcular HH de um registro
    const calculateHH = (item: ApontamentoHH) => {
        try {
            const [hStart, mStart] = item.inicio.split(':').map(Number);
            const [hEnd, mEnd] = item.fim.split(':').map(Number);

            const startMinutes = hStart * 60 + mStart;
            const endMinutes = hEnd * 60 + mEnd;

            let durationMinutes = endMinutes - startMinutes;
            if (durationMinutes < 0) durationMinutes += 24 * 60; // Caso vire a noite

            const durationHours = durationMinutes / 60;
            return durationHours * item.qtd_militares;
        } catch (e) {
            return 0;
        }
    };

    const metrics = useMemo(() => {
        let totalHH = 0;
        let totalMilitares = 0;
        const workshopMap: Record<string, number> = {};
        const temporalMap: Record<string, { hh: number, count: number }> = {};

        const filteredData = data.filter(item => {
            const matchOficina = filters.oficina === 'TODAS' || item.oficina === filters.oficina;

            let matchDate = true;
            if (filters.startDate) {
                matchDate = matchDate && item.data >= filters.startDate;
            }
            if (filters.endDate) {
                matchDate = matchDate && item.data <= filters.endDate;
            }

            return matchOficina && matchDate;
        });

        filteredData.forEach(item => {
            const hh = calculateHH(item);
            totalHH += hh;
            totalMilitares += item.qtd_militares;

            // Por Oficina
            workshopMap[item.oficina] = (workshopMap[item.oficina] || 0) + hh;

            // Por Data
            const dateKey = item.data; // YYYY-MM-DD
            if (!temporalMap[dateKey]) temporalMap[dateKey] = { hh: 0, count: 0 };
            temporalMap[dateKey].hh += hh;
            temporalMap[dateKey].count += 1;
        });

        const workshopData = Object.entries(workshopMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const temporalData = Object.entries(temporalMap)
            .map(([date, data]) => ({
                date,
                value: data.hh,
                count: data.count,
                formattedDate: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        let filterDays = 1;
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate + 'T00:00:00');
            const end = new Date(filters.endDate + 'T00:00:00');
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            filterDays = diff > 0 ? diff : 1;
        } else if (temporalData.length > 0) {
            const start = new Date(temporalData[0].date + 'T00:00:00');
            const end = new Date(temporalData[temporalData.length - 1].date + 'T00:00:00');
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            filterDays = diff > 0 ? diff : 1;
        }

        return {
            totalHH,
            totalMilitares,
            avgHH: filteredData.length > 0 ? totalHH / filteredData.length : 0,
            avgServicosPorDia: filteredData.length > 0 ? filteredData.length / filterDays : 0,
            avgHHPorDia: totalHH / filterDays,
            workshopData,
            temporalData,
            totalRegistros: filteredData.length,
            filteredData
        };
    }, [data, filters]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Users className="animate-bounce mb-4" size={48} />
                <p className="font-bold">Carregando métricas de HH...</p>
            </div>
        );
    }

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            oficina: 'TODAS'
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Info & Filters */}
            <div className="flex flex-col sm:flex-row lg:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate">Estatísticas de HH</h2>
                    <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase tracking-wider">Análise de esforço humano</p>
                </div>

                {/* Filtros em Linha estilo Premium */}
                <div className="bg-white p-1.5 md:p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-1.5 md:gap-2 w-full lg:w-auto">
                    <div className="flex flex-1 sm:flex-none items-center space-x-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Calendar size={12} className="text-indigo-500 flex-none" />
                        <div className="flex items-center space-x-1 min-w-0">
                            <input
                                type="date"
                                className="bg-transparent text-[9px] md:text-[10px] font-bold text-slate-700 outline-none w-[90px] md:w-auto"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                            <span className="text-[8px] font-black text-slate-300">ATÉ</span>
                            <input
                                type="date"
                                className="bg-transparent text-[9px] md:text-[10px] font-bold text-slate-700 outline-none w-[90px] md:w-auto"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-1 sm:flex-none items-center space-x-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-50 rounded-xl border border-slate-100 min-w-[120px]">
                        <Filter size={12} className="text-indigo-500 flex-none" />
                        <select
                            className="bg-transparent text-[9px] md:text-[10px] font-bold text-slate-700 outline-none cursor-pointer w-full appearance-none"
                            value={filters.oficina}
                            onChange={(e) => setFilters(prev => ({ ...prev, oficina: e.target.value }))}
                        >
                            <option value="TODAS">TODAS</option>
                            {oficinas.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>

                    {(filters.startDate || filters.endDate || filters.oficina !== 'TODAS') && (
                        <button
                            onClick={clearFilters}
                            className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors flex-none"
                            title="Limpar Filtros"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="bg-indigo-50 text-indigo-700 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-indigo-100 flex items-center space-x-2 self-start sm:self-center shrink-0">
                    <Clock size={16} />
                    <span className="font-black text-[10px] md:text-sm whitespace-nowrap">{metrics.totalHH.toFixed(1)} HH SELECIONADOS</span>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 lg:grid-cols-3 gap-4 md:gap-6">
                <KPICard
                    title="HH Acumulado"
                    value={metrics.totalHH.toFixed(1)}
                    subtitle="Total de Horas-Homem"
                    icon={<HardHat className="text-violet-600" size={24} />}
                    colorClass="bg-violet-600"
                />
                <KPICard
                    title="Participações"
                    value={metrics.totalMilitares}
                    subtitle="Militares Empenhados"
                    icon={<Users className="text-blue-600" size={24} />}
                    colorClass="bg-blue-600"
                />
                <KPICard
                    title="Média de HH"
                    value={metrics.avgHH.toFixed(1)}
                    subtitle="HH por Registro"
                    icon={<Zap className="text-amber-600" size={24} />}
                    colorClass="bg-amber-600"
                />
                <KPICard
                    title="Registros Totais"
                    value={metrics.totalRegistros}
                    subtitle="No Período"
                    icon={<BarChart3 className="text-emerald-600" size={24} />}
                    colorClass="bg-emerald-600"
                />
                <KPICard
                    title="PS/dia"
                    value={metrics.avgServicosPorDia.toFixed(1)}
                    subtitle="Cadastros / Dia Ativo"
                    icon={<Calendar className="text-cyan-600" size={24} />}
                    colorClass="bg-cyan-600"
                />
                <KPICard
                    title="HH/dia"
                    value={metrics.avgHHPorDia.toFixed(1)}
                    subtitle="Média de Esforço"
                    icon={<TrendingUp className="text-rose-600" size={24} />}
                    colorClass="bg-rose-600"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {/* HH por Oficina */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8 h-[380px] md:h-[450px]">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
                        <BarChart3 size={20} className="text-indigo-500" />
                        <span>Distribuição de HH por Oficina</span>
                    </h3>
                    <div className="h-[320px]">
                        {metrics.workshopData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.workshopData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`${value.toFixed(1)} HH`, 'Esforço']}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-sm italic font-medium">
                                Nenhuma oficina encontrada no filtro selecionado.
                            </div>
                        )}
                    </div>
                </div>

                {/* Evolução Temporal */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8 h-[380px] md:h-[450px]">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
                        <TrendingUp size={20} className="text-emerald-500" />
                        <span>Evolução Diária de HH</span>
                    </h3>
                    <div className="h-[320px]">
                        {metrics.temporalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.temporalData}>
                                    <defs>
                                        <linearGradient id="colorHH" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`${value.toFixed(1)} HH`, 'HH Total']}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#colorHH)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-sm italic font-medium">
                                Sem registros para o período/filtro selecionado.
                            </div>
                        )}
                    </div>
                </div>

                {/* Volume de Serviços */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8 h-[380px] md:h-[450px]">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
                        <Calendar size={20} className="text-cyan-500" />
                        <span>Volume de Serviços Diário</span>
                    </h3>
                    <div className="h-[320px]">
                        {metrics.temporalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.temporalData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`${value} lançamentos`, 'Volume']}
                                    />
                                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-sm italic font-medium">
                                Sem registros para o período/filtro selecionado.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Registros Recentes */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800">Lançamentos de HH {metrics.filteredData.length > 0 && `(${metrics.filteredData.length})`}</h3>
                    {metrics.filteredData.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibindo registros filtrados</span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                <th className="pb-4 px-4">Data</th>
                                <th className="pb-4 px-4">Serviço</th>
                                <th className="pb-4 px-4">Oficina</th>
                                <th className="pb-4 px-4">Militares</th>
                                <th className="pb-4 px-4">Período</th>
                                <th className="pb-4 px-4">HH</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {metrics.filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm italic">
                                        Nenhum lançamento encontrado para os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                metrics.filteredData.slice(0, 50).map((item, idx) => {
                                    const hh = calculateHH(item);
                                    return (
                                        <tr key={idx} className="text-sm hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4 font-bold text-slate-600">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="py-4 px-4 text-slate-700 font-medium">{item.servico}</td>
                                            <td className="py-4 px-4">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">{item.oficina}</span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-600">{item.qtd_militares}</td>
                                            <td className="py-4 px-4 text-slate-500 text-xs">{item.inicio} - {item.fim}</td>
                                            <td className="py-4 px-4 font-black text-indigo-600">{hh.toFixed(1)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HHDashboard;
