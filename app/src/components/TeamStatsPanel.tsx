import { TEAMS, USERS } from '../data/seed';
import type { Task } from '../types';
import { getDeadlineStatus } from '../utils/deadline';

interface TeamStatsPanelProps {
  tasks: Task[];
}

function getTeamTaskProgress(task: Task, userIds: string[]): number {
  const participants = task.participants.filter((participant) => userIds.includes(participant.userId));
  if (participants.length === 0) return 0;
  const total = participants.reduce((sum, participant) => sum + participant.progress, 0);
  return Math.round(total / participants.length);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function TeamStatsPanel({ tasks }: TeamStatsPanelProps) {
  const stats = TEAMS.map((team) => {
    const teamUsers = USERS.filter((user) => user.teamId === team.id);
    const userIds = teamUsers.map((user) => user.id);
    const teamProgressByTask = tasks.map((task) => getTeamTaskProgress(task, userIds));
    const done = teamProgressByTask.filter((progress) => progress >= 100).length;
    const overdue = tasks.filter(
      (task, index) => teamProgressByTask[index] < 100 && getDeadlineStatus(task.deadline) === 'overdue',
    ).length;

    return {
      team,
      taskCount: tasks.length,
      userCount: teamUsers.length,
      done,
      overdue,
      progress: average(teamProgressByTask),
    };
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Đánh giá hiệu quả theo Tổ công tác</h2>
          <p className="text-xs text-slate-500">So sánh tiến độ thực hiện chỉ tiêu giữa các Tổ hỗ trợ.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {TEAMS.length} tổ công tác
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((item) => (
          <div key={item.team.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{item.team.name}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {item.userCount} cán bộ phụ trách {item.taskCount} chuyên đề
                </p>
              </div>
              <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                {item.progress}% đạt
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-white p-2 border border-slate-100">
                <p className="font-extrabold text-slate-900">{item.taskCount}</p>
                <p className="text-[10px] font-bold text-slate-500">Chuyên đề</p>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-100">
                <p className="font-extrabold text-emerald-700">{item.done}</p>
                <p className="text-[10px] font-bold text-slate-500">Hoàn thành</p>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-100">
                <p className="font-extrabold text-red-600">{item.overdue}</p>
                <p className="text-[10px] font-bold text-slate-500">Trễ hạn</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
