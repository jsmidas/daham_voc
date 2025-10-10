/**
 * Dashboard Page
 * @description 대시보드 페이지
 */

import { Row, Col, Card, Statistic, DatePicker, Spin } from 'antd';
import {
  ShopOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/api/dashboard.api';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: () =>
      getDashboardSummary(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      ),
    retry: false,
  });

  const handleDateChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large">
          <div style={{ padding: '50px' }}>로딩 중...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div>
      {/* 제목과 날짜 선택 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>대시보드</h1>
        <RangePicker value={dateRange} onChange={handleDateChange} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 사업장"
              value={summary?.data?.totalSites || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="총 VOC"
              value={summary?.data?.totalFeedbacks || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="미처리 VOC"
              value={summary?.data?.pendingFeedbacks || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="평균 별점"
              value={summary?.data?.avgRating || 0}
              precision={1}
              suffix="/ 5.0"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="출퇴근 현황">
            <Statistic
              title="총 출근 기록"
              value={summary?.data?.totalAttendances || 0}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="정상 출근"
                value={summary?.data?.normalAttendances || 0}
                valueStyle={{ color: '#3f8600' }}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="지각"
                value={summary?.data?.lateAttendances || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="VOC 처리 현황">
            <Statistic
              title="완료된 VOC"
              value={summary?.data?.resolvedFeedbacks || 0}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="대기 중인 VOC"
                value={summary?.data?.pendingFeedbacks || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
