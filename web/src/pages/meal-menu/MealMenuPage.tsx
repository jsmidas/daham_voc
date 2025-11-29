/**
 * Meal Menu Page
 * @description 식수 메뉴 관리 페이지 (A코스, B코스 등 선택 가능한 메뉴 관리)
 */

import { useState } from 'react';
import {
  Button,
  Table,
  Space,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  Popconfirm,
  Card,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMealMenus,
  createMealMenu,
  updateMealMenu,
  deleteMealMenu,
  type MealMenu,
} from '@/api/meal-menu.api';

export default function MealMenuPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MealMenu | null>(null);
  const [form] = Form.useForm();

  // 메뉴 목록 조회
  const { data: menusData, isLoading } = useQuery({
    queryKey: ['meal-menus'],
    queryFn: () => getMealMenus(true),
  });

  const menus = menusData?.data || [];

  // 메뉴 생성 Mutation
  const createMutation = useMutation({
    mutationFn: createMealMenu,
    onSuccess: () => {
      message.success('메뉴가 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['meal-menus'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '메뉴 등록에 실패했습니다');
    },
  });

  // 메뉴 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMealMenu(id, data),
    onSuccess: () => {
      message.success('메뉴가 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['meal-menus'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '메뉴 수정에 실패했습니다');
    },
  });

  // 메뉴 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealMenu,
    onSuccess: () => {
      message.success('메뉴가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['meal-menus'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '메뉴 삭제에 실패했습니다');
    },
  });

  const handleOpenModal = (menu?: MealMenu) => {
    if (menu) {
      setEditingMenu(menu);
      form.setFieldsValue({
        name: menu.name,
        description: menu.description,
        sortOrder: menu.sortOrder,
        isActive: menu.isActive,
      });
    } else {
      setEditingMenu(null);
      form.resetFields();
      form.setFieldsValue({
        sortOrder: menus.length,
        isActive: true,
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingMenu(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingMenu) {
        updateMutation.mutate({ id: editingMenu.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: '순서',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a: MealMenu, b: MealMenu) => a.sortOrder - b.sortOrder,
    },
    {
      title: '메뉴명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: MealMenu) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {!record.isActive && <Tag color="default">비활성</Tag>}
        </Space>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_: any, record: MealMenu) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            description="삭제된 메뉴는 복구할 수 없습니다"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>식수 메뉴 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          메뉴 등록
        </Button>
      </div>

      {/* 안내 */}
      <Alert
        message="식수 메뉴 안내"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>고객이 식수 입력 시 선택할 수 있는 메뉴를 등록합니다</li>
            <li>예: A코스, B코스, 일반식, 다이어트식, 한식, 양식 등</li>
            <li>등록된 메뉴는 고객사 설정에서 해당 사업장에 할당할 수 있습니다</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={menus}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      {/* 등록/수정 모달 */}
      <Modal
        title={editingMenu ? '메뉴 수정' : '메뉴 등록'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingMenu ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="메뉴명"
            name="name"
            rules={[{ required: true, message: '메뉴명을 입력하세요' }]}
          >
            <Input placeholder="예: A코스, B코스, 일반식" />
          </Form.Item>

          <Form.Item label="설명" name="description">
            <Input.TextArea rows={2} placeholder="메뉴에 대한 설명 (선택)" />
          </Form.Item>

          <Form.Item label="표시 순서" name="sortOrder">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="활성화" name="isActive" valuePropName="checked">
            <Switch checkedChildren="활성" unCheckedChildren="비활성" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
