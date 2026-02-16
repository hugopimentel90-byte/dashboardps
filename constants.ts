
export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nQwuzcJYp3FXLgcyMjAQbwTZSBy5xGHcyQqAlZYuajg/export?format=csv&gid=0";

export const STATUS_COLORS: Record<string, string> = {
  'ORÇAR': '#f59e0b', // Amber
  'EXECUTANDO': '#3b82f6', // Blue
  'FINALIZADO': '#10b981', // Emerald
  'CANCELADO': '#ef4444', // Red
  'AGUARDANDO': '#8b5cf6', // Violet
  'IND REC': '#64748b' // Slate
};

export const MONTHS_ORDER = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Mapeamento de e-mails por oficina.
 * CHAVE: Nome exato da oficina conforme consta na planilha.
 * VALOR: E-mail de destino do responsável.
 */
export const WORKSHOP_EMAILS: Record<string, string> = {
  'MECÂNICA': 'oficina.mecanica@exemplo.mil.br',
  'CARPINTARIA': 'oficina.carpintaria@exemplo.mil.br',
  'ELÉTRICA': 'oficina.eletrica@exemplo.mil.br',
  'ESTRUTURA': 'oficina.estrutura@exemplo.mil.br',
  'ELETRÔNICA': 'oficina.eletronica@exemplo.mil.br',
  'METALURGIA': 'oficina.metalurgia@exemplo.mil.br',
  // Adicione outras conforme necessário
};
