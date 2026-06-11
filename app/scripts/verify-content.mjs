import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const filesToScan = [
  'src/types/index.ts',
  'src/data/seed.ts',
  'src/components/Dashboard.tsx',
  'src/components/DataImportPanel.tsx',
  'src/components/TaskBoard.tsx',
  'src/components/TaskCard.tsx',
  'src/components/TaskFormModal.tsx',
  'src/components/ChartsPanel.tsx',
  'src/components/OfficerWorkloadChart.tsx',
  'src/components/InitiativeProgressChart.tsx',
  'src/components/SummaryCards.tsx',
  'src/components/RankingPanel.tsx',
  'src/components/ReportExportPanel.tsx',
  'src/components/TeamStatsPanel.tsx',
  'src/utils/importData.ts',
  'src/utils/reportExport.ts',
  'src/utils/ranking.ts',
  'src/utils/statistics.ts',
  'src/utils/storage.ts',
];

for (const file of filesToScan) {
  assert.equal(existsSync(join(root, file)), true, `Missing file: ${file}`);
}
assert.equal(existsSync(join(root, 'public/mau-tong-hop.xlsx')), true, 'Missing summary import template workbook');

const read = (file) => readFileSync(join(root, file), 'utf8');
const combined = filesToScan.map(read).join('\n');
const dashboard = read('src/components/Dashboard.tsx');
const taskBoard = read('src/components/TaskBoard.tsx');
const taskCard = read('src/components/TaskCard.tsx');
const taskForm = read('src/components/TaskFormModal.tsx');
const charts = read('src/components/ChartsPanel.tsx');
const officerWorkloadChart = read('src/components/OfficerWorkloadChart.tsx');
const initiativeProgressChart = read('src/components/InitiativeProgressChart.tsx');
const seed = read('src/data/seed.ts');
const types = read('src/types/index.ts');
const importPanel = read('src/components/DataImportPanel.tsx');
const exportPanel = read('src/components/ReportExportPanel.tsx');
const importData = read('src/utils/importData.ts');
const reportExport = read('src/utils/reportExport.ts');
const rankingPanel = read('src/components/RankingPanel.tsx');
const rankingUtils = read('src/utils/ranking.ts');
const teamStatsPanel = read('src/components/TeamStatsPanel.tsx');

for (const requiredText of [
  'Excel',
  'Drive',
  'Phải thực hiện',
  'Đã thực hiện',
  'Sửa số chỉ tiêu giao',
  'So sánh phải thực hiện theo cán bộ',
  'Xanh: đã thực hiện, xám: còn lại',
  'Còn lại',
  'Tổng phải thực hiện theo tổ',
  'Bảng quản lý',
  'Quản lý công việc',
  'Cán bộ quản lý và địa bàn',
  'Tên cán bộ quản lý',
  'Địa bàn xã cũ',
  'Địa bàn xã mới',
  'Tổ quản lý',
  'mau-tong-hop.xlsx',
  'Tải file Excel mẫu',
  'xã An Khánh (hết hiệu lực)',
  'thị trấn Trạm Trôi (hết hiệu lực)',
  'xã Hoài Đức',
  'xã Dương Hòa',
  'Tổ Quản lý hỗ trợ cá nhân hộ kinh doanh số 2',
  'Chọn địa bàn xã cũ',
  'Chọn địa bàn xã mới',
  'CATALOG_STORAGE_KEY',
  'So sánh 2 tổ',
  'Tỷ trọng tổng phải thực hiện',
  'Nhiệm vụ từng tổ',
  'buildTeamTaskData',
]) {
  assert.equal(combined.includes(requiredText), true, `Missing required text: ${requiredText}`);
}

