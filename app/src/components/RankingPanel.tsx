import { TEAMS, USERS } from '../data/seed';
import type { Task } from '../types';
import { calculateOfficerRankings } from '../utils/ranking';

interface RankingPanelProps {
  tasks: Task[];
}

export default function RankingPanel({ tasks }: RankingPanelProps) {
  const rankings = calculateOfficerRankings(tasks, USERS);
  const criteria = rankings[0]?.criteria ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">Xếp hạng cán bộ</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tính điểm tất cả cán bộ theo 8 tiêu chí tại sheet Tổng hợp.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {rankings.length} cán bộ
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1480px] w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-bold">Hạng</th>
              <th className="px-3 py-2 font-bold">Cán bộ quản lý</th>
              <th className="px-3 py-2 font-bold">Tổ</th>
              <th className="px-3 py-2 text-right font-bold">Tổng điểm</th>
              {criteria.map((criterion) => (
                <th key={criterion.criterion} className="min-w-32 px-2 py-2 text-right font-bold">
                  {criterion.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankings.map((ranking) => {
              const user = USERS.find((item) => item.id === ranking.userId);
              const team = TEAMS.find((item) => item.id === user?.teamId);

              return (
                <tr key={ranking.userId} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold text-slate-700">#{ranking.rank}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{ranking.userName}</td>
                  <td className="px-3 py-2 text-slate-600">{team?.name ?? ''}</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700">{ranking.totalScore}</td>
                  {ranking.criteria.map((criterion) => (
                    <td key={criterion.criterion} className="px-2 py-2 text-right text-slate-600">
                      <span className="font-semibold">{criterion.score}</span>
                      <span className="ml-1 text-slate-400">({criterion.rate}%)</span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
