/**
 * Attendance List Page
 * @description 근태 관리 페이지
 */

import { useState } from 'react';
import {
  Table,
  Space,
  Select,
  DatePicker,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getAttendances } from '@/api/attendance.api';
import { getSites } from '@/api/site.api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export default function AttendanceListPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [siteFilter, setSiteFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // 사업장 목록 조회
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites({}),
  });

  // 출퇴근 목록 조회
  const { data: attendances, isLoading } = useQuery({
    queryKey: [
      'attendances',
      {
        siteId: siteFilter,
        status: statusFilter,
        dateFrom: dateRange[0].format('YYYY-MM-DD'),
        dateTo: dateRange[1].format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      getAttendances({
        siteId: siteFilter,
        status: statusFilter,
        dateFrom: dateRange[0].format('YYYY-MM-DD'),
        dateTo: dateRange[1].format('YYYY-MM-DD'),
      }),
  });

  // 통계 계산
  const stats = {
    total: attendances?.data?.length || 0,
    normal: attendances?.data?.filter((a: any) => a.status === 'NORMAL').length || 0,
    late: attendances?.data?.filter((a: any) => a.status === 'LATE').length || 0,
    earlyLeave:
      attendances?.data?.filter((a: any) => a.status === 'EARLY_LEAVE').length || 0,
    outsideRange:
      attendances?.data?.filter((a: any) => a.status === 'OUTSIDE_RANGE').length || 0,
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'EARLY_LEAVE':
        return 'orange';
      case 'OUTSIDE_RANGE':
        return 'error';
      case 'ABSENT':
        return 'default';
      default:
        return 'default';
    }
  };

  // 상태별 한글
  const getStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return '정상';
      case 'LATE':
        return '지각';
      case 'EARLY_LEAVE':
        return '조퇴';
      case 'OUTSIDE_RANGE':
        return '범위 밖';
      case 'ABSENT':
        return '결근';
      default:
        return status;
    }
  };

  // 근무 시간 계산
  const calculateWorkHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return '-';
    const start = dayjs(checkIn);
    const end = dayjs(checkOut);
    const hours = end.diff(start, 'hour', true);
    return `${hours.toFixed(1)}시간`;
  };

  const columns = [
    {
      title: '직원명',
      dataIndex: ['user', 'name'],
      key: 'userName',
      width: 100,
    },
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'siteName',
      width: 150,
    },
    {
      title: '체크인',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '체크아웃',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 150,
      render: (time?: string) =>
        time ? dayjs(time).format('MM-DD HH:mm') : <Tag>근무 중</Tag>,
    },
    {
      title: '근무시간',
      key: 'workHours',
      width: 100,
      render: (_: any, record: any) =>
        calculateWorkHours(record.checkInTime, record.checkOutTime),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '비고',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note?: string) => note || '-',
    },
  ];

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>근태 관리</h1>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 기록"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="정상"
              value={stats.normal}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지각"
              value={stats.late}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="조퇴"
              value={stats.earlyLeave}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 필터 */}
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
          format="YYYY-MM-DD"
        />
        <Select
          placeholder="사업장 선택"
          style={{ width: 200 }}
          allowClear
          onChange={setSiteFilter}
          value={siteFilter}
          loading={!sites}
        >
          {sites?.data?.sites?.map((site: any) => (
            <Select.Option key={site.id} value={site.id}>
              {site.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          style={{ width: 150 }}
          allowClear
          onChange={setStatusFilter}
          value={statusFilter}
        >
          <Select.Option value="NORMAL">정상</Select.Option>
          <Select.Option value="LATE">지각</Select.Option>
          <Select.Option value="EARLY_LEAVE">조퇴</Select.Option>
          <Select.Option value="OUTSIDE_RANGE">범위 밖</Select.Option>
          <Select.Option value="ABSENT">결근</Select.Option>
        </Select>
      </Space>

      {/* 출퇴근 목록 */}
      <Table
        columns={columns}
        dataSource={attendances?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}
