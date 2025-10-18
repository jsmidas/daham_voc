/**
 * Weekly Menu Template Management Page
 * @description 주간 식단표 관리 페이지
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
  Select,
  Upload,
  Image,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWeeklyMenuTemplates,
  createWeeklyMenuTemplate,
  updateWeeklyMenuTemplate,
  deleteWeeklyMenuTemplate,
  uploadWeeklyMenuImage,
  type WeeklyMenuTemplate,
} from '@/api/weekly-menu-template.api';
import { getMenuTypes, type MenuType } from '@/api/menu-type.api';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

export default function WeeklyMenuPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WeeklyMenuTemplate | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filter states
  const [selectedMenuType, setSelectedMenuType] = useState<string | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>();

  // Get current year and week
  const getCurrentYearWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return { year, weekNumber };
  };

  const { year: currentYear, weekNumber: currentWeek } = getCurrentYearWeek();

  // Fetch menu types for dropdown
  const { data: menuTypesData } = useQuery({
    queryKey: ['menu-types'],
    queryFn: getMenuTypes,
  });

  // Fetch weekly menu templates with filters
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['weekly-menu-templates', selectedMenuType, selectedYear, selectedWeek],
    queryFn: () =>
      getWeeklyMenuTemplates({
        menuTypeId: selectedMenuType,
        year: selectedYear,
        weekNumber: selectedWeek,
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createWeeklyMenuTemplate,
    onSuccess: () => {
      message.success('주간 식단표가 생성되었습니다');
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-templates'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '생성 실패');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWeeklyMenuTemplate(id, data),
    onSuccess: () => {
      message.success('주간 식단표가 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-templates'] });
      setModalVisible(false);
      setEditingTemplate(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '수정 실패');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWeeklyMenuTemplate,
    onSuccess: () => {
      message.success('주간 식단표가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-templates'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '삭제 실패');
    },
  });

  // Handle create
  const handleCreate = () => {
    setEditingTemplate(null);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      year: currentYear,
      weekNumber: currentWeek,
    });
  };

  // Handle edit
  const handleEdit = (template: WeeklyMenuTemplate) => {
    setEditingTemplate(template);
    setModalVisible(true);
    form.setFieldsValue({
      menuTypeId: template.menuTypeId,
      year: template.year,
      weekNumber: template.weekNumber,
      imageUrl: template.imageUrl,
      thumbnailUrl: template.thumbnailUrl,
      description: template.description,
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Handle form submit
  const handleSubmit = async (values: any) => {
    if (editingTemplate) {
      // When editing, only send updateable fields
      const updateData = {
        imageUrl: values.imageUrl,
        thumbnailUrl: values.thumbnailUrl,
        description: values.description,
      };
      updateMutation.mutate({ id: editingTemplate.id, data: updateData });
    } else {
      createMutation.mutate(values);
    }
  };

  // Handle image preview
  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  // Handle image upload
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      setUploading(true);
      const uploadedData = await uploadWeeklyMenuImage(file as File);

      // Set the uploaded URL to form fields
      form.setFieldsValue({
        imageUrl: uploadedData.imageUrl,
        thumbnailUrl: uploadedData.thumbnailUrl,
      });

      message.success('이미지가 업로드되었습니다');
      onSuccess?.(uploadedData);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '이미지 업로드 실패');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  // Generate year options (from 2025 to current year + 2)
  const startYear = 2025;
  const endYear = Math.max(currentYear + 2, 2029); // At least until 2029
  const yearOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map((year) => ({
    label: `${year}년`,
    value: year,
  }));

  // Generate week options (1-53)
  const weekOptions = Array.from({ length: 53 }, (_, i) => i + 1).map((week) => ({
    label: `${week}주차`,
    value: week,
  }));

  // Table columns
  const columns: ColumnsType<WeeklyMenuTemplate> = [
    {
      title: '식단유형',
      dataIndex: ['menuType', 'name'],
      key: 'menuType',
      width: 150,
    },
    {
      title: '년도',
      dataIndex: 'year',
      key: 'year',
      width: 100,
      render: (year) => `${year}년`,
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: '주차',
      dataIndex: 'weekNumber',
      key: 'weekNumber',
      width: 100,
      render: (week) => `${week}주차`,
      sorter: (a, b) => a.weekNumber - b.weekNumber,
    },
    {
      title: '식단가',
      key: 'price',
      width: 120,
      render: (_, record) =>
        record.menuType?.price ? `${Number(record.menuType.price).toLocaleString()}원` : '-',
    },
    {
      title: '미리보기',
      key: 'preview',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handlePreview(record.imageUrl)}
        >
          보기
        </Button>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      fixed: 'right',
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
            description="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
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
    <div style={{ padding: '24px' }}>
      <Card
        title="주간 식단표 관리"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['weekly-menu-templates'] })}
            >
              새로고침
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              식단표 추가
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 200 }}
            placeholder="식단유형 선택"
            allowClear
            value={selectedMenuType}
            onChange={setSelectedMenuType}
            options={menuTypesData?.menuTypes?.map((mt: MenuType) => ({
              label: mt.name,
              value: mt.id,
            }))}
          />
          <Select
            style={{ width: 120 }}
            placeholder="년도"
            allowClear
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
          />
          <Select
            style={{ width: 120 }}
            placeholder="주차"
            allowClear
            value={selectedWeek}
            onChange={setSelectedWeek}
            options={weekOptions}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={templatesData?.templates || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingTemplate ? '주간 식단표 수정' : '주간 식단표 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingTemplate ? '수정' : '생성'}
        cancelText="취소"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="menuTypeId"
            label="식단유형"
            rules={[{ required: true, message: '식단유형을 선택하세요' }]}
          >
            <Select
              placeholder="식단유형을 선택하세요"
              disabled={!!editingTemplate}
              options={menuTypesData?.menuTypes?.map((mt: MenuType) => ({
                label: `${mt.name}${mt.price ? ` (${Number(mt.price).toLocaleString()}원)` : ''}`,
                value: mt.id,
              }))}
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="year"
              label="년도"
              rules={[{ required: true, message: '년도를 선택하세요' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="년도"
                disabled={!!editingTemplate}
                options={yearOptions}
              />
            </Form.Item>

            <Form.Item
              name="weekNumber"
              label="주차"
              rules={[{ required: true, message: '주차를 선택하세요' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="주차"
                disabled={!!editingTemplate}
                options={weekOptions}
              />
            </Form.Item>
          </Space>

          <Form.Item label="이미지 파일 업로드">
            <Upload
              name="image"
              listType="picture-card"
              maxCount={1}
              customRequest={handleUpload}
              accept="image/*"
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>
                  {uploading ? '업로드 중...' : '클릭 또는 드래그'}
                </div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="식단표 이미지 URL"
            rules={[{ required: true, message: '이미지 URL을 입력하세요' }]}
            extra="위에서 파일을 업로드하거나 GCP Storage URL을 직접 입력하세요"
          >
            <Input placeholder="https://storage.googleapis.com/..." />
          </Form.Item>

          <Form.Item
            name="thumbnailUrl"
            label="썸네일 이미지 URL (선택)"
            extra="미리보기용 썸네일 URL (비어있으면 원본 이미지 사용)"
          >
            <Input placeholder="https://storage.googleapis.com/..." />
          </Form.Item>

          <Form.Item name="description" label="설명 (선택)">
            <TextArea rows={3} placeholder="식단표에 대한 설명을 입력하세요" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="식단표 미리보기"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <Image
          alt="식단표"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}
