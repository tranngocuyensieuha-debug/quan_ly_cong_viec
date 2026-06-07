import { TEAMS, USERS } from '../data/seed';
import type { Task } from '../types';

interface XlsxModule {
  utils: {
    json_to_sheet(rows: Record<string, string | number>[]): unknown;
    book_new(): unknown;
    book_append_sheet(workbook: unknown, worksheet: unknown, name: string): void;
  };
  writeFile(workbook: unknown, filename: string): void;
}

export type ReportExportMode = 'range' | 'month' | 'year';

export interface ReportExportOptions {
  mode: ReportExportMode;
  fromDate?: string;
  toDate?: string;
  month?: string;
  year?: string;
}

const XLSX_CDN = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

async function loadXlsx(): Promise<XlsxModule> {
  return import(/* @vite-ignore */ XLSX_CDN) as Promise<XlsxModule>;
}

function isWithinRange(date: string, fromDate: string, toDate: string): boolean {
  return date >= fromDate && date <= toDate;
}

function getExportRange(options: ReportExportOptions): { fromDate: string; toDate: string; label: string } {
  if (options.mode === 'month') {
    const month = options.month || new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDate = new Date(year, monthNumber, 0).getDate();
    return {
      fromDate: `${month}-01`,
      toDate: `${month}-${String(lastDate).padStart(2, '0')}`,
      label: `thang-${month}`,
    };
  }

  if (options.mode === 'year') {
    const year = options.year || String(new Date().getFullYear());
    return {
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
      label: `nam-${year}`,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    fromDate: options.fromDate || today,
    toDate: options.toDate || today,
    label: `tu-${options.fromDate || today}-den-${options.toDate || today}`,
  };
}

function buildReportRows(tasks: Task[], fromDate?: string, toDate?: string) {
  return tasks.flatMap((task) =>
    task.participants
      .filter((participant) => !fromDate || !toDate || isWithinRange(participant.deadline, fromDate, toDate))
      .map((participant) => {
        const user = USERS.find((item) => item.id === participant.userId);
        const team = TEAMS.find((item) => item.id === user?.teamId);
        const rate =
          participant.assigned > 0
            ? Math.round((participant.completed / participant.assigned) * 100)
            : participant.progress;

        return {
          'Nhiệm vụ': task.title,
          'Tổ': team?.name ?? '',
          'Cán bộ': user?.name ?? '',
          'Phải thực hiện': participant.assigned,
          'Đã thực hiện': participant.completed,
          'Tỷ lệ thực hiện (%)': rate,
          'Tiến độ (%)': participant.progress,
          'Thời hạn cá nhân': participant.deadline,
          'Hạn chung nhiệm vụ': task.deadline,
          'Mức độ ưu tiên': task.priority,
        };
      }),
  );
}

export async function exportTaskReport(tasks: Task[], options: ReportExportOptions): Promise<number> {
  const { fromDate, toDate, label } = getExportRange(options);
  const filteredRows = buildReportRows(tasks, fromDate, toDate);
  const rows = filteredRows.length > 0 ? filteredRows : buildReportRows(tasks);
  const xlsx = await loadXlsx();
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows);

  xlsx.utils.book_append_sheet(workbook, worksheet, 'Bao cao nhiem vu');
  xlsx.writeFile(workbook, `bao-cao-nhiem-vu-${label}.xlsx`);

  return rows.length;
}
