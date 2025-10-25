import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Table,
  Space,
  Tag,
  Button,
  DatePicker,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  message,
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getDeliveryLogs, deleteDeliveryLog } from '../../api/delivery-log.api';
import { getDeliveryRoutes } from '../../api/delivery-route.api';
import type { DeliveryLog, DeliveryStatus } from '../../types/delivery-log';

const { Title } = Typography;

export default function DeliveryLogPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [routeId, setRouteId] = useState<string | undefined>();
  const [driverId, setDriverId] = useState<string | undefined>();
  const [status, setStatus] = useState<DeliveryStatus | undefined>();
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 배송 기록 조회
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['delivery-logs', { routeId, driverId, status, dateRange }],
    queryFn: () => {
      const params: any = {
        routeId,
        driverId,
        status,
      };

      if (dateRange && dateRange.length === 2) {
        params.deliveryDate = dateRange[0].format('YYYY-MM-DD');
      }

      return getDeliveryLogs(params);
    },
  });

  // 배송 코스 목록 (필터용)
  const { data: routesData } = useQuery({
    queryKey: ['delivery-routes'],
    queryFn: () => getDeliveryRoutes(),
  });

  const logs = logsData?.data || [];
  const routes = routesData?.data || [];

  // 통계 계산
  const stats = {
    total: logs.length,
    completed: logs.filter(log => log.status === 'COMPLETED').length,
    pending: logs.filter(log => log.status === 'PENDING').length,
    issue: logs.filter(log => log.issueReported).length,
    totalDistance: logs.reduce((sum, log) => sum + (log.distanceKm || 0), 0),
    totalDuration: logs.reduce((sum, log) => sum + (log.actualDuration || 0), 0),
  };

  // 기사 목록 추출 (중복 제거)
  const drivers = Array.from(
    new Map(
      logs
        .filter(log => log.driver)
        .map(log => [log.driver!.id, log.driver])
    ).values()
  );

  // 삭제 핸들러
  const handleDelete = (log: DeliveryLog) => {
    Modal.confirm({
      title: '배송 기록 삭제',
      content: `"${log.site?.name}"의 배송 기록을 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await deleteDeliveryLog(log.id);
          message.success('배송 기록이 삭제되었습니다');
          refetch();
        } catch (error) {
          message.error('삭제에 실패했습니다');
        }
      },
    });
  };

  // 상세 보기 핸들러
  const handleViewDetail = (log: DeliveryLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  // 상태 색상
  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ARRIVED':
        return 'processing';
      case 'IN_TRANSIT':
        return 'warning';
      case 'PENDING':
        return 'default';
      case 'DELAYED':
        return 'error';
      case 'ISSUE':
        return 'error';
      default:
        return 'default';
    }
  };

  // 상태 라벨
  const getStatusLabel = (status: DeliveryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'ARRIVED':
        return '도착';
      case 'IN_TRANSIT':
        return '이동중';
      case 'PENDING':
        return '대기';
      case 'DELAYED':
        return '지연';
      case 'ISSUE':
        return '문제';
      default:
        return '알수없음';
    }
  };

  // 테이블 컬럼
  const columns = [
    {
      title: '날짜',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '순서',
      dataIndex: 'stopNumber',
      key: 'stopNumber',
      width: 70,
      align: 'center' as const,
      render: (num: number) => <Tag color="blue">{num}</Tag>,
    },
    {
      title: '코스',
      dataIndex: 'route',
      key: 'route',
      width: 150,
      render: (route: any) => route?.name || '-',
    },
    {
      title: '사업장',
      dataIndex: 'site',
      key: 'site',
      render: (site: any) => (
        <div>
          <div><strong>{site?.name || '-'}</strong></div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {site?.address || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '기사',
      dataIndex: 'driver',
      key: 'driver',
      width: 120,
      render: (driver: any) => driver?.name || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: DeliveryStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '도착시간',
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      width: 100,
      render: (time: string) => time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: '출발시간',
      dataIndex: 'departedAt',
      key: 'departedAt',
      width: 100,
      render: (time: string) => time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: '소요시간',
      dataIndex: 'actualDuration',
      key: 'actualDuration',
      width: 90,
      align: 'center' as const,
      render: (duration: number) => duration ? `${duration}분` : '-',
    },
    {
      title: '거리',
      dataIndex: 'distanceKm',
      key: 'distanceKm',
      width: 80,
      align: 'center' as const,
      render: (distance: number) => distance ? `${distance.toFixed(1)}km` : '-',
    },
    {
      title: '이슈',
      dataIndex: 'issueReported',
      key: 'issueReported',
      width: 70,
      align: 'center' as const,
      render: (reported: boolean) => (
        reported ? <Tag color="error">이슈</Tag> : null
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: DeliveryLog) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            상세
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>
            <CarOutlined /> 배송 이력
          </Title>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            새로고침
          </Button>
        </div>

        {/* 통계 카드 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="전체 배송"
                value={stats.total}
                suffix="건"
                prefix={<CarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="완료"
                value={stats.completed}
                suffix="건"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="대기중"
                value={stats.pending}
                suffix="건"
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="이슈 발생"
                value={stats.issue}
                suffix="건"
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 필터 */}
        <Card>
          <Space wrap size="middle">
            <div>
              <span style={{ marginRight: 8 }}>날짜:</span>
              <DatePicker
                value={dateRange[0]}
                onChange={(date) => {
                  if (date) {
                    setDateRange([date, date]);
                  }
                }}
                style={{ width: 200 }}
                placeholder="날짜 선택"
              />
            </div>

            <div>
              <span style={{ marginRight: 8 }}>코스:</span>
              <Select
                placeholder="전체"
                style={{ width: 200 }}
                value={routeId}
                onChange={setRouteId}
                allowClear
              >
                {routes.map((route: any) => (
                  <Select.Option key={route.id} value={route.id}>
                    {route.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <span style={{ marginRight: 8 }}>기사:</span>
              <Select
                placeholder="전체"
                style={{ width: 150 }}
                value={driverId}
                onChange={setDriverId}
                allowClear
              >
                {drivers.map((driver: any) => (
                  <Select.Option key={driver?.id} value={driver?.id}>
                    {driver?.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <span style={{ marginRight: 8 }}>상태:</span>
              <Select
                placeholder="전체"
                style={{ width: 150 }}
                value={status}
                onChange={setStatus}
                allowClear
              >
                <Select.Option value="PENDING">대기</Select.Option>
                <Select.Option value="IN_TRANSIT">이동중</Select.Option>
                <Select.Option value="ARRIVED">도착</Select.Option>
                <Select.Option value="COMPLETED">완료</Select.Option>
                <Select.Option value="DELAYED">지연</Select.Option>
                <Select.Option value="ISSUE">문제</Select.Option>
              </Select>
            </div>
          </Space>
        </Card>

        {/* 테이블 */}
        <Card>
          <Table
            columns={columns}
            dataSource={logs}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}건`,
            }}
            scroll={{ x: 1600 }}
          />
        </Card>
      </Space>

      {/* 상세 모달 */}
      <Modal
        title="배송 기록 상세"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            닫기
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="날짜" span={2}>
              {dayjs(selectedLog.deliveryDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="코스">
              {selectedLog.route?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="부문">
              <Tag color={selectedLog.route?.division === 'HQ' ? 'blue' : 'green'}>
                {selectedLog.route?.division === 'HQ' ? '본사' : '영남지사'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="사업장" span={2}>
              <div>
                <div><strong>{selectedLog.site?.name || '-'}</strong></div>
                <div style={{ color: '#999', marginTop: 4 }}>
                  {selectedLog.site?.address || '-'}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="기사">
              {selectedLog.driver?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="연락처">
              {selectedLog.driver?.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="순서">
              {selectedLog.stopNumber}번째
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={getStatusColor(selectedLog.status)}>
                {getStatusLabel(selectedLog.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="도착시간">
              {selectedLog.arrivedAt
                ? dayjs(selectedLog.arrivedAt).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="출발시간">
              {selectedLog.departedAt
                ? dayjs(selectedLog.departedAt).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="소요시간">
              {selectedLog.actualDuration ? `${selectedLog.actualDuration}분` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="이동거리">
              {selectedLog.distanceKm ? `${selectedLog.distanceKm.toFixed(2)}km` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="체크인 위치" span={2}>
              {selectedLog.checkInLatitude && selectedLog.checkInLongitude
                ? `위도: ${selectedLog.checkInLatitude.toFixed(6)}, 경도: ${selectedLog.checkInLongitude.toFixed(6)}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="체크아웃 위치" span={2}>
              {selectedLog.checkOutLatitude && selectedLog.checkOutLongitude
                ? `위도: ${selectedLog.checkOutLatitude.toFixed(6)}, 경도: ${selectedLog.checkOutLongitude.toFixed(6)}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="이슈 발생">
              {selectedLog.issueReported ? (
                <Tag color="error">이슈 발생</Tag>
              ) : (
                <Tag color="success">정상</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="이슈 내용">
              {selectedLog.issueDetail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="메모" span={2}>
              {selectedLog.note || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
