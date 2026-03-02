
import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, Legend
} from 'recharts';
import {
    TrendingUp, HardHat, Clock, BarChart3,
    ArrowLeft, Users, Zap, LayoutDashboard
} from 'lucide-react';
import { ApontamentoHH } from '../types';
import { KPICard } from './KPICard';

interface HHDashboardProps {
    data: ApontamentoHH[];
    loading: boolean;
    onBack: () => void;
}

const HHDashboard: React.FC<HHDashboardProps> = ({ data, loading, onBack }) => {

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
        const temporalMap: Record<string, number> = {};

        data.forEach(item => {
            const hh = calculateHH(item);
            totalHH += hh;
            totalMilitares += item.qtd_militares;

            // Por Oficina
            workshopMap[item.oficina] = (workshopMap[item.oficina] || 0) + hh;

            // Por Data (Agrupado por dia/semana)
            const dateKey = item.data; // YYYY-MM-DD
            temporalMap[dateKey] = (temporalMap[dateKey] || 0) + hh;
        });

        const workshopData = Object.entries(workshopMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const temporalData = Object.entries(temporalMap)
            .map(([date, value]) => ({
                date,
                value,
                formattedDate: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalHH,
            totalMilitares,
            avgHH: data.length > 0 ? totalHH / data.length : 0,
            workshopData,
            temporalData,
            totalRegistros: data.length
        };
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Users className="animate-bounce mb-4" size={48} />
                <p className="font-bold">Carregando métricas de HH...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Info */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Estatísticas de HH</h2>
                    <p className="text-slate-500 text-sm font-medium">Análise de esforço humano por oficina</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center space-x-2">
                    <Clock size={18} />
                    <span className="font-black text-sm">{metrics.totalHH.toFixed(1)} HH Totais</span>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    title="Média por Serviço"
                    value={metrics.avgHH.toFixed(1)}
                    subtitle="HH / Registro"
                    icon={<Zap className="text-amber-600" size={24} />}
                    colorClass="bg-amber-600"
                />
                <KPICard
                    title="Registros"
                    value={metrics.totalRegistros}
                    subtitle="Processados no Período"
                    icon={<BarChart3 className="text-emerald-600" size={24} />}
                    colorClass="bg-emerald-600"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* HH por Oficina */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-[450px]">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
                        <BarChart3 size={20} className="text-indigo-500" />
                        <span>Distribuição de HH por Oficina</span>
                    </h3>
                    <div className="h-[320px]">
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
                    </div>
                </div>

                {/* Evolução Temporal */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-[450px]">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
                        <TrendingUp size={20} className="text-emerald-500" />
                        <span>Evolução Diária de HH</span>
                    </h3>
                    <div className="h-[320px]">
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
                    </div>
                </div>
            </div>

            {/* Lista de Registros Recentes */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <h3 className="font-bold text-slate-800 mb-6">Últimos Lançamentos de HH</h3>
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
                            {data.slice(0, 10).map((item, idx) => {
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
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HHDashboard;
