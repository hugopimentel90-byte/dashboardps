
export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nQwuzcJYp3FXLgcyMjAQbwTZSBy5xGHcyQqAlZYuajg/export?format=csv&gid=0";

export const STATUS_COLORS: Record<string, string> = {
  'ORÇAR': '#f59e0b', // Amber 500
  'EM ABERTO': '#0ea5e9', // Sky 500
  'EXECUTANDO': '#3b82f6', // Blue 500
  'FINALIZADO': '#10b981', // Emerald 500
  'CONCLUÍDO': '#14b8a6', // Teal 500
  'CANCELADO': '#ef4444', // Red 500
  'AGUARDANDO': '#eab308', // Yellow 500
  'AGU IND REC': '#d946ef', // Fuchsia 500
  'IND REC': '#8b5cf6', // Violet 500
  'PARALISADO': '#64748b' // Slate 500
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
