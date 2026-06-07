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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Thống kê nhiệm vụ theo tổ</h2>
        <span className="text-xs font-semibold text-slate-500">{TEAMS.length} tổ quản lý</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {stats.map((item) => (
          <div key={item.team.id} className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.team.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.userCount} cán bộ quản lý trong 13 nhiệm vụ</p>
              </div>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                {item.progress}%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded bg-white p-2">
                <p className="font-bold text-slate-900">{item.taskCount}</p>
                <p className="text-slate-500">Nhiệm vụ</p>
              </div>
              <div className="rounded bg-white p-2">
                <p className="font-bold text-emerald-700">{item.done}</p>
                <p className="text-slate-500">Hoàn thành</p>
              </div>
              <div className="rounded bg-white p-2">
                <p className="font-bold text-red-700">{item.overdue}</p>
                <p className="text-slate-500">Quá hạn</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-700" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
