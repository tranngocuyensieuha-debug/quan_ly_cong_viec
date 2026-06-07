import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import type { Task } from '../types';
import { USERS } from '../data/seed';

interface OfficerWorkloadChartProps {
  tasks: Task[];
}

export default function OfficerWorkloadChart({ tasks }: OfficerWorkloadChartProps) {
  const data = USERS.map((user) => {
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
      'Cần thực hiện': assigned,
      'Đã thực hiện': completed,
    };
  });

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            So sánh khối lượng công việc thực tế theo cán bộ
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            So sánh tổng chỉ tiêu hộ kinh doanh được giao (Cần thực hiện) và kết quả đã thực hiện của từng công chức.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="min-w-[1000px] pr-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 24, right: 10, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontWeight: 700, fill: '#334155', paddingBottom: 16 }}
              />
              <Bar dataKey="Cần thực hiện" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList
                  dataKey="Cần thực hiện"
                  position="top"
                  style={{ fill: '#1e293b', fontSize: 9, fontWeight: 700 }}
                  formatter={(v: any) => (v > 0 ? Number(v).toLocaleString('vi-VN') : '')}
                />
              </Bar>
              <Bar dataKey="Đã thực hiện" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList
                  dataKey="Đã thực hiện"
                  position="top"
                  style={{ fill: '#064e3b', fontSize: 9, fontWeight: 700 }}
                  formatter={(v: any) => (v > 0 ? Number(v).toLocaleString('vi-VN') : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  );
}
