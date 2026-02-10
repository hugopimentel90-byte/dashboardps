
import { ServiceOrder } from '../types';
import { GOOGLE_SHEET_CSV_URL } from '../constants';

/**
 * Parses a date string in DD/MM/YYYY format
 */
const parseBRDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Parses Brazilian currency/number format (e.g., 1.234,56)
 */
const parseBRNumber = (val: string): number => {
  if (!val || val.trim() === "") return 0;
  // Remove dots (thousands) and replace comma with dot (decimal)
  const cleanVal = val.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Simple CSV split that respects quotes and trims values
 */
const splitCSVRow = (row: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const fetchSheetData = async (): Promise<ServiceOrder[]> => {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error("Failed to fetch data from Google Sheets");
    
    const csvText = await response.text();
    // Split by any newline format and filter out empty rows
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    const dataRows = lines.slice(1);

    return dataRows.map((row) => {
      const cols = splitCSVRow(row);
      
      const dataEntrada = parseBRDate(cols[4]);
      let mesEntrada = (cols[14] || "").toLowerCase();
      
      // Fallback: If month column is empty, derive from dataEntrada
      if (!mesEntrada && dataEntrada) {
        const months = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        mesEntrada = months[dataEntrada.getMonth()];
      }

      return {
        om: cols[0] || "N/D",
        ps: parseInt(cols[1]) || 0,
        descricao: cols[2] || "Sem descrição",
        status: (cols[3] || "S/S").toUpperCase(),
        dataEntrada: dataEntrada,
        saidaOficina: parseBRDate(cols[5]),
        oficina: cols[6] || "N/A",
        valorOrcamento: parseBRNumber(cols[7]),
        valorMaterial: parseBRNumber(cols[8]),
        valorServicoTerceirizado: parseBRNumber(cols[9]),
        txOmps: parseBRNumber(cols[10]),
        hh: parseBRNumber(cols[11]),
        tipoServico: cols[12] || "",
        aditamento: cols[13] || "",
        mesEntrada: mesEntrada,
        tempoEnvioDias: parseInt(cols[15]) || 0,
        tempoAguIndRecMeses: parseInt(cols[16]) || 0,
      };
    }).filter(item => item.ps > 0);
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
