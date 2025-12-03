import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Spin,
  Button,
  Space,
  Tag,
  Table,
  Divider,
  message,
  Modal,
  Select,
  Input,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Identifier, XYCoord } from 'dnd-core';
import {
  getDeliveryRouteById,
  addSiteToRoute,
  removeSiteFromRoute,
  updateRouteStops,
  assignDrivers,
} from '../../api/delivery-route.api';
import { apiClient } from '../../utils/axios';
import { getStaffList } from '../../api/staff.api';
import type { DeliveryRouteStop } from '../../types/delivery-route';

const { Title, Text } = Typography;

const DND_TYPE = 'ROUTE_STOP';

// Draggable Row Component
interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  record: DeliveryRouteStop;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const DraggableRow: React.FC<DraggableRowProps> = ({ index, moveRow, record, className, style, ...restProps }) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: DND_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: () => {
      return { id: record.id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={className}
      style={{ ...style, cursor: 'move', opacity }}
      data-handler-id={handlerId}
      {...restProps}
    />
  );
};

// 사업장 목록 조회 함수
async function getSites(params?: { division?: string }) {
  const response: any = await apiClient.get('/sites', { params });
  // axios interceptor가 이미 response.data를 반환하므로
  // response는 { success: true, data: { sites: [...] } } 형태임
  return response;
}

