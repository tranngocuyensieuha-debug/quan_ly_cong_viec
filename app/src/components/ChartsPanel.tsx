import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Task } from '../types';
import { TEAMS, USERS } from '../data/seed';

interface ChartsPanelProps {
  tasks: Task[];
}

const TEAM_COLORS = ['#2563eb', '#059669'];

function buildOfficerAssignedData(tasks: Task[]) {
  return USERS.map((user) => {
    const assigned = tasks.reduce((total, task) => {
      const participant = task.participants.find((item) => item.userId === user.id);
      return total + (participant?.assigned ?? 0);
    }, 0);
    const completed = tasks.reduce((total, task) => {
      const participant = task.participants.find((item) => item.userId === user.id);
      return total + (participant?.completed ?? 0);
    }, 0);

    return {
      name: user.name,
      assigned,
      completed,
      remaining: Math.max(0, assigned - completed),
    };
  });
}

function buildTeamAssignedData(tasks: Task[]) {
  return TEAMS.map((team) => {
    const userIds = USERS.filter((user) => user.teamId === team.id).map((user) => user.id);
    const assigned = tasks.reduce(
      (teamTotal, task) =>
        teamTotal +
        task.participants.reduce(
          (taskTotal, participant) =>
            userIds.includes(participant.userId) ? taskTotal + participant.assigned : taskTotal,
          0,
        ),
      0,
    );

    return {
      name: team.name,
      assigned,
    };
  });
}

export default function ChartsPanel({ tasks }: ChartsPanelProps) {
  const officerAssignedData = buildOfficerAssignedData(tasks);
  const teamAssignedData = buildTeamAssignedData(tasks);

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)]">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            So sánh phải thực hiện theo cán bộ
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Xanh: đã thực hiện, xám: còn lại
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <ResponsiveContainer width="100%" height={410}>
              <BarChart data={officerAssignedData} margin={{ top: 28, right: 24, left: 12, bottom: 88 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Đã thực hiện" stackId="assigned" fill="#2563eb">
                  <LabelList
                    dataKey="completed"
                    position="insideTop"
                    formatter={(value: unknown) => Number(value ?? 0).toLocaleString('vi-VN')}
                    className="fill-white text-[10px] font-bold"
                  />
                </Bar>
                <Bar dataKey="remaining" name="Còn lại" stackId="assigned" fill="#cbd5e1" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="assigned"
                    position="top"
                    formatter={(value: unknown) => Number(value ?? 0).toLocaleString('vi-VN')}
                    className="fill-slate-700 text-[10px] font-bold"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          Tổng phải thực hiện theo tổ
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={teamAssignedData}
              dataKey="assigned"
              nameKey="name"
              cx="50%"
              cy="46%"
              innerRadius={58}
              outerRadius={100}
              paddingAngle={3}
              label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
            >
              {teamAssignedData.map((entry, index) => (
                <Cell key={entry.name} fill={TEAM_COLORS[index % TEAM_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
            <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-2 space-y-2">
          {teamAssignedData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TEAM_COLORS[index % TEAM_COLORS.length] }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 font-bold text-slate-900">{item.assigned.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
