
export interface ServiceOrder {
  om: string;
  ps: number;
  descricao: string;
  status: string;
  dataEntrada: Date | null;
  saidaOficina: Date | null;
  oficina: string;
  valorOrcamento: number;
  valorMaterial: number;
  valorServicoTerceirizado: number;
  txOmps: number;
  hh: number;
  tipoServico: string;
  aditamento: string;
  mesEntrada: string;
  tempoEnvioDias: number;
  tempoAguIndRecMeses: number;
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  om: string;
  status: string;
  oficina: string;
}

export interface KPIStats {
  totalPS: number;
  totalBudget: number;
  avgLeadTime: number; // General reference
  pendingCount: number;
  completedCount: number;
  materialValue: number;
  thirdPartyValue: number;
  // New KPIs
  totalAditado: number;
  totalHH: number;
  totalOrganico: number;
  totalTerceirizado: number;
  avgEnvioOficina: number;
  avgAguIndRec: number;
}
