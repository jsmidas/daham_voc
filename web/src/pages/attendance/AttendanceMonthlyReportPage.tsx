/**
 * Attendance Monthly Report Page
 * @description 월별 근태 리포트 - 직원별 월간 출퇴근 집계
 */

import { useState } from 'react';
import {
  Table,
  Card,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Typography,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyReport } from '@/api/attendance.api';
import type { MonthlyReportEmployee } from '@/api/attendance.api';
import { getSitesLight } from '@/api/site.api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

const { Title } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  NORMAL: { label: '정상', color: 'green' },
  LATE: { label: '지각', color: 'orange' },
  EARLY_LEAVE: { label: '조퇴', color: 'gold' },
  OUTSIDE_RANGE: { label: '범위밖', color: 'volcano' },
};

export default function AttendanceMonthlyReportPage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [siteFilter, setSiteFilter] = useState<string | undefined>();

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['monthly-report', month.format('YYYY-MM'), siteFilter],
    queryFn: async () => {
      const res = await getMonthlyReport(month.format('YYYY-MM'), siteFilter);
      return res.data;
    },
  });

  const { data: sitesRes } = useQuery({
    queryKey: ['sites-light'],
    queryFn: async () => {
      const res = await getSitesLight({ isActive: true });
      return res.data;
    },
  });

  const employees: MonthlyReportEmployee[] = reportRes?.employees || [];
  const totalWeekdays = reportRes?.totalWeekdays || 0;
  const sites = sitesRes || [];

  const handleDownloadExcel = () => {
    if (employees.length === 0) return;

    // 요약 시트
    const summaryData = employees.map((emp) => ({
      이름: emp.user.name,
      사업장: emp.site?.name || '-',
      출근일수: emp.summary.totalWorkDays,
      정상: emp.summary.normalCount,
      지각: emp.summary.lateCount,
      조퇴: emp.summary.earlyLeaveCount,
      범위밖: emp.summary.outsideRangeCount,
      결근: emp.summary.absentCount,
      '총 평일': totalWeekdays,
    }));

    // 상세 시트
    const detailData: any[] = [];
    employees.forEach((emp) => {
      emp.dailyRecords.forEach((record) => {
        detailData.push({
          이름: emp.user.name,
          사업장: emp.site?.name || '-',
          날짜: record.date,
          상태: statusConfig[record.status]?.label || record.status,
          출근: record.checkInTime
            ? dayjs(record.checkInTime).format('HH:mm:ss')
            : '-',
          퇴근: record.checkOutTime
            ? dayjs(record.checkOutTime).format('HH:mm:ss')
            : '-',
          '휴게시작': record.breakStartTime
            ? dayjs(record.breakStartTime).format('HH:mm')
            : '-',
          '휴게종료': record.breakEndTime
            ? dayjs(record.breakEndTime).format('HH:mm')
            : '-',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, ws1, '월별요약');
    XLSX.utils.book_append_sheet(wb, ws2, '일별상세');
    XLSX.writeFile(wb, `근태리포트_${month.format('YYYY-MM')}.xlsx`);
  };

  // 요약 테이블 컬럼
  const columns = [
    {
      title: '이름',
      dataIndex: ['user', 'name'],
      key: 'name',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: '사업장',
      key: 'site',
      width: 150,
      render: (_: any, record: MonthlyReportEmployee) =>
        record.site?.name || '-',
    },
    {
      title: '출근일수',
      dataIndex: ['summary', 'totalWorkDays'],
      key: 'totalWorkDays',
      width: 90,
      render: (v: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {v} / {totalWeekdays}
        </span>
      ),
    },
    {
      title: '정상',
      dataIndex: ['summary', 'normalCount'],
      key: 'normalCount',
      width: 70,
      render: (v: number) =>
        v > 0 ? <Tag color="green">{v}</Tag> : <span>0</span>,
    },
    {
      title: '지각',
      dataIndex: ['summary', 'lateCount'],
      key: 'lateCount',
      width: 70,
      render: (v: number) =>
        v > 0 ? <Tag color="orange">{v}</Tag> : <span>0</span>,
    },
    {
      title: '조퇴',
      dataIndex: ['summary', 'earlyLeaveCount'],
      key: 'earlyLeaveCount',
      width: 70,
      render: (v: number) =>
        v > 0 ? <Tag color="gold">{v}</Tag> : <span>0</span>,
    },
    {
      title: '범위밖',
      dataIndex: ['summary', 'outsideRangeCount'],
      key: 'outsideRangeCount',
      width: 70,
      render: (v: number) =>
        v > 0 ? <Tag color="volcano">{v}</Tag> : <span>0</span>,
    },
    {
      title: '결근',
      dataIndex: ['summary', 'absentCount'],
      key: 'absentCount',
      width: 70,
      render: (v: number) =>
        v > 0 ? <Tag color="red">{v}</Tag> : <span>0</span>,
    },
  ];

  // 일별 상세 컬럼 (확장 행)
  const dailyColumns = [
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => {
        const d = dayjs(date);
        const dayOfWeek = d.day();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        return (
          <span style={{ color: isWeekend ? '#ff4d4f' : undefined }}>
            {d.format('MM/DD (ddd)')}
          </span>
        );
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const config = statusConfig[status] || {
          label: status,
          color: 'default',
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '출근',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 100,
      render: (time: string) => (time ? dayjs(time).format('HH:mm:ss') : '-'),
    },
    {
      title: '퇴근',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 100,
      render: (time: string | null) =>
        time ? dayjs(time).format('HH:mm:ss') : '-',
    },
    {
      title: '휴게시간',
      key: 'breakTime',
      width: 120,
      render: (_: any, record: any) => {
        if (record.breakStartTime && record.breakEndTime) {
          return `${dayjs(record.breakStartTime).format('HH:mm')} ~ ${dayjs(record.breakEndTime).format('HH:mm')}`;
        }
        return '-';
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>월별 근태 리포트</Title>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <DatePicker
            picker="month"
            value={month}
            onChange={(v) => v && setMonth(v)}
            allowClear={false}
          />
          <Select
            placeholder="사업장 전체"
            allowClear
            style={{ width: 200 }}
            value={siteFilter}
            onChange={setSiteFilter}
            options={sites.map((s: any) => ({
              value: s.id,
              label: s.name,
            }))}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadExcel}
            disabled={employees.length === 0}
          >
            엑셀 다운로드
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={employees}
          rowKey={(record) => record.user.id}
          loading={isLoading}
          pagination={false}
          size="middle"
          expandable={{
            expandedRowRender: (record: MonthlyReportEmployee) => (
              <Table
                columns={dailyColumns}
                dataSource={record.dailyRecords}
                rowKey="date"
                pagination={false}
                size="small"
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
