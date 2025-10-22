import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Typography,
  Modal,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getDeliveryRoutes, deleteDeliveryRoute } from '../../api/delivery-route.api';
import type { DeliveryRoute } from '../../types/delivery-route';
import CreateDeliveryRouteModal from '../../components/delivery-route/CreateDeliveryRouteModal';
import EditDeliveryRouteModal from '../../components/delivery-route/EditDeliveryRouteModal';

const { Title } = Typography;

export default function DeliveryRouteListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState<string | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);

  // 배송 코스 목록 조회
  const { data: routesData, isLoading, refetch } = useQuery({
    queryKey: ['delivery-routes', { division, isActive, search }],
    queryFn: () => getDeliveryRoutes({ division, isActive, search }),
  });

  const routes = routesData?.data;

  // 삭제 핸들러
  const handleDelete = (route: DeliveryRoute) => {
    Modal.confirm({
      title: '배송 코스 삭제',
      content: `"${route.name}"을(를) 삭제하시겠습니까? 관련된 배송 기록은 유지됩니다.`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await deleteDeliveryRoute(route.id);
          message.success('배송 코스가 삭제되었습니다');
          refetch();
        } catch (error) {
          message.error('삭제에 실패했습니다');
        }
      },
    });
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '코드',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (code: string, record: DeliveryRoute) => (
        <Tag color={record.color}>{code}</Tag>
      ),
    },
    {
      title: '코스명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
      width: 100,
      render: (division: string) => (
        <Tag color={division === 'HQ' ? 'blue' : 'green'}>
          {division === 'HQ' ? '본사' : '영남지사'}
        </Tag>
      ),
    },
    {
      title: '사업장 수',
      dataIndex: 'stopsCount',
      key: 'stopsCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '배정 기사',
      dataIndex: 'assignedDrivers',
      key: 'assignedDrivers',
      render: (drivers: Array<{ name: string }>) => (
        <Space size={4} wrap>
          {drivers.length > 0 ? (
            drivers.map((driver, i) => (
              <Tag key={i} color="purple">
                {driver.name}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>미배정</span>
          )}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_: any, record: DeliveryRoute) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/delivery-routes/${record.id}`)}
          >
            상세
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedRoute(record);
              setEditModalOpen(true);
            }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>배송 코스 관리</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
        >
          코스 생성
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="코스명 또는 코드 검색"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="부문 선택"
            style={{ width: 120 }}
            value={division}
            onChange={setDivision}
            allowClear
          >
            <Select.Option value="HQ">본사</Select.Option>
            <Select.Option value="YEONGNAM">영남지사</Select.Option>
          </Select>
          <Select
            placeholder="상태"
            style={{ width: 120 }}
            value={isActive}
            onChange={setIsActive}
          >
            <Select.Option value={true}>활성</Select.Option>
            <Select.Option value={false}>비활성</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={routes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      <CreateDeliveryRouteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />

      <EditDeliveryRouteModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRoute(null);
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedRoute(null);
          refetch();
        }}
        route={selectedRoute}
      />
    </div>
  );
}
