
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  LayoutDashboard, Ship, Calendar, Filter,
  RefreshCcw, TrendingUp, DollarSign, Clock, CheckCircle2,
  AlertCircle, HardHat, FileText, Settings, UserCheck, Timer,
  Construction, Download, ArrowLeft, Mail, Send, Check, RotateCcw,
  Loader2, Save, X, Info, Copy, HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import emailjs from '@emailjs/browser';
import { fetchSheetData } from './services/dataService';
import { ServiceOrder, DashboardFilters, KPIStats } from './types';
import { STATUS_COLORS, MONTHS_ORDER, WORKSHOP_EMAILS as DEFAULT_EMAILS } from './constants';
import { KPICard } from './components/KPICard';
import { supabase } from './services/supabase';

// --- CONFIGURAÇÃO EMAILJS ---
const EMAILJS_SERVICE_ID = "service_controleps";
const EMAILJS_TEMPLATE_ID = "template_d589wis";
const EMAILJS_PUBLIC_KEY = "J8Rj1YxqYWjXofqMX";

/**
 * Utilitário para formatar o número do PS
 * Exemplo: PS 5 vira "005/24" (se for de 2024)
 */
const formatPS = (ps: number, date?: Date | null) => {
  const psStr = ps.toString().padStart(3, '0');
  const year = date ? date.getFullYear().toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
  return `${psStr}/${year}`;
};

