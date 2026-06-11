import { useCallback, useEffect, useState } from 'react';
import type { TaskImportRow } from '../types';
import { parseExcelFile, parseExcelFromUrl } from '../utils/importData';

interface DataImportPanelProps {
  onImportRows: (rows: TaskImportRow[]) => void;
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m4 16 5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 18H18a4 4 0 0 0 .4-8 6 6 0 0 0-11.2-2A5 5 0 0 0 7 18h1" />
      <path d="M12 13v7" />
      <path d="m9 17 3 3 3-3" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export default function DataImportPanel({ onImportRows }: DataImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const applyRows = useCallback((rows: TaskImportRow[], source = 'dữ liệu') => {
    if (rows.length === 0) {
      setMessage('Không có dòng hợp lệ.');
      return;
    }

    onImportRows(rows);
    setMessage(`${source}: ${rows.length} dòng`);
  }, [onImportRows]);

  const handleLocalFile = useCallback(async (silent = false) => {
    setIsLoading(true);
    if (!silent) setMessage('');

    try {
      const response = await fetch('/api/local-file-du-lieu', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không đọc được file cục bộ.');
      applyRows(data as TaskImportRow[], 'file du lieu.xlsx');
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : 'Không đọc được file cục bộ.');
    } finally {
      setIsLoading(false);
    }
  }, [applyRows]);

  useEffect(() => {
    const firstLoad = window.setTimeout(() => void handleLocalFile(true), 0);
    const timer = window.setInterval(() => void handleLocalFile(true), 30000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [handleLocalFile]);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setMessage('');
    try {
      applyRows(await parseExcelFile(file), 'Excel');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được Excel.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) {
      setMessage('Chưa có link Drive.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      applyRows(await parseExcelFromUrl(driveUrl), 'Drive');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      className={`rounded-2xl border bg-white/95 p-5 shadow-sm transition ${
        isDragging ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <TrendIcon />
            Báo cáo tiến độ
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Tổng Hợp</h2>
          {message && <p className="mt-1 truncate text-xs font-bold text-slate-500">{message}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="/mau-tong-hop.xlsx"
            download
            className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100 transition hover:bg-amber-100"
            title="Tải file Excel mẫu để nhập dữ liệu Tổng Hợp"
            aria-label="Tải file Excel mẫu"
          >
            <TemplateIcon />
          </a>

          <button
            type="button"
            onClick={() => void handleLocalFile()}
            disabled={isLoading}
            className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Cập nhật từ D:\\quản lý công việc\\file du lieu.xlsx"
            aria-label="Cập nhật từ file cục bộ"
          >
            <FolderIcon />
          </button>

          <label
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-100"
            title="Import dữ liệu từ file Excel"
            aria-label="Import dữ liệu từ file Excel"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.currentTarget.value = '';
              }}
            />
            <UploadIcon />
          </label>

          <button
            type="button"
            onClick={() => void handleDriveImport()}
            disabled={isLoading}
            className="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-100 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Cập nhật từ Google Drive"
            aria-label="Cập nhật từ Google Drive"
          >
            <CloudIcon />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={driveUrl}
          onChange={(event) => setDriveUrl(event.target.value)}
          placeholder="Google Drive / Sheets"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => void handleDriveImport()}
          disabled={isLoading}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Drive
        </button>
      </div>
    </section>
  );
}
