/**
 * Dashboard Page
 * @description 대시보드 페이지
 */

import { Row, Col, Card, Statistic, DatePicker, Spin, Button } from 'antd';
import {
  ShopOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardAll } from '@/api/dashboard.api';
import { getUnassignedSites } from '@/api/site.api';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-all', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: () =>
      getDashboardAll(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      ),
    retry: false,
  });

  const summary = dashboardData ? { data: dashboardData.data?.summary } : undefined;
  const vocTrend = dashboardData ? { data: dashboardData.data?.vocTrend } : undefined;
  const siteComparison = dashboardData ? { data: dashboardData.data?.siteComparison } : undefined;
  const staffPerformance = dashboardData ? { data: dashboardData.data?.staffPerformance } : undefined;

  // 미배정 사업장 조회
  const { data: unassignedData } = useQuery({
    queryKey: ['unassigned-sites'],
    queryFn: () => getUnassignedSites(),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  const unassignedCount = unassignedData?.data?.count || 0;

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
              title="사업장 현황"
              value={summary?.data?.activeSites || 0}
              prefix={<ShopOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>활성</span>}
            />
            {(summary?.data?.inactiveSites || 0) > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
                비활성: <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{summary?.data?.inactiveSites}</span>개
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="VOC (최근 2주)"
              value={summary?.data?.recentTotalFeedbacks || 0}
              prefix={<MessageOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
              미처리: <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{summary?.data?.recentPendingFeedbacks || 0}</span>건 / 완료: <span style={{ color: '#3f8600', fontWeight: 'bold' }}>{summary?.data?.recentResolvedFeedbacks || 0}</span>건
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/feedbacks?status=PENDING')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="미처리 VOC (최근 2주)"
              value={summary?.data?.recentPendingFeedbacks || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: (summary?.data?.recentPendingFeedbacks || 0) > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {unassignedCount > 0 ? (
            <Card
              hoverable
              onClick={() => navigate('/delivery-routes')}
              style={{ cursor: 'pointer', borderColor: '#faad14' }}
            >
              <Statistic
                title="코스 미배정 사업장"
                value={unassignedCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <Button type="link" size="small" style={{ padding: 0, marginTop: 4 }}>
                확인하기
              </Button>
            </Card>
          ) : (
            <Card>
              <Statistic
                title="평균 별점"
                value={summary?.data?.avgRating || 0}
                precision={1}
                suffix="/ 5.0"
              />
            </Card>
          )}
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

      {/* 일별 VOC 트렌드 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="일별 VOC 트렌드">
            {vocTrend?.data && vocTrend.data.length > 0 ? (
              <Line
                data={{
                  labels: vocTrend.data.map((d: any) =>
                    dayjs(d.date).format('MM/DD')
                  ),
                  datasets: [
                    {
                      label: 'VOC 건수',
                      data: vocTrend.data.map((d: any) => d.count),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      yAxisID: 'y',
                    },
                    {
                      label: '평균 별점',
                      data: vocTrend.data.map((d: any) => d.avgRating),
                      borderColor: 'rgb(255, 99, 132)',
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      yAxisID: 'y1',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      title: {
                        display: true,
                        text: 'VOC 건수',
                      },
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: '평균 별점',
                      },
                      min: 0,
                      max: 5,
                    },
                  },
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                데이터가 없습니다
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 사업장별 비교 및 담당자별 평점 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="사업장별 VOC 현황">
            {siteComparison?.data && siteComparison.data.length > 0 ? (
              <Bar
                data={{
                  labels: siteComparison.data.map((d: any) => d.siteName),
                  datasets: [
                    {
                      label: 'VOC 건수',
                      data: siteComparison.data.map((d: any) => d.feedbackCount),
                      backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                데이터가 없습니다
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="담당자별 평점">
            {staffPerformance?.data && staffPerformance.data.length > 0 ? (
              <Bar
                data={{
                  labels: staffPerformance.data.map((d: any) => d.userName),
                  datasets: [
                    {
                      label: '평균 별점',
                      data: staffPerformance.data.map((d: any) => d.avgRating),
                      backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 5,
                    },
                  },
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                데이터가 없습니다
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
