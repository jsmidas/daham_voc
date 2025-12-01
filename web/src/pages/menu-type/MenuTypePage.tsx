/**
 * Menu Type Management Page
 * @description 식단유형 관리 페이지
 */
import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  InputNumber,
  Select,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMenuTypes,
  createMenuType,
  updateMenuType,
  deleteMenuType,
  type MenuType,
  type Division,
} from '@/api/menu-type.api';
import type { ColumnsType } from 'antd/es/table';

export default function MenuTypePage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenuType, setEditingMenuType] = useState<MenuType | null>(null);

  // Fetch menu types
  const { data: menuTypesData, isLoading } = useQuery({
    queryKey: ['menu-types'],
    queryFn: getMenuTypes,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createMenuType,
    onSuccess: () => {
      message.success('식단 유형이 생성되었습니다');
      queryClient.invalidateQueries({ queryKey: ['menu-types'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '생성 실패');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMenuType(id, data),
    onSuccess: () => {
      message.success('식단 유형이 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['menu-types'] });
      setModalVisible(false);
      setEditingMenuType(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '수정 실패');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenuType,
    onSuccess: () => {
      message.success('식단 유형이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['menu-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '삭제 실패');
    },
  });

  // Handle create
  const handleCreate = () => {
    setEditingMenuType(null);
    setModalVisible(true);
    form.resetFields();
  };

  // Handle edit
  const handleEdit = (menuType: MenuType) => {
    setEditingMenuType(menuType);
    setModalVisible(true);
    form.setFieldsValue({
      division: menuType.division,
      name: menuType.name,
      description: menuType.description,
      price: menuType.price ? Number(menuType.price) : undefined,
      sortOrder: menuType.sortOrder,
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Handle form submit
  const handleSubmit = async (values: any) => {
    if (editingMenuType) {
      updateMutation.mutate({ id: editingMenuType.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Table columns
  const columns: ColumnsType<MenuType> = [
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
      width: 100,
      render: (division: Division) => (
        <Tag color={division === 'HQ' ? 'blue' : 'green'}>
          {division === 'HQ' ? '본사' : '영남지사'}
        </Tag>
      ),
      filters: [
        { text: '본사', value: 'HQ' },
        { text: '영남지사', value: 'YEONGNAM' },
      ],
      onFilter: (value, record) => record.division === value,
    },
    {
      title: '순서',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '유형명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '식단가 (VAT 제외)',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (price) => price ? `${Number(price).toLocaleString()}원` : '-',
    },
    {
      title: '사용 중인 사업장',
      key: 'siteCount',
      width: 130,
      render: (_, record) => `${record._count?.siteMenuTypes || 0}개`,
    },
    {
      title: '주간 메뉴',
      key: 'menuCount',
      width: 100,
      render: (_, record) => (
        <Tag color={record._count && record._count.weeklyMenuTemplates > 0 ? 'blue' : 'default'}>
          {record._count?.weeklyMenuTemplates || 0}개
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Popconfirm
            title="삭제 확인"
            description={
              record._count && record._count.siteMenuTypes > 0
                ? '이 식단 유형을 사용 중인 사업장이 있습니다. 정말 삭제하시겠습니까?'
                : '정말 삭제하시겠습니까?'
            }
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
            disabled={record._count && record._count.siteMenuTypes > 0}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record._count && record._count.siteMenuTypes > 0}
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="식단유형 관리"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['menu-types'] })}
            >
              새로고침
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              유형 추가
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={menuTypesData?.menuTypes || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `총 ${total}개`,
          }}
          expandable={{
            expandedRowRender: (record) => {
              if (!record.weeklyMenuTemplates || record.weeklyMenuTemplates.length === 0) {
                return (
                  <div style={{ padding: '16px', color: '#999', textAlign: 'center' }}>
                    등록된 주간 메뉴가 없습니다
                  </div>
                );
              }

              return (
                <div style={{ padding: '8px' }}>
                  <h4 style={{ marginBottom: 12 }}>주간 메뉴 목록</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {record.weeklyMenuTemplates.map((menu) => (
                      <Card
                        key={menu.id}
                        size="small"
                        hoverable
                        cover={
                          menu.thumbnailUrl || menu.imageUrl ? (
                            <img
                              alt={`${menu.year}년 ${menu.weekNumber}주차`}
                              src={menu.thumbnailUrl || menu.imageUrl}
                              style={{ height: 150, objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              이미지 없음
                            </div>
                          )
                        }
                      >
                        <Card.Meta
                          title={`${menu.year}년 ${menu.weekNumber}주차`}
                          description={menu.description || '설명 없음'}
                        />
                      </Card>
                    ))}
                  </div>
                </div>
              );
            },
            rowExpandable: (record) => !!(record.weeklyMenuTemplates && record.weeklyMenuTemplates.length > 0),
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingMenuType ? '식단유형 수정' : '식단유형 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingMenuType(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingMenuType ? '수정' : '생성'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="division"
            label="부문"
            rules={[{ required: true, message: '부문을 선택하세요' }]}
            initialValue="HQ"
          >
            <Select placeholder="부문을 선택하세요">
              <Select.Option value="HQ">본사</Select.Option>
              <Select.Option value="YEONGNAM">영남지사</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="유형명"
            rules={[
              { required: true, message: '유형명을 입력하세요' },
              { max: 50, message: '유형명은 50자를 초과할 수 없습니다' },
            ]}
          >
            <Input placeholder="예: 5찬 저가, 4찬 고가, 3찬 국 없이" />
          </Form.Item>

          <Form.Item
            name="description"
            label="설명"
            rules={[{ max: 200, message: '설명은 200자를 초과할 수 없습니다' }]}
          >
            <Input.TextArea rows={3} placeholder="식단 유형에 대한 설명을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="price"
            label="식단가 (VAT 제외)"
            rules={[
              { type: 'number', min: 0, message: '식단가는 0 이상이어야 합니다' },
            ]}
          >
            <InputNumber<number>
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="식단가를 입력하세요"
              formatter={(value) => value ? `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
              parser={(value) => {
                const parsed = value?.replace(/₩\s?|(,*)/g, '');
                return parsed ? parseFloat(parsed) : (null as unknown as number);
              }}
            />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="정렬 순서"
            initialValue={0}
            rules={[{ required: true, message: '정렬 순서를 입력하세요' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