export default function DeliveryRouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [driverForm] = Form.useForm();
  const [stops, setStops] = useState<DeliveryRouteStop[]>([]);

  // 배송 코스 상세 조회
  const { data: routeData, isLoading } = useQuery({
    queryKey: ['delivery-route', id],
    queryFn: () => getDeliveryRouteById(id!),
    enabled: !!id,
  });

  const route = routeData?.data;

  // route 데이터가 변경되면 stops 업데이트
  useEffect(() => {
    if (route?.stops) {
      setStops([...route.stops].sort((a, b) => a.stopNumber - b.stopNumber));
    }
  }, [route]);

  // 전체 사업장 목록 조회 (같은 division)
  const { data: allSitesData } = useQuery({
    queryKey: ['sites', route?.division],
    queryFn: () => getSites({ division: route?.division }),
    enabled: !!route?.division,
  });

  const allSites = allSitesData?.data?.sites;

  // 배송기사 목록 조회
  const { data: driversData } = useQuery({
    queryKey: ['staff', 'delivery-drivers'],
    queryFn: () => getStaffList({ role: 'DELIVERY_DRIVER', limit: 100 }),
  });

  // 사업장 추가 mutation
  const addSiteMutation = useMutation({
    mutationFn: (data: { siteId: string; stopNumber: number; estimatedArrival?: string }) =>
      addSiteToRoute(id!, data),
    onSuccess: () => {
      message.success('사업장이 추가되었습니다');
      queryClient.invalidateQueries({ queryKey: ['delivery-route', id] });
      queryClient.invalidateQueries({ queryKey: ['sites', route?.division] }); // 하단 목록 갱신
      setAddModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message || '추가에 실패했습니다');
    },
  });

  // 사업장 제거 mutation
  const removeSiteMutation = useMutation({
    mutationFn: (siteId: string) => removeSiteFromRoute(id!, siteId),
    onSuccess: () => {
      message.success('사업장이 제거되었습니다');
      queryClient.invalidateQueries({ queryKey: ['delivery-route', id] });
    },
    onError: (error: any) => {
      message.error(error.message || '제거에 실패했습니다');
    },
  });

  // 순서 업데이트 mutation
  const updateStopsMutation = useMutation({
    mutationFn: (updates: Array<{ id: string; stopNumber: number }>) =>
      updateRouteStops(id!, { stops: updates }),
    onSuccess: () => {
      message.success('순서가 변경되었습니다');
      queryClient.invalidateQueries({ queryKey: ['delivery-route', id] });
    },
    onError: (error: any) => {
      message.error(error.message || '순서 변경에 실패했습니다');
    },
  });

  // 드래그 앤 드롭으로 순서 변경
  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const dragStop = stops[dragIndex];
    const newStops = [...stops];
    newStops.splice(dragIndex, 1);
    newStops.splice(hoverIndex, 0, dragStop);

    // 로컬 상태 즉시 업데이트
    setStops(newStops);
  };

  // 순서 변경 저장
  const saveStopsOrder = () => {
    const updates = stops.map((stop, index) => ({
      id: stop.id,
      stopNumber: index + 1,
    }));
    updateStopsMutation.mutate(updates);
  };

  // 기사 배정 mutation
  const assignDriverMutation = useMutation({
    mutationFn: (driverIds: string[]) => assignDrivers(id!, driverIds),
    onSuccess: () => {
      message.success('기사가 배정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['delivery-route', id] });
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] }); // 목록 캐시도 무효화
      setDriverModalOpen(false);
      driverForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message || '기사 배정에 실패했습니다');
    },
  });

  // 기사 배정 핸들러
  const handleAssignDrivers = async () => {
    try {
      const values = await driverForm.validateFields();
      assignDriverMutation.mutate(values.driverIds || []);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 기사 배정 모달 열기 (현재 배정된 기사 선택 상태로)
  const openDriverModal = () => {
    const currentDriverIds = route?.assignedDrivers?.map((d: any) => d.id) || [];
    driverForm.setFieldsValue({ driverIds: currentDriverIds });
    setDriverModalOpen(true);
  };

  // 코스에 포함되지 않은 사업장 필터링
  const availableSites = allSites?.filter(
    (site: any) => !route?.stops.some((stop: any) => stop.site.id === site.id)
  );

  // 사업장 추가 핸들러
  const handleAddSite = async () => {
    try {
      const values = await form.validateFields();
      addSiteMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 사업장 제거 핸들러
  const handleRemoveSite = (stop: DeliveryRouteStop) => {
    Modal.confirm({
      title: '사업장 제거',
      content: `"${stop.site.name}"을(를) 이 코스에서 제거하시겠습니까?`,
      okText: '제거',
      okType: 'danger',
      cancelText: '취소',
      onOk: () => removeSiteMutation.mutate(stop.site.id),
    });
  };

  // 코스에 포함된 사업장 테이블 컬럼
  const columns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: () => <DragOutlined style={{ cursor: 'move', color: '#999' }} />,
    },
    {
      title: '순서',
      dataIndex: 'stopNumber',
      key: 'stopNumber',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: '사업장명',
      dataIndex: ['site', 'name'],
      key: 'siteName',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '주소',
      dataIndex: ['site', 'address'],
      key: 'address',
    },
    {
      title: '유형',
      dataIndex: ['site', 'type'],
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          CONSIGNMENT: { label: '위탁', color: 'blue' },
          DELIVERY: { label: '배송', color: 'green' },
          LUNCHBOX: { label: '도시락', color: 'orange' },
          EVENT: { label: '행사', color: 'purple' },
        };
        const typeInfo = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.label}</Tag>;
      },
    },
    {
      title: '예상 도착',
      dataIndex: 'estimatedArrival',
      key: 'estimatedArrival',
      width: 100,
    },
    {
      title: '예상 소요시간',
      dataIndex: 'estimatedDuration',
      key: 'estimatedDuration',
      width: 120,
      render: (duration?: number) => (duration ? `${duration}분` : '-'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      render: (_: any, record: DeliveryRouteStop) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveSite(record)}
        >
          제거
        </Button>
      ),
    },
  ];

  // 하단 테이블에서 바로 사업장 추가하는 함수
  const handleQuickAddSite = (siteId: string) => {
    const nextStopNumber = (route?.stops?.length || 0) + 1;
    addSiteMutation.mutate({ siteId, stopNumber: nextStopNumber });
  };

  // 코스에 포함되지 않은 사업장 테이블 컬럼
  const availableSitesColumns = [
    {
      title: '사업장명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          CONSIGNMENT: { label: '위탁', color: 'blue' },
          DELIVERY: { label: '배송', color: 'green' },
          LUNCHBOX: { label: '도시락', color: 'orange' },
          EVENT: { label: '행사', color: 'purple' },
        };
        const typeInfo = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.label}</Tag>;
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleQuickAddSite(record.id)}
          loading={addSiteMutation.isPending}
        >
          추가
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!route) {
    return (
      <Card>
        <Text>배송 코스를 찾을 수 없습니다.</Text>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/delivery-routes')}>
            목록으로
          </Button>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color={route.color} style={{ fontSize: '16px', padding: '4px 12px' }}>
                  {route.code}
                </Tag>
                <Title level={3} style={{ margin: 0 }}>
                  {route.name}
                </Title>
                <Tag color={route.division === 'HQ' ? 'blue' : 'green'}>
                  {route.division === 'HQ' ? '본사' : '영남지사'}
                </Tag>
                <Tag color={route.isActive ? 'success' : 'default'}>
                  {route.isActive ? '활성' : '비활성'}
                </Tag>
              </Space>
              <Space>
                <Button
                  type="primary"
                  onClick={saveStopsOrder}
                  loading={updateStopsMutation.isPending}
                  disabled={JSON.stringify(stops) === JSON.stringify(route.stops.sort((a: any, b: any) => a.stopNumber - b.stopNumber))}
                >
                  순서 저장
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                  사업장 추가
                </Button>
              </Space>
            </div>

          {route.description && (
            <Text type="secondary">{route.description}</Text>
          )}

          <Space>
            <Text strong>등록된 사업장:</Text>
            <Text>{route.stopsCount}개</Text>
            <Divider type="vertical" />
            <Text strong>배정된 기사:</Text>
            {route.assignedDrivers.length > 0 ? (
              <Space size={4}>
                {route.assignedDrivers.map((driver: any) => (
                  <Tag key={driver.id} color="purple">
                    {driver.name}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">없음</Text>
            )}
            <Button type="link" size="small" onClick={openDriverModal}>
              {route.assignedDrivers.length > 0 ? '변경' : '배정하기'}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="코스에 포함된 사업장" style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={stops}
          rowKey="id"
          pagination={false}
          components={{
            body: {
              row: (props: any) => {
                const index = stops.findIndex((stop) => stop.id === props['data-row-key']);
                return <DraggableRow {...props} index={index} moveRow={moveRow} record={stops[index]} />;
              },
            },
          }}
        />
      </Card>

      <Card title="코스에 포함되지 않은 사업장" style={{ marginBottom: 16 }}>
        <Table
          columns={availableSitesColumns}
          dataSource={availableSites}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 사업장 추가 모달 */}
      <Modal
        title="사업장 추가"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          form.resetFields();
        }}
        onOk={handleAddSite}
        confirmLoading={addSiteMutation.isPending}
        okText="추가"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="사업장"
            name="siteId"
            rules={[{ required: true, message: '사업장을 선택해주세요' }]}
          >
            <Select
              placeholder="사업장 선택"
              showSearch
              filterOption={(input, option) =>
                ((option?.children as unknown) as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableSites?.map((site: any) => (
                <Select.Option key={site.id} value={site.id}>
                  {site.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="순서 번호"
            name="stopNumber"
            rules={[{ required: true, message: '순서 번호를 입력해주세요' }]}
            initialValue={route.stops.length + 1}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item label="예상 도착 시간" name="estimatedArrival">
            <Input placeholder="예: 09:00" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 기사 배정 모달 */}
      <Modal
        title="배송 기사 배정"
        open={driverModalOpen}
        onCancel={() => {
          setDriverModalOpen(false);
          driverForm.resetFields();
        }}
        onOk={handleAssignDrivers}
        confirmLoading={assignDriverMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={driverForm} layout="vertical">
          <Form.Item
            label="배송 기사 선택"
            name="driverIds"
            extra="여러 명의 기사를 선택할 수 있습니다. 기사를 선택하지 않으면 기존 배정이 해제됩니다."
          >
            <Select
              mode="multiple"
              placeholder="배송 기사를 선택하세요"
              showSearch
              filterOption={(input, option) =>
                ((option?.children as unknown) as string)?.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            >
              {driversData?.items?.map((staff: any) => (
                <Select.Option key={staff.user.id} value={staff.user.id}>
                  {staff.user.name} ({staff.user.phone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </DndProvider>
  );
}