/**
 * Utility to format values as BRL currency
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const App: React.FC = () => {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'orcar' | 'settings'>('dashboard');

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [confirmEmailItem, setConfirmEmailItem] = useState<ServiceOrder | null>(null);

  const [orcarOficinaFilter, setOrcarOficinaFilter] = useState('TODAS');

  const [workshopEmailsMap, setWorkshopEmailsMap] = useState<Record<string, string>>(DEFAULT_EMAILS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [dispatchedEmails, setDispatchedEmails] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bfla_ps_dispatched');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    om: 'TODAS',
    status: 'TODOS',
    oficina: 'TODAS'
  });

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = async () => {
    setLoading(true);
    const sheetData = await fetchSheetData();
    setData(sheetData);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const loadWorkshopEmails = async () => {
      const { data, error } = await supabase.from('workshop_emails').select('name, email');
      if (data && !error) {
        const map = { ...DEFAULT_EMAILS };
        data.forEach(item => {
          map[item.name] = item.email;
        });
        setWorkshopEmailsMap(map);
      }
    };
    loadWorkshopEmails();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('bfla_ps_dispatched', JSON.stringify(Array.from(dispatchedEmails)));
  }, [dispatchedEmails]);

  // Supabase takes care of this now via explicitly save button

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchOM = filters.om === 'TODAS' || item.om === filters.om;
      const matchStatus = filters.status === 'TODOS' || item.status === filters.status;
      const matchOficina = filters.oficina === 'TODAS' || item.oficina === filters.oficina;

      let matchDate = true;
      if (filters.startDate && item.dataEntrada) {
        matchDate = matchDate && item.dataEntrada >= new Date(filters.startDate);
      }
      if (filters.endDate && item.dataEntrada) {
        matchDate = matchDate && item.dataEntrada <= new Date(filters.endDate);
      }

      return matchOM && matchStatus && matchOficina && matchDate;
    });
  }, [data, filters]);

  const totalOrcarCount = useMemo(() => {
    return data.filter(item => item.status === 'ORÇAR').length;
  }, [data]);

  const orcarData = useMemo(() => {
    return data.filter(item => {
      const isOrcar = item.status === 'ORÇAR';
      const matchesOficina = orcarOficinaFilter === 'TODAS' || item.oficina === orcarOficinaFilter;
      return isOrcar && matchesOficina;
    });
  }, [data, orcarOficinaFilter]);

  const kpis = useMemo<KPIStats>(() => {
    const totalPS = filteredData.length;
    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.valorOrcamento, 0);
    const completedCount = filteredData.filter(i => i.status === 'CONCLUÍDO').length;
    const pendingCount = totalPS - completedCount - filteredData.filter(i => i.status === 'CANCELADO').length;
    const totalAditado = filteredData.filter(i => i.aditamento && i.aditamento.trim() !== "").length;
    const totalHH = filteredData.reduce((acc, curr) => acc + curr.hh, 0);
    const totalOrganico = filteredData.filter(i => i.tipoServico.toLowerCase().includes("org")).length;
    const totalTerceirizado = filteredData.filter(i => i.tipoServico.toLowerCase().includes("ter")).length;
    const avgEnvioOficina = totalPS > 0 ? filteredData.reduce((acc, curr) => acc + curr.tempoEnvioDias, 0) / totalPS : 0;
    const avgAguIndRec = totalPS > 0 ? filteredData.reduce((acc, curr) => acc + curr.tempoAguIndRecMeses, 0) / totalPS : 0;

    return {
      totalPS, totalBudget, avgLeadTime: avgEnvioOficina, pendingCount, completedCount,
      materialValue: 0, thirdPartyValue: 0, totalAditado, totalHH,
      totalOrganico, totalTerceirizado, avgEnvioOficina, avgAguIndRec
    };
  }, [filteredData]);

  const oms = useMemo(() => Array.from(new Set(data.map(i => i.om))).sort(), [data]);
  const statuses = useMemo(() => Array.from(new Set(data.map(i => i.status))).sort(), [data]);
  const oficinas = useMemo(() => Array.from(new Set(data.map(i => i.oficina))).sort(), [data]);

  const temporalData = useMemo(() => {
    const counts: Record<string, { name: string, total: number, valor: number }> = {};
    MONTHS_ORDER.forEach(m => counts[m] = { name: m.charAt(0).toUpperCase() + m.slice(1), total: 0, valor: 0 });
    filteredData.forEach(item => {
      const monthKey = (item.mesEntrada || "").toLowerCase().trim();
      if (counts[monthKey]) {
        counts[monthKey].total += 1;
        counts[monthKey].valor += item.valorOrcamento;
      }
    });
    return MONTHS_ORDER.map(m => counts[m]);
  }, [filteredData]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const handleSendEmail = async (item: ServiceOrder) => {
    const id = `${item.ps}-${item.om}`;
    setSendingEmailId(id);
    setConfirmEmailItem(null);

    try {
      const destinationEmail = workshopEmailsMap[item.oficina] ||
        `oficina.${item.oficina.toLowerCase().replace(/\s/g, '')}@marinha.mil.br`;

      const templateParams = {
        ps_number: formatPS(item.ps, item.dataEntrada),
        om_name: item.om,
        workshop_name: item.oficina,
        description: item.descricao,
        entry_date: item.dataEntrada?.toLocaleDateString('pt-BR') || '---',
        to_email: destinationEmail
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setDispatchedEmails(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      setNotification({ message: "E-mail enviado com sucesso!", type: 'success' });
    } catch (error) {
      console.error("Erro no disparo:", error);
      setNotification({ message: "Erro ao enviar e-mail.", type: 'error' });
    } finally {
      setSendingEmailId(null);
    }
  };

  const updateWorkshopEmail = (name: string, email: string) => {
    setWorkshopEmailsMap(prev => ({
      ...prev,
      [name]: email
    }));
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const entries = Object.entries(workshopEmailsMap).map(([name, email]) => ({
        name,
        email,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('workshop_emails')
        .upsert(entries, { onConflict: 'name' });

      if (error) throw error;

      setNotification({ message: "Configurações salvas no Supabase!", type: 'success' });
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setNotification({ message: "Erro ao salvar configurações.", type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRevertDispatched = (item: ServiceOrder) => {
    const id = `${item.ps}-${item.om}`;
    setDispatchedEmails(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const generateReport = () => {
    if (filteredData.length === 0) {
      setNotification({ message: "Nenhum dado para exportar.", type: 'info' });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const tableColumn = ["PS #", "OM", "Descrição", "Oficina", "Status", "Valor"];
      const tableRows = filteredData.map(item => [
        formatPS(item.ps, item.dataEntrada),
        item.om,
        item.descricao,
        item.oficina,
        item.status,
        formatCurrency(item.valorOrcamento)
      ]);

      doc.setFontSize(18);
      doc.text("Relatório de Controle de PS - BFLa", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
      doc.text(`Filtros: OM: ${filters.om} | Oficina: ${filters.oficina} | Status: ${filters.status}`, 14, 35);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      doc.save(`Relatorio_PS_BFLa_${new Date().getTime()}.pdf`);
      setNotification({ message: "Relatório gerado com sucesso!", type: 'success' });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setNotification({ message: "Erro ao gerar o relatório.", type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // --- RENDERS ---

  if (currentView === 'settings') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
                <Settings className="text-indigo-600" size={24} />
                <span>Configurações do Sistema</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mapeamento de E-mails das Oficinas</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <Info className="text-indigo-500" size={20} />
              <p className="text-xs text-slate-500 font-medium">Configure aqui os e-mails de destino para os disparos automáticos de orçamento.</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {oficinas.map((oficina) => (
                <div key={oficina} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1 mr-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{oficina}</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={16} />
                      <input
                        type="email"
                        placeholder="Ex: responsavel@marinha.mil.br"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={workshopEmailsMap[oficina] || ''}
                        onChange={(e) => updateWorkshopEmail(oficina, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${workshopEmailsMap[oficina] ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {workshopEmailsMap[oficina] ? <Check size={12} /> : <AlertCircle size={12} />}
                      <span>{workshopEmailsMap[oficina] ? 'Personalizado' : 'Usando Padrão'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'orcar') {
    const nonDispatched = orcarData.filter(item => !dispatchedEmails.has(`${item.ps}-${item.om}`));
    const dispatched = orcarData.filter(item => dispatchedEmails.has(`${item.ps}-${item.om}`));

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative">
        {/* Modal de Confirmação de Disparo */}
        {confirmEmailItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmEmailItem(null)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8">
                <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Envio?</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Deseja realmente disparar a solicitação de orçamento para a oficina <strong>{confirmEmailItem.oficina}</strong>?
                </p>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destinatário Final</span>
                    <span className="text-sm font-bold text-indigo-600 break-all font-mono">
                      {workshopEmailsMap[confirmEmailItem.oficina] || `oficina.${confirmEmailItem.oficina.toLowerCase().replace(/\s/g, '')}@marinha.mil.br`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referência</span>
                    <span className="text-xs font-medium text-slate-600">PS #{formatPS(confirmEmailItem.ps, confirmEmailItem.dataEntrada)} - {confirmEmailItem.om}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setConfirmEmailItem(null)}
                    className="flex-1 py-3 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSendEmail(confirmEmailItem)}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                  >
                    <Check size={18} />
                    <span>Confirmar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
                <DollarSign className="text-amber-500" size={24} />
                <span>Gestão de Orçamentos (A Orçar)</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Base Fluvial de Ladário</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oficina:</span>
              <select
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                value={orcarOficinaFilter}
                onChange={(e) => setOrcarOficinaFilter(e.target.value)}
              >
                <option value="TODAS">TODAS</option>
                {oficinas.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-amber-200 uppercase flex items-center space-x-2">
              <Timer size={14} />
              <span>{orcarData.length} Pedidos Filtrados</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
            <div className="flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-700 flex items-center space-x-2">
                  <Mail className="text-slate-400" size={18} />
                  <span>Pendentes de Disparo</span>
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full ml-2">{nonDispatched.length}</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {nonDispatched.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                    <CheckCircle2 size={48} className="mb-4" />
                    <p className="text-sm font-medium">Nenhum pedido pendente nesta oficina.</p>
                  </div>
                ) : (
                  nonDispatched.map((item) => {
                    const id = `${item.ps}-${item.om}`;
                    const isSending = sendingEmailId === id;
                    const email = workshopEmailsMap[item.oficina] || 'Padrão Marinha';

                    return (
                      <div key={id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">PS #{formatPS(item.ps, item.dataEntrada)}</span>
                            <h4 className="font-bold text-slate-800 text-lg">{item.om}</h4>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase">{item.oficina}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{item.descricao}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">Enviar para:</span>
                            <span className="text-[11px] font-bold text-indigo-500 truncate max-w-[180px]" title={email}>{email}</span>
                          </div>
                          <button
                            onClick={() => setConfirmEmailItem(item)}
                            disabled={isSending}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                          >
                            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            <span>Disparar E-mail</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 size={18} />
                  <span>Enviados com Sucesso</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full ml-2">{dispatched.length}</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {dispatched.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                    <Mail size={48} className="mb-4" />
                    <p className="text-sm font-medium">Nenhum disparo realizado nesta oficina.</p>
                  </div>
                ) : (
                  dispatched.map((item) => (
                    <div key={`${item.ps}-${item.om}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm opacity-80 border-l-4 border-l-emerald-500">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{item.om} (PS {formatPS(item.ps, item.dataEntrada)})</h4>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase">{item.oficina}</span>
                        </div>
                        <button onClick={() => handleRevertDispatched(item)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative overflow-x-hidden">
      {/* Notificações Toasts */}
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 lg:animate-slide-in animate-fade-in ${notification.type === 'success' ? 'bg-emerald-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : notification.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-700 p-2 rounded-lg text-white">
            <Ship size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">BFLa - Dashboard Controle PS</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Base Fluvial de Ladário</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('orcar')}
            className="flex items-center space-x-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 relative group"
          >
            <DollarSign size={18} />
            <span>A Orçar</span>
            {totalOrcarCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-black">
                {totalOrcarCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Configurações de Oficinas"
          >
            <Settings size={22} />
          </button>

          <div className="h-8 w-px bg-slate-200"></div>

          <button onClick={loadData} disabled={loading} className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8 max-w-[1800px] mx-auto w-full">
        {/* Filtros */}
        <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Início</label>
              <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fim</label>
              <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OM</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.om} onChange={(e) => setFilters({ ...filters, om: e.target.value })}>
                <option value="TODAS">TODAS AS OMs</option>
                {oms.map(om => <option key={om} value={om}>{om}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oficina</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.oficina} onChange={(e) => setFilters({ ...filters, oficina: e.target.value })}>
                <option value="TODAS">TODAS AS OFICINAS</option>
                {oficinas.map(oficina => <option key={oficina} value={oficina}>{oficina}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="TODOS">TODOS OS STATUS</option>
                {statuses.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <KPICard title="Total de PS" value={kpis.totalPS} subtitle="Volume no Período" icon={<LayoutDashboard className="text-indigo-600" size={24} />} colorClass="bg-indigo-600" />
          <KPICard title="Orçamento Total" value={formatCurrency(kpis.totalBudget)} subtitle="Volume Financeiro" icon={<DollarSign className="text-emerald-600" size={24} />} colorClass="bg-emerald-600" />
          <KPICard title="Total de HH" value={kpis.totalHH} subtitle="Esforço Humano" icon={<HardHat className="text-violet-600" size={24} />} colorClass="bg-violet-600" />
          <KPICard title="PS Aditados" value={kpis.totalAditado} subtitle="Alterações Técnicas" icon={<FileText className="text-amber-600" size={24} />} colorClass="bg-amber-600" />
          <KPICard title="Concluídos" value={kpis.completedCount} subtitle="Eficiência" icon={<CheckCircle2 className="text-blue-600" size={24} />} colorClass="bg-blue-600" />
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-8 h-[450px] hover-card">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
              <TrendingUp size={20} className="text-indigo-500" />
              <span>Histórico de Entrada Mensal</span>
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temporalData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="total" name="Pedidos" stroke="#6366f1" strokeWidth={3} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-8 h-[450px] hover-card">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center space-x-2">
              <AlertCircle size={20} className="text-amber-500" />
              <span>Status das Solicitações</span>
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                    {statusDistribution.map((entry, index) => <Cell key={index} fill={STATUS_COLORS[entry.name]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Lista de Pedidos */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 text-lg">Histórico Recente</h3>
            <button
              onClick={generateReport}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-slate-50 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all border border-slate-200 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              <span>{isExporting ? 'Processando...' : 'Gerar Relatório'}</span>
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  <th className="pb-4 px-4">PS #</th>
                  <th className="pb-4 px-4">OM Solicitante</th>
                  <th className="pb-4 px-4">Descrição</th>
                  <th className="pb-4 px-4">Oficina</th>
                  <th className="pb-4 px-4">Status</th>
                  <th className="pb-4 px-4">HH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.slice(0, 8).map((item) => (
                  <tr key={`${item.ps}-${item.om}`} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4 font-black text-indigo-600">{formatPS(item.ps, item.dataEntrada)}</td>
                    <td className="py-5 px-4 font-bold text-slate-700">{item.om}</td>
                    <td className="py-5 px-4 text-slate-500 max-w-xs truncate" title={item.descricao}>{item.descricao}</td>
                    <td className="py-5 px-4 text-slate-500 font-medium">{item.oficina}</td>
                    <td className="py-5 px-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: STATUS_COLORS[item.status] + '15', color: STATUS_COLORS[item.status] }}>{item.status}</span>
                    </td>
                    <td className="py-5 px-4 font-mono font-bold text-slate-400">{item.hh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="py-8 px-8 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} Base Fluvial de Ladário - Sistema de Monitoramento de PS</p>
      </footer>
    </div>
  );
};

export default App;