assert.equal(combined.includes('Bảng điều hành'), false, 'UI must use Bảng quản lý instead of Bảng điều hành');
assert.equal(combined.includes('Điều hành công việc'), false, 'UI title must use Quản lý công việc instead of Điều hành công việc');
assert.equal(dashboard.includes('4 cột xử lý'), false, 'Dashboard must not describe 4 Kanban columns');
assert.equal(taskBoard.includes('STATUS_ORDER'), false, 'Task board must not render status columns');
assert.equal(taskBoard.includes('TaskColumn'), false, 'Task board must not use TaskColumn');
assert.equal(taskCard.includes('STATUS_LABELS'), false, 'Task cards must not show status choices');
assert.equal(taskForm.includes('STATUS_LABELS'), false, 'Task form must not show status choices');
assert.equal(charts.includes('countByStatus'), false, 'Charts must not use status-column chart');
assert.equal(charts.includes('buildOfficerAssignedData'), true, 'Charts must compare assigned totals by officer');
assert.equal(charts.includes('buildTeamAssignedData'), true, 'Charts must compare team assigned totals');
assert.equal(charts.includes('BarChart'), true, 'Charts must include a bar chart');
assert.equal(charts.includes('PieChart'), true, 'Charts must include a pie chart');
assert.equal(charts.includes('dataKey="assigned"'), true, 'Team pie chart must use assigned totals');
assert.equal(charts.includes('dataKey="completed"'), true, 'Officer chart must show completed quantity');
assert.equal(charts.includes('dataKey="remaining"'), true, 'Officer chart must show remaining quantity');
assert.equal(charts.includes('stackId="assigned"'), true, 'Officer chart must stack completed and remaining in one column');
assert.equal(charts.includes('buildTeamTaskData'), true, 'Charts must build task distribution by team');
assert.equal(charts.includes('TASK_COLORS'), true, 'Team task pie charts must use task slice colors');
assert.equal((charts.match(/<PieChart>/g) || []).length >= 2, true, 'Charts panel must include team comparison and team task pie charts');
assert.equal(officerWorkloadChart.includes('remaining: Math.max(0, assigned - completed)'), true, 'Officer workload chart must calculate remaining quantity');
assert.equal(officerWorkloadChart.includes('stackId="assigned"'), true, 'Officer workload chart must stack completed and remaining in one column');
assert.equal(officerWorkloadChart.includes('dataKey="remaining"'), true, 'Officer workload chart must render remaining quantity');
assert.equal(officerWorkloadChart.includes('dataKey="Cần thực hiện"'), false, 'Officer workload chart must not render assigned as a separate bar');
assert.equal(initiativeProgressChart.includes('remaining: Math.max(0, assigned - completed)'), true, 'Initiative progress chart must calculate remaining quantity');
assert.equal(initiativeProgressChart.includes('stackId="assigned"'), true, 'Initiative progress chart must stack completed and remaining in one column');
assert.equal(initiativeProgressChart.includes('dataKey="remaining"'), true, 'Initiative progress chart must render remaining quantity');
assert.equal(initiativeProgressChart.includes('dataKey="Tổng chỉ tiêu giao"'), false, 'Initiative progress chart must not render assigned as a separate bar');
assert.equal(charts.includes('task: task.title'), false, 'Officer chart must not group by task title');
assert.equal(seed.includes('TASK_TEMPLATES.map'), true, 'Seed tasks must be generated from 13 task templates');
assert.equal(seed.includes('buildParticipants'), true, 'Each seed task must include all participants');
assert.equal(seed.includes('EXCEL_PARTICIPANT_DATA'), true, 'Seed data must include imported Excel participant data');
assert.equal(seed.includes("deadline: '2026-10-06'"), true, 'Seed data must use Excel deadline');
assert.equal(seed.includes("'user-01': { assigned: 15, completed: 12"), true, 'Seed data must include Excel values for user-01');
assert.equal(seed.includes("'user-14': { assigned: 28, completed: 6"), true, 'Seed data must include Excel values for user-14');
assert.equal((seed.match(/title: '/g) || []).length, 13, 'Seed data must contain 13 task templates');
assert.equal((seed.match(/id: 'user-/g) || []).length, 14, 'Seed data must contain 14 users');
assert.equal(seed.includes("teamId: 'all-teams'"), true, 'Seed tasks must be shared by both teams');
assert.equal(types.includes('TaskImportRow'), true, 'Import row type must exist');
assert.equal(taskCard.includes('onUpdateParticipantAssigned'), true, 'Task cards must allow editing assigned quantity');
assert.equal(taskCard.includes('onUpdateParticipantCompleted'), true, 'Task cards must allow editing completed quantity');
assert.equal(taskCard.includes('onUpdateParticipantDeadline'), true, 'Task cards must allow editing participant deadline');
assert.equal(taskCard.includes('max={participant.assigned}'), true, 'Completed input must be capped by assigned quantity');
assert.equal(dashboard.includes('updateParticipantAssigned'), true, 'Dashboard must wire assigned updates');
assert.equal(importPanel.includes('<svg'), true, 'Import panel must use icons');
assert.equal(exportPanel.includes('<svg'), true, 'Report export panel must use icons');
assert.equal(importData.includes('parseExcelFile'), true, 'Excel drag/drop parser must exist');
assert.equal(importData.includes('parseExcelFromUrl'), true, 'Google Drive import parser must exist');
assert.equal(reportExport.includes('exportTaskReport'), true, 'Excel report export function must exist');
assert.equal(reportExport.includes('json_to_sheet'), true, 'Report export must create an Excel worksheet');
assert.equal(reportExport.includes('Thời hạn cá nhân'), true, 'Report export must include participant deadline');
assert.equal(rankingPanel.includes('TEAMS'), true, 'Ranking table must show officer team');
assert.equal(rankingPanel.includes('criterion.name'), true, 'Ranking columns must use full criterion names');
assert.equal(rankingUtils.includes('calculateOfficerRankings'), true, 'Ranking utility must calculate officer rankings');
assert.equal(rankingUtils.includes('criterion: 8'), true, 'Ranking must include 8 criteria');
assert.equal(teamStatsPanel.includes('PieChart'), true, 'Team stats panel must include a pie chart');
assert.equal(teamStatsPanel.includes('dataKey="assigned"'), true, 'Team comparison pie chart must use assigned totals');
assert.equal(teamStatsPanel.includes('TEAM_COLORS'), true, 'Team comparison pie chart must use distinct team colors');

console.log('Content verification passed.');
