/**
 * Attendance Dashboard Page
 * @description 출퇴근 대시보드 - 오늘 출근/지각/미출근 현황
 */

import { Table, Card, Statistic, Row, Col, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/attendance.api';
import type { DashboardUser } from '@/api/attendance.api';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  CHECKED_IN: { label: '출근', color: 'green' },
  LATE: { label: '지각', color: 'orange' },
  NOT_CHECKED_IN: { label: '미출근', color: 'red' },
  EARLY_LEAVE: { label: '조퇴', color: 'gold' },
  CHECKED_OUT: { label: '퇴근', color: 'blue' },
  OUTSIDE_RANGE: { label: '범위밖', color: 'volcano' },
};

export default function AttendanceDashboardPage() {
  const { data: dashboardRes, isLoading } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: () => getDashboard(),
    refetchInterval: 30000,
  });

  const summary = dashboardRes?.data?.summary;
  const users: DashboardUser[] = dashboardRes?.data?.users || [];

  const columns = [
    {
      title: '이름',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '사업장',
      dataIndex: 'siteName',
      key: 'siteName',
      width: 150,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '출근 시간',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 120,
      render: (time: string | null) =>
        time ? dayjs(time).format('HH:mm:ss') : '-',
    },
    {
      title: '퇴근 시간',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 120,
      render: (time: string | null) =>
        time ? dayjs(time).format('HH:mm:ss') : '-',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>출퇴근 대시보드 - {dayjs().format('YYYY년 MM월 DD일 (ddd)')}</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="전체"
              value={summary?.total || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="출근"
              value={summary?.checkedIn || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="지각"
              value={summary?.late || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="미출근"
              value={summary?.notCheckedIn || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="퇴근"
              value={summary?.checkedOut || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LogoutOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="조퇴"
              value={summary?.earlyLeave || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="직원별 출퇴근 현황" extra={<span style={{ color: '#999', fontSize: 12 }}>30초마다 자동 갱신</span>}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="userId"
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
