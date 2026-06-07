import { useMemo, useState } from 'react';
import { TEAMS, USERS } from '../data/seed';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskImportRow, TaskStatus } from '../types';
import { formatDate, getDaysRemaining, getDeadlineStatus } from '../utils/deadline';
import ChartsPanel from './ChartsPanel';
import DataImportPanel from './DataImportPanel';
import RankingPanel from './RankingPanel';
import ReportExportPanel from './ReportExportPanel';
import TaskBoard from './TaskBoard';
import TaskFormModal from './TaskFormModal';
import TeamStatsPanel from './TeamStatsPanel';
import OfficerWorkloadChart from './OfficerWorkloadChart';
import InitiativeProgressChart from './InitiativeProgressChart';

type SectionId = 'overview' | 'work' | 'officer-progress' | 'reports' | 'catalog' | 'settings';
type WorkDisplayStatus = 'unprocessed' | 'processing' | 'waiting' | 'completed' | 'overdue';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
}

interface WorkRow {
  index: number;
  task: Task;
  householdName: string;
  taxCode: string;
  content: string;
  officerName: string;
  officerId: string;
  deadline: string;
  status: WorkDisplayStatus;
  progress: number;
}

const NAV_ITEMS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Tổng quan', icon: 'M3 11.5 12 4l9 7.5M5 10.5V20h14v-9.5' },
  { id: 'work', label: 'Công việc', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { id: 'officer-progress', label: 'Tiến độ cán bộ', icon: 'M4 19V9m6 10V5m6 14v-7m4 7H2' },
  { id: 'reports', label: 'Báo cáo', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5' },
  { id: 'catalog', label: 'Danh mục', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { id: 'settings', label: 'Cài đặt', icon: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.07-.4H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.07V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.36.36.69.6 1 .28.27.66.42 1.07.4H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' },
];

const STATUS_LABELS: Record<WorkDisplayStatus, string> = {
  unprocessed: 'Chưa xử lý',
  processing: 'Đang xử lý',
  waiting: 'Chờ bổ sung',
  completed: 'Đã hoàn thành',
  overdue: 'Quá hạn',
};

const STATUS_CLASS: Record<WorkDisplayStatus, string> = {
  unprocessed: 'bg-slate-100 text-slate-700 ring-slate-200',
  processing: 'bg-blue-50 text-blue-700 ring-blue-200',
  waiting: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  overdue: 'bg-red-50 text-red-700 ring-red-200',
};

function Icon({ path, className = 'h-5 w-5' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function sumTask(task: Task) {
  return task.participants.reduce(
    (total, participant) => ({
      assigned: total.assigned + participant.assigned,
      completed: total.completed + participant.completed,
    }),
    { assigned: 0, completed: 0 },
  );
}

function taskRate(task: Task) {
  const total = sumTask(task);
  if (total.assigned <= 0) return task.progress;
  return Math.min(100, Math.round((total.completed / total.assigned) * 100));
}

function getDisplayStatus(task: Task): WorkDisplayStatus {
  if (task.status !== 'done' && getDeadlineStatus(task.deadline) === 'overdue') {
    return 'overdue';
  }

  const map: Record<TaskStatus, WorkDisplayStatus> = {
    todo: 'unprocessed',
    in_progress: 'processing',
    review: 'waiting',
    done: 'completed',
  };
  return map[task.status];
}

function getPrimaryOfficer(task: Task) {
  const firstParticipant = task.participants[0];
  const user = USERS.find((item) => item.id === (firstParticipant?.userId ?? task.assigneeId));
  return user ?? USERS[0];
}

function getTeamName(userId: string) {
  const user = USERS.find((item) => item.id === userId);
  return TEAMS.find((team) => team.id === user?.teamId)?.name ?? 'Chưa xác định';
}

function buildRows(tasks: Task[]): WorkRow[] {
  return tasks.map((task, index) => {
    const officer = getPrimaryOfficer(task);
    return {
      index: index + 1,
      task,
      householdName: `${task.title}`,
      taxCode: `CĐ-${String(index + 1).padStart(2, '0')}`,
      content: task.description,
      officerName: officer.name,
      officerId: officer.id,
      deadline: task.deadline,
      status: getDisplayStatus(task),
      progress: taskRate(task),
    };
  });
}

function buildOfficerProgressRows(tasks: Task[]) {
  return USERS.map((user) => {
    let assigned = 0;
    let completed = 0;
    let overdue = 0;

    tasks.forEach((task) => {
      const participant = task.participants.find((item) => item.userId === user.id);
      if (!participant) return;

      assigned += participant.assigned;
      completed += participant.completed;
      if (participant.progress < 100 && getDeadlineStatus(participant.deadline) === 'overdue') overdue += 1;
    });

    const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    return { user, assigned, completed, overdue, rate };
  }).sort((a, b) => a.rate - b.rate);
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-950">{title}</h2>
      {sub && <p className="mt-1 text-sm font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: 'blue' | 'slate' | 'amber' | 'green' | 'red' | 'cyan';
  icon: string;
}) {
  const toneClass = {
    blue: 'bg-blue-600 text-white shadow-blue-600/20',
    slate: 'bg-slate-700 text-white shadow-slate-700/15',
    amber: 'bg-amber-500 text-white shadow-amber-500/20',
    green: 'bg-emerald-600 text-white shadow-emerald-600/20',
    red: 'bg-red-600 text-white shadow-red-600/20',
    cyan: 'bg-cyan-600 text-white shadow-cyan-600/20',
  }[tone];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{sub}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-lg ${toneClass}`}>
          <Icon path={icon} className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: WorkDisplayStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${STATUS_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProgressDonut({
  stats,
}: {
  stats: { totalTasks: number; completed: number; processing: number; overdue: number; unprocessed: number; waiting: number; progress: number };
}) {
  const segments = [
    { label: 'Hoàn thành', value: stats.completed, color: 'bg-emerald-500' },
    { label: 'Đang xử lý', value: stats.processing, color: 'bg-blue-600' },
    { label: 'Quá hạn', value: stats.overdue, color: 'bg-red-600' },
    { label: 'Chưa bắt đầu', value: stats.unprocessed, color: 'bg-slate-400' },
    { label: 'Chờ bổ sung', value: stats.waiting, color: 'bg-amber-500' },
  ];

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#059669_0_40%,#2563eb_40%_72%,#dc2626_72%_82%,#94a3b8_82%_92%,#f59e0b_92%_100%)]">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-inner">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-950">{stats.progress}%</p>
            <p className="text-xs font-bold text-slate-500">Hoàn thành</p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {segments.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
            <span className="text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfficerProgressPanel({
  rows,
  full = false,
}: {
  rows: ReturnType<typeof buildOfficerProgressRows>;
  full?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        eyebrow="So sánh cán bộ"
        title="Tiến độ theo cán bộ"
        sub={full ? 'Xếp theo tỷ lệ hoàn thành từ thấp đến cao để nhận diện cán bộ cần hỗ trợ.' : 'Các cán bộ cần theo dõi sát tiến độ.'}
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Cán bộ</th>
              <th className="px-3 py-3 text-right">Tổng việc</th>
              <th className="px-3 py-3 text-right">Đã xong</th>
              <th className="px-3 py-3 text-right">Quá hạn</th>
              <th className="px-3 py-3">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.user.id}>
                <td className="px-3 py-3">
                  <p className="font-extrabold text-slate-900">{row.user.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{getTeamName(row.user.id)}</p>
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-800">{row.assigned.toLocaleString('vi-VN')}</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-700">{row.completed.toLocaleString('vi-VN')}</td>
                <td className="px-3 py-3 text-right font-bold text-red-700">{row.overdue}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${row.rate >= 75 ? 'bg-emerald-600' : row.rate >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`}
                        style={{ width: `${row.rate}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-extrabold text-slate-700">{row.rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriorityWorkPanel({ rows, onOpenWork }: { rows: WorkRow[]; onOpenWork: () => void }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle eyebrow="Cần lãnh đạo chú ý" title="Việc quá hạn, sắp hạn hoặc mức khẩn" sub="Chỉ hiển thị nhóm ưu tiên thay vì toàn bộ danh sách công việc." />
        <button type="button" onClick={onOpenWork} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-extrabold text-white hover:bg-blue-800">
          Mở công việc
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Mức độ</th>
              <th className="px-3 py-3">Nội dung việc</th>
              <th className="px-3 py-3">Phụ trách</th>
              <th className="px-3 py-3">Hạn xử lý</th>
              <th className="px-3 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const days = getDaysRemaining(row.deadline);
              const level = row.status === 'overdue' ? 'Đỏ' : 'Vàng';
              return (
                <tr key={row.task.id}>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${level === 'Đỏ' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{level}</span>
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">{row.task.title}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700">{row.officerName}</td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-slate-900">{formatDate(row.deadline)}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.status === 'overdue' ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${Math.max(days, 0)} ngày`}</p>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function QuickFilterPanel({
  setActiveSection,
  setStatusFilter,
  setOfficerFilter,
  clearFilters,
}: {
  setActiveSection: (section: SectionId) => void;
  setStatusFilter: (status: WorkDisplayStatus | 'all') => void;
  setOfficerFilter: (userId: string) => void;
  clearFilters: () => void;
}) {
  const openWithStatus = (status: WorkDisplayStatus | 'all') => {
    clearFilters();
    setStatusFilter(status);
    setActiveSection('work');
  };

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="Bộ lọc nhanh" title="Lọc thông minh" sub="Dành cho lãnh đạo mở nhanh nhóm việc cần xem." />
      <div className="mt-4 grid gap-2">
        <button type="button" onClick={() => openWithStatus('overdue')} className="rounded-lg bg-red-50 px-3 py-2 text-left text-sm font-extrabold text-red-700 hover:bg-red-100">Việc quá hạn</button>
        <button type="button" onClick={() => openWithStatus('waiting')} className="rounded-lg bg-amber-50 px-3 py-2 text-left text-sm font-extrabold text-amber-700 hover:bg-amber-100">Việc chờ bổ sung</button>
        <button type="button" onClick={() => openWithStatus('processing')} className="rounded-lg bg-blue-50 px-3 py-2 text-left text-sm font-extrabold text-blue-700 hover:bg-blue-100">Việc đang xử lý</button>
        <select
          onChange={(event) => {
            clearFilters();
            setOfficerFilter(event.target.value);
            setActiveSection('work');
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
          defaultValue=""
        >
          <option value="" disabled>Lọc theo cán bộ</option>
          {USERS.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

function ActivityPanel({ items }: { items: { id: string; time: string; text: string }[] }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="Nhật ký" title="Hoạt động gần đây" sub="Cho biết hệ thống đang được cập nhật thường xuyên." />
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-3">
            <span className="w-14 shrink-0 text-xs font-extrabold text-blue-700">{item.time}</span>
            <p className="text-sm font-semibold leading-snug text-slate-700">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CatalogPanel() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="Danh mục" title="Cán bộ, tổ và địa bàn" sub="Dữ liệu danh mục đang dùng cho phân công và báo cáo." />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {TEAMS.map((team) => {
          const users = USERS.filter((user) => user.teamId === team.id);
          return (
            <div key={team.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-extrabold text-slate-900">{team.name}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{users.length} cán bộ</p>
              <div className="mt-3 space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700">
                    {user.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveParticipant,
    updateParticipantAssigned,
    updateParticipantCompleted,
    updateTaskDeadline,
    updateParticipantDeadline,
    importTaskRows,
    reset,
  } = useTasks();

  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDetailBoard, setShowDetailBoard] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryTaxCode, setQueryTaxCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkDisplayStatus | 'all'>('all');
  const [officerFilter, setOfficerFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newSchedule, setNewSchedule] = useState({ time: '', title: '', location: '' });
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { id: 'schedule-01', time: '08:00', title: 'Tiếp nhận và rà soát hồ sơ hỗ trợ hộ kinh doanh', location: 'Bộ phận hỗ trợ TCS23' },
    { id: 'schedule-02', time: '14:00', title: 'Tổng hợp tiến độ xử lý theo cán bộ phụ trách', location: 'Tổ quản lý hỗ trợ số 1, số 2' },
  ]);

  const [viewMode, setViewMode] = useState<'initiative' | 'officer'>('initiative');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const rows = useMemo(() => buildRows(tasks), [tasks]);

  const stats = useMemo(() => {
    const totalHouseholds = tasks.reduce((sum, task) => sum + sumTask(task).assigned, 0);
    const unprocessed = rows.filter((row) => row.status === 'unprocessed').length;
    const processing = rows.filter((row) => row.status === 'processing').length;
    const waiting = rows.filter((row) => row.status === 'waiting').length;
    const completed = rows.filter((row) => row.status === 'completed').length;
    const overdue = rows.filter((row) => row.status === 'overdue').length;
    const upcoming = rows.filter((row) => row.status !== 'completed' && row.status !== 'overdue' && getDaysRemaining(row.deadline) <= 3).length;
    const totalCompleted = tasks.reduce((sum, task) => sum + sumTask(task).completed, 0);
    const progress = totalHouseholds > 0 ? Math.round((totalCompleted / totalHouseholds) * 100) : 0;
    const totalTasks = rows.length;
    return { totalHouseholds, totalTasks, unprocessed, processing, waiting, completed, overdue, upcoming, totalCompleted, progress };
  }, [rows, tasks]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const nameMatch = row.householdName.toLowerCase().includes(queryName.trim().toLowerCase());
      const taxMatch = row.taxCode.toLowerCase().includes(queryTaxCode.trim().toLowerCase());
      const statusMatch = statusFilter === 'all' || row.status === statusFilter;
      const officerMatch = officerFilter === 'all' || row.task.participants.some(p => p.userId === officerFilter);
      const fromMatch = !dateFrom || row.deadline >= dateFrom;
      const toMatch = !dateTo || row.deadline <= dateTo;
      return nameMatch && taxMatch && statusMatch && officerMatch && fromMatch && toMatch;
    });
  }, [dateFrom, dateTo, officerFilter, queryName, queryTaxCode, rows, statusFilter]);

  const officerProgressRows = useMemo(() => buildOfficerProgressRows(tasks), [tasks]);

  const officerRows = useMemo(() => {
    return USERS.map((user, index) => {
      let assigned = 0;
      let completed = 0;
      let taskCount = 0;
      let overdueCount = 0;
      
      const officerTasks = tasks.filter((task) => {
        const p = task.participants.find((p) => p.userId === user.id);
        if (p) {
          assigned += p.assigned;
          completed += p.completed;
          taskCount += 1;
          if (p.progress < 100 && getDeadlineStatus(p.deadline) === 'overdue') {
            overdueCount += 1;
          }
          return true;
        }
        return false;
      });

      const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return {
        index: index + 1,
        user,
        assigned,
        completed,
        taskCount,
        overdueCount,
        rate,
        tasks: officerTasks,
      };
    });
  }, [tasks]);

  const topOfficer = useMemo(() => {
    const sorted = [...officerProgressRows].sort((a, b) => b.rate - a.rate);
    return sorted[0];
  }, [officerProgressRows]);

  const lowestOfficer = useMemo(() => {
    const sorted = [...officerProgressRows].sort((a, b) => a.rate - b.rate);
    return sorted.find(item => item.assigned > 0);
  }, [officerProgressRows]);
  const alertRows = rows
    .filter((row) => row.status !== 'completed' && (row.status === 'overdue' || row.task.priority === 'urgent' || getDaysRemaining(row.deadline) <= 3))
    .slice(0, 6);
  const recentActivities = rows.slice(0, 6).map((row, index) => ({
    id: row.task.id,
    time: index === 0 ? '09:15' : index === 1 ? '08:40' : index === 2 ? 'Hôm qua' : `${index + 7}:30`,
    text:
      row.status === 'completed'
        ? `${row.officerName} cập nhật hoàn thành việc "${row.task.title}"`
        : row.status === 'waiting'
          ? `${row.officerName} thêm ghi chú cần bổ sung hồ sơ "${row.task.title}"`
          : `${row.officerName} cập nhật tiến độ xử lý "${row.task.title}"`,
  }));
  const activeTitle = NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'Tổng quan';
  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (task: Task | Omit<Task, 'id' | 'createdAt'>) => {
    if ('id' in task) updateTask(task);
    else addTask(task);
  };

  const handleImportRows = (rowsToImport: TaskImportRow[]) => {
    importTaskRows(rowsToImport);
  };

  const addSchedule = () => {
    if (!newSchedule.time || !newSchedule.title.trim()) return;
    setScheduleItems((current) => [
      ...current,
      {
        id: `schedule-${Date.now()}`,
        time: newSchedule.time,
        title: newSchedule.title.trim(),
        location: newSchedule.location.trim() || 'Chưa nhập địa điểm',
      },
    ]);
    setNewSchedule({ time: '', title: '', location: '' });
  };

  const clearFilters = () => {
    setQueryName('');
    setQueryTaxCode('');
    setStatusFilter('all');
    setOfficerFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const visibleRows = filteredRows;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[286px] flex-col border-r border-blue-950/20 bg-[#082b63] text-white shadow-2xl lg:flex print:hidden">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-12 w-12 rounded-full bg-white p-1" />
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide">Thuế cơ sở 23</p>
              <p className="text-xs font-semibold text-blue-100">Hỗ trợ cá nhân HKD</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                activeSection === item.id
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-50/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon path={item.icon} className="h-5 w-5 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="m-4 rounded-xl border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Đơn vị sử dụng</p>
          <p className="mt-1 text-sm font-extrabold text-white">Tổ Quản lý hỗ trợ cá nhân hộ kinh doanh</p>
          <p className="mt-1 text-xs font-semibold text-blue-100">Hỗ trợ cá nhân & hộ kinh doanh nộp thuế</p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[286px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
          <div className="flex min-h-[72px] flex-col gap-3 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">Bảng điều hành</p>
              <h1 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                Điều hành công việc Tổ Hỗ trợ cá nhân Hộ kinh doanh Thuế cơ sở 23
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{activeTitle} - {todayLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-extrabold text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800"
              >
                <Icon path="M12 5v14M5 12h14" className="h-4 w-4" />
                Tạo chuyên đề mới
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Icon path="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" className="h-4 w-4" />
                In báo cáo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu?')) reset();
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Khôi phục mẫu
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  activeSection === item.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="min-w-0 space-y-5 px-4 py-5 sm:px-6">
          {/* Tiêu đề in ấn chuyên nghiệp */}
          <div className="hidden print:block mb-8 text-center border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between text-[11px] font-bold text-slate-800">
              <div className="text-center">
                <p>CHI CỤC THUẾ CƠ SỞ 23</p>
                <p className="font-extrabold uppercase">TỔ QUẢN LÝ HỖ TRỢ CÁ NHÂN HỘ KINH DOANH</p>
              </div>
              <div className="text-center">
                <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-extrabold border-b border-slate-600 pb-0.5">Độc lập - Tự do - Hạnh phúc</p>
              </div>
            </div>
            <h2 className="mt-8 text-lg font-extrabold text-slate-900 uppercase tracking-wide">
              Báo cáo tiến độ và Hiệu quả công tác Quản lý Hỗ trợ Hộ kinh doanh
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-600">Thời điểm lập báo cáo: {todayLabel}</p>
          </div>

          {(activeSection === 'overview' || activeSection === 'work') && (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
              <StatCard label="Tổng chuyên đề" value={stats.totalTasks} sub={`${stats.totalHouseholds.toLocaleString('vi-VN')} chỉ tiêu giao`} tone="blue" icon="M5 4h14v16H5zM9 8h6M9 12h6M9 16h4" />
              <StatCard label="Hoàn thành 100%" value={stats.completed} sub="Chuyên đề đã đạt chỉ tiêu" tone="green" icon="M20 6 9 17l-5-5" />
              <StatCard label="Đang thực hiện" value={stats.processing} sub={`Đạt ${stats.progress}% tổng chỉ tiêu`} tone="cyan" icon="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <StatCard label="Chuyên đề trễ hạn" value={stats.overdue} sub="Cần lãnh đạo chú ý đôn đốc" tone="red" icon="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <StatCard label="Sắp đến hạn" value={stats.upcoming} sub="Cần đẩy nhanh trong 3 ngày" tone="amber" icon="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v15H4V6a1 1 0 0 1 1-1Z" />
            </section>
          )}

          {activeSection === 'overview' && (
            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px] print:grid-cols-1">
              <div className="min-w-0 space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <SectionTitle eyebrow="Tiến độ chung" title="Tình hình chỉ tiêu trong kỳ" sub="Lãnh đạo xem nhanh tỷ lệ hoàn thành, thi đua và tiến độ cán bộ tổ." />
                    <button
                      type="button"
                      onClick={() => setActiveSection('officer-progress')}
                      className="rounded-lg border border-blue-100 px-3 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-50 no-print"
                    >
                      Xem tiến độ cán bộ
                    </button>
                  </div>
                  
                  <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] print:grid-cols-2">
                    <ProgressDonut stats={stats} />
                    
                    <div className="flex flex-col gap-4">
                      {/* Bảng ghi nhận thi đua cán bộ */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                          Ghi nhận thi đua Tổ Thuế
                        </h4>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-100 flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">Dẫn đầu tiến độ</p>
                              <p className="mt-1 text-sm font-extrabold text-slate-900">{topOfficer?.user.name}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">{getTeamName(topOfficer?.user.id)}</p>
                            </div>
                            <p className="mt-2 text-xs font-bold text-emerald-700">Đạt tỷ lệ: {topOfficer?.rate}%</p>
                          </div>
                          <div className="rounded-lg bg-red-50/70 p-3 border border-red-100 flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-extrabold uppercase tracking-wider text-red-800">Cần đôn đốc thêm</p>
                              <p className="mt-1 text-sm font-extrabold text-slate-900">{lowestOfficer?.user.name}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">{getTeamName(lowestOfficer?.user.id ?? '')}</p>
                            </div>
                            <p className="mt-2 text-xs font-bold text-red-700">Đang đạt: {lowestOfficer?.rate}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt thi đua nhanh */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex-1">
                        <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">
                          Xếp hạng thi đua nhanh
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {officerProgressRows.slice(0, 4).map((item, idx) => (
                            <div key={item.user.id} className="flex justify-between items-center text-xs font-semibold text-slate-600">
                              <span className="truncate">#{idx+1} {item.user.name}</span>
                              <span className="text-slate-900 font-bold shrink-0">{item.rate}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Hai biểu đồ phân tích khối lượng cột kép xếp chồng */}
                <div className="space-y-5">
                  <OfficerWorkloadChart tasks={tasks} />
                  <InitiativeProgressChart tasks={tasks} />
                </div>

                <PriorityWorkPanel rows={alertRows} onOpenWork={() => setActiveSection('work')} />
              </div>

              <aside className="min-w-0 space-y-5 print:hidden">
                <QuickFilterPanel
                  setActiveSection={setActiveSection}
                  setStatusFilter={setStatusFilter}
                  setOfficerFilter={setOfficerFilter}
                  clearFilters={clearFilters}
                />
                <ActivityPanel items={recentActivities} />
              </aside>
            </section>
          )}

          {activeSection === 'work' && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between print:hidden">
                <SectionTitle
                  eyebrow="Quản lý tiến độ"
                  title="Danh sách chuyên đề và Phân công chỉ tiêu cán bộ"
                  sub="Tìm kiếm chuyên đề, xem chi tiết phân công chỉ tiêu của từng cán bộ (chỉ tiêu giao, đã đạt, thời hạn xử lý cụ thể)."
                />
                
                <div className="inline-flex rounded-lg bg-slate-100 p-1 shadow-inner shrink-0">
                  <button
                    key="view-init"
                    type="button"
                    onClick={() => { setViewMode('initiative'); setExpandedRowId(null); }}
                    className={`rounded-md px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                      viewMode === 'initiative'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Xem theo Chuyên đề
                  </button>
                  <button
                    key="view-off"
                    type="button"
                    onClick={() => { setViewMode('officer'); setExpandedRowId(null); }}
                    className={`rounded-md px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                      viewMode === 'officer'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Xem theo Cán bộ
                  </button>
                </div>
              </div>
              
              <div className="border-b border-slate-200 p-5 print:hidden">
                <FilterBar
                  queryName={queryName}
                  setQueryName={setQueryName}
                  queryTaxCode={queryTaxCode}
                  setQueryTaxCode={setQueryTaxCode}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  officerFilter={officerFilter}
                  setOfficerFilter={setOfficerFilter}
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  clearFilters={clearFilters}
                />
              </div>

              <WorkTable
                viewMode={viewMode}
                rows={visibleRows}
                officerRows={officerRows}
                expandedRowId={expandedRowId}
                setExpandedRowId={setExpandedRowId}
                onEdit={openEditModal}
                onDetail={() => setShowDetailBoard((value) => !value)}
                onUpdateParticipantAssigned={updateParticipantAssigned}
                onUpdateParticipantCompleted={updateParticipantCompleted}
                onUpdateParticipantDeadline={updateParticipantDeadline}
              />

              {showDetailBoard && (
                <div className="border-t border-slate-200 print:hidden">
                  <TaskBoard
                    tasks={tasks}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onMoveParticipant={moveParticipant}
                    onUpdateParticipantAssigned={updateParticipantAssigned}
                    onUpdateParticipantCompleted={updateParticipantCompleted}
                    onUpdateTaskDeadline={updateTaskDeadline}
                    onUpdateParticipantDeadline={updateParticipantDeadline}
                  />
                </div>
              )}
            </section>
          )}

          {activeSection === 'officer-progress' && (
            <section className="min-w-0 space-y-5">
              <OfficerProgressPanel rows={officerProgressRows} full />
              <ChartsPanel tasks={tasks} />
            </section>
          )}

          {activeSection === 'reports' && (
            <section className="min-w-0 space-y-5">
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px] print:grid-cols-1">
                <div className="min-w-0 space-y-5">
                  <RankingPanel tasks={tasks} />
                  <div className="print:hidden">
                    <ChartsPanel tasks={tasks} />
                  </div>
                </div>
                <div className="min-w-0 space-y-5">
                  <TeamStatsPanel tasks={tasks} />
                  <div className="print:hidden">
                    <ReportExportPanel tasks={tasks} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'catalog' && (
            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px] print:grid-cols-1">
              <CatalogPanel />
              <div className="print:hidden">
                <SchedulePanel
                  scheduleItems={scheduleItems}
                  newSchedule={newSchedule}
                  setNewSchedule={setNewSchedule}
                  addSchedule={addSchedule}
                />
              </div>
            </section>
          )}

          {activeSection === 'settings' && (
            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px] print:grid-cols-1">
              <DataImportPanel onImportRows={handleImportRows} />
              <ReportExportPanel tasks={tasks} />
            </section>
          )}
        </main>
      </div>

      {activeSection !== 'settings' && (
        <div className="hidden">
          <DataImportPanel onImportRows={handleImportRows} />
        </div>
      )}

      <TaskFormModal isOpen={isModalOpen} task={editingTask} onClose={closeModal} onSubmit={handleSubmit} />
    </div>
  );
}

function FilterBar({
  queryName,
  setQueryName,
  queryTaxCode,
  setQueryTaxCode,
  statusFilter,
  setStatusFilter,
  officerFilter,
  setOfficerFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  clearFilters,
}: {
  queryName: string;
  setQueryName: (value: string) => void;
  queryTaxCode: string;
  setQueryTaxCode: (value: string) => void;
  statusFilter: WorkDisplayStatus | 'all';
  setStatusFilter: (value: WorkDisplayStatus | 'all') => void;
  officerFilter: string;
  setOfficerFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  clearFilters: () => void;
}) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr_0.9fr_0.9fr_auto]">
      <input
        value={queryName}
        onChange={(event) => setQueryName(event.target.value)}
        placeholder="Tìm chuyên đề nghiệp vụ..."
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <input
        value={queryTaxCode}
        onChange={(event) => setQueryTaxCode(event.target.value)}
        placeholder="Mã chuyên đề (CĐ-xx)"
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as WorkDisplayStatus | 'all')}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="all">Tất cả trạng thái</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select
        value={officerFilter}
        onChange={(event) => setOfficerFilter(event.target.value)}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="all">Tất cả cán bộ</option>
        {USERS.map((user) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </select>
      <input
        type="date"
        value={dateFrom}
        onChange={(event) => setDateFrom(event.target.value)}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        title="Từ ngày"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(event) => setDateTo(event.target.value)}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        title="Đến ngày"
      />
      <button
        type="button"
        onClick={clearFilters}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
      >
        Xóa lọc
      </button>
    </div>
  );
}

function WorkTable({
  viewMode,
  rows,
  officerRows,
  expandedRowId,
  setExpandedRowId,
  onEdit,
  onDetail,
  onUpdateParticipantAssigned,
  onUpdateParticipantCompleted,
  onUpdateParticipantDeadline,
}: {
  viewMode: 'initiative' | 'officer';
  rows: WorkRow[];
  officerRows: any[];
  expandedRowId: string | null;
  setExpandedRowId: (id: string | null) => void;
  onEdit: (task: Task) => void;
  onDetail: () => void;
  onUpdateParticipantAssigned: (taskId: string, userId: string, assigned: number) => void;
  onUpdateParticipantCompleted: (taskId: string, userId: string, completed: number) => void;
  onUpdateParticipantDeadline: (taskId: string, userId: string, deadline: string) => void;
}) {
  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  if (viewMode === 'officer') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">STT</th>
              <th className="px-4 py-3">Cán bộ quản lý</th>
              <th className="px-4 py-3">Tổ công tác</th>
              <th className="px-4 py-3 text-right">Số chuyên đề</th>
              <th className="px-4 py-3 text-right">Tổng chỉ tiêu giao</th>
              <th className="px-4 py-3 text-right">Đã hoàn thành</th>
              <th className="px-4 py-3 text-right">Tỷ lệ đạt</th>
              <th className="px-4 py-3 text-right print:hidden">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {officerRows.map((row) => {
              const isExpanded = expandedRowId === row.user.id;
              return (
                <optgroup key={row.user.id} className="contents">
                  <tr className={`hover:bg-blue-50/40 transition ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-4 py-4 font-bold text-slate-500">{row.index}</td>
                    <td className="px-4 py-4">
                      <p className="font-extrabold text-slate-900">{row.user.name}</p>
                      <p className="text-xs font-semibold text-slate-400">{row.user.role}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{getTeamName(row.user.id)}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-800">{row.taskCount} chuyên đề</td>
                    <td className="px-4 py-4 text-right font-extrabold text-blue-700">{row.assigned.toLocaleString('vi-VN')} HKD</td>
                    <td className="px-4 py-4 text-right font-extrabold text-emerald-700">{row.completed.toLocaleString('vi-VN')} HKD</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-extrabold text-slate-800">{row.rate}%</span>
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${row.rate >= 75 ? 'bg-emerald-600' : row.rate >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`} style={{ width: `${row.rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => toggleRow(row.user.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold shadow-sm transition ${
                          isExpanded ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isExpanded ? 'Thu gọn' : 'Chi tiết chỉ tiêu'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={8} className="p-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
                              Chỉ tiêu công tác chi tiết - Cán bộ {row.user.name}
                            </h5>
                            <span className="text-[10px] font-bold text-slate-500">
                              * Có thể thay đổi trực tiếp chỉ tiêu giao và kết quả đã đạt tại đây
                            </span>
                          </div>
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-600">
                              <tr>
                                <th className="px-3 py-2">Chuyên đề nghiệp vụ</th>
                                <th className="px-3 py-2 text-right">Chỉ tiêu giao (Hộ)</th>
                                <th className="px-3 py-2 text-right">Đã hoàn thành (Hộ)</th>
                                <th className="px-3 py-2 text-right">Tỷ lệ đạt</th>
                                <th className="px-3 py-2">Thời hạn hoàn thành</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {row.tasks.map((task: Task) => {
                                const p = task.participants.find((item) => item.userId === row.user.id)!;
                                const rate = p.assigned > 0 ? Math.round((p.completed / p.assigned) * 100) : p.progress;
                                return (
                                  <tr key={task.id} className="hover:bg-slate-50/80">
                                    <td className="px-3 py-2">
                                      <p className="font-extrabold text-slate-800">{task.title}</p>
                                      <p className="text-[10px] text-slate-400 max-w-[400px] truncate">{task.description}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        value={p.assigned}
                                        onChange={(e) => onUpdateParticipantAssigned(task.id, row.user.id, Number(e.target.value))}
                                        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        max={p.assigned}
                                        value={p.completed}
                                        onChange={(e) => onUpdateParticipantCompleted(task.id, row.user.id, Number(e.target.value))}
                                        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="font-extrabold text-slate-800">{rate}%</span>
                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                          <div className={`h-full rounded-full ${rate >= 75 ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${rate}%` }} />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="date"
                                        value={p.deadline}
                                        onChange={(e) => onUpdateParticipantDeadline(task.id, row.user.id, e.target.value)}
                                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </optgroup>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">STT</th>
            <th className="px-4 py-3">Chuyên đề nghiệp vụ</th>
            <th className="px-4 py-3">Mã chuyên đề</th>
            <th className="px-4 py-3">Nội dung nghiệp vụ / Mục tiêu</th>
            <th className="px-4 py-3">Cán bộ phụ trách</th>
            <th className="px-4 py-3">Hạn xử lý chung</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right print:hidden">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                Không có chuyên đề nghiệp vụ nào phù hợp bộ lọc.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const days = getDaysRemaining(row.deadline);
              const isExpanded = expandedRowId === row.task.id;
              return (
                <optgroup key={row.task.id} className="contents">
                  <tr className={`hover:bg-blue-50/40 transition ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-4 py-4 font-bold text-slate-500">{row.index}</td>
                    <td className="px-4 py-4">
                      <p className="font-extrabold text-slate-900">{row.householdName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {row.task.participants.length} cán bộ tham gia
                      </p>
                    </td>
                    <td className="px-4 py-4 font-bold text-blue-700">{row.taxCode}</td>
                    <td className="px-4 py-4">
                      <p className="max-w-[460px] truncate font-medium text-slate-600">
                        {row.content}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${row.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">
                      <div className="flex flex-wrap gap-1">
                        {row.task.participants.slice(0, 3).map((p) => {
                          const user = USERS.find((u) => u.id === p.userId);
                          return (
                            <span key={p.userId} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {user?.name.split(' ').pop()}
                            </span>
                          );
                        })}
                        {row.task.participants.length > 3 && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            +{row.task.participants.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-bold ${row.status === 'overdue' ? 'text-red-700' : days <= 3 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {formatDate(row.deadline)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {row.status === 'overdue' ? `Quá hạn ${Math.abs(days)} ngày` : days <= 3 ? `Còn ${Math.max(days, 0)} ngày` : 'Còn hạn'}
                      </p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-4 text-right print:hidden">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(row.task)}
                          className="rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-50 shadow-sm"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRow(row.task.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold shadow-sm transition ${
                            isExpanded ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isExpanded ? 'Thu gọn' : 'Phân công'}
                        </button>
                        <button
                          type="button"
                          onClick={onDetail}
                          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-blue-800 shadow-sm"
                        >
                          Kéo thả
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={8} className="p-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
                              Phân công chỉ tiêu chi tiết cán bộ - Chuyên đề {row.task.title}
                            </h5>
                            <span className="text-[10px] font-bold text-slate-500">
                              * Có thể thay đổi trực tiếp chỉ tiêu giao và kết quả đã đạt tại đây
                            </span>
                          </div>
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-600">
                              <tr>
                                <th className="px-3 py-2">Cán bộ</th>
                                <th className="px-3 py-2 text-right">Chỉ tiêu giao (Hộ)</th>
                                <th className="px-3 py-2 text-right">Đã hoàn thành (Hộ)</th>
                                <th className="px-3 py-2 text-right">Tỷ lệ đạt</th>
                                <th className="px-3 py-2">Thời hạn xử lý cá nhân</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {row.task.participants.map((p) => {
                                const user = USERS.find((item) => item.id === p.userId);
                                const rate = p.assigned > 0 ? Math.round((p.completed / p.assigned) * 100) : p.progress;
                                return (
                                  <tr key={p.userId} className="hover:bg-slate-50/80">
                                    <td className="px-3 py-2">
                                      <p className="font-extrabold text-slate-800">{user?.name}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold">{getTeamName(p.userId)}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        value={p.assigned}
                                        onChange={(e) => onUpdateParticipantAssigned(row.task.id, p.userId, Number(e.target.value))}
                                        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        max={p.assigned}
                                        value={p.completed}
                                        onChange={(e) => onUpdateParticipantCompleted(row.task.id, p.userId, Number(e.target.value))}
                                        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="font-extrabold text-slate-800">{rate}%</span>
                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                          <div className={`h-full rounded-full ${rate >= 75 ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${rate}%` }} />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="date"
                                        value={p.deadline}
                                        onChange={(e) => onUpdateParticipantDeadline(row.task.id, p.userId, e.target.value)}
                                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </optgroup>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function SchedulePanel({
  scheduleItems,
  newSchedule,
  setNewSchedule,
  addSchedule,
  compact = false,
}: {
  scheduleItems: ScheduleItem[];
  newSchedule: { time: string; title: string; location: string };
  setNewSchedule: React.Dispatch<React.SetStateAction<{ time: string; title: string; location: string }>>;
  addSchedule: () => void;
  compact?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="Lịch hỗ trợ" title="Lịch hỗ trợ người nộp thuế" sub="Ghi nhận lịch hỗ trợ, làm việc và tổng hợp tiến độ." />
      <div className={`mt-4 grid gap-3 ${compact ? '' : 'md:grid-cols-[140px_1fr_1fr_auto]'}`}>
        <input
          type="time"
          value={newSchedule.time}
          onChange={(event) => setNewSchedule((current) => ({ ...current, time: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <input
          value={newSchedule.title}
          onChange={(event) => setNewSchedule((current) => ({ ...current, title: event.target.value }))}
          placeholder="Nội dung lịch hỗ trợ"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <input
          value={newSchedule.location}
          onChange={(event) => setNewSchedule((current) => ({ ...current, location: event.target.value }))}
          placeholder="Địa điểm / ghi chú"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button type="button" onClick={addSchedule} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800">
          Thêm lịch
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {scheduleItems.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <span className="shrink-0 rounded-lg bg-blue-100 px-2.5 py-1 text-sm font-extrabold text-blue-700">{item.time}</span>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
