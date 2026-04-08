/**
 * Feedback List Page
 * @description VOC 관리 페이지
 */

import { Table, Tag, Button, Modal, Form, Input, message, Upload, Image, Rate, Select } from 'antd';
import { PlusOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeedbacks, createFeedback } from '@/api/feedback.api';
import { getSites } from '@/api/site.api';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

export default function FeedbackListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [createForm] = Form.useForm();

  // URL 파라미터에서 상태 필터 (대시보드 미처리 VOC 클릭 시)
  const statusFilter = searchParams.get('status');

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks', statusFilter],
    queryFn: () => getFeedbacks(statusFilter ? { status: statusFilter } : undefined),
    retry: false,
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      message.success('VOC가 등록되었습니다');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'VOC 등록 실패');
    },
  });

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const onCreateFinish = (values: any) => {
    // File 객체만 추출
    const imageFiles = fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj as File);

    if (imageFiles.length > 6) {
      message.error('이미지는 최대 6개까지 업로드할 수 있습니다');
      return;
    }

    createMutation.mutate({
      ...values,
      images: imageFiles,
    });
  };

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    // 최대 6개로 제한
    if (newFileList.length > 6) {
      message.warning('이미지는 최대 6개까지 업로드할 수 있습니다');
      return;
    }
    setFileList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>사진 추가</div>
    </div>
  );

  const columns = [
    {
      title: '이미지',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: any[]) => {
        if (!images || images.length === 0) return '-';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Image
              src={images[0].thumbnailUrl}
              alt="VOC 이미지"
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{
                src: images[0].imageUrl,
              }}
            />
            {images.length > 1 && (
              <Tag color="blue" icon={<PictureOutlined />}>
                +{images.length - 1}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '부문',
      key: 'division',
      width: 80,
      render: (_: any, record: any) => (
        <Tag color={record.site?.division === 'HQ' ? 'blue' : 'green'}>
          {record.site?.division === 'HQ' ? '본사' : '영남'}
        </Tag>
      ),
      filters: [
        { text: '본사', value: 'HQ' },
        { text: '영남지사', value: 'YEONGNAM' },
      ],
      onFilter: (value: any, record: any) => record.site?.division === value,
    },
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'site',
      width: 150,
    },
    {
      title: '작성자',
      dataIndex: ['author', 'name'],
      key: 'author',
      width: 100,
    },
    {
      title: '유형',
      dataIndex: 'authorType',
      key: 'authorType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'STAFF' ? 'blue' : 'green'}>
          {type === 'STAFF' ? '담당자' : '고객'}
        </Tag>
      ),
    },
    {
      title: '내용',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '별점',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => rating ? <Rate disabled value={rating} style={{ fontSize: 14 }} /> : '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'red',
          IN_PROGRESS: 'orange',
          RESOLVED: 'green',
          CLOSED: 'default',
        };
        const labelMap: Record<string, string> = {
          PENDING: '대기',
          IN_PROGRESS: '처리중',
          RESOLVED: '완료',
          CLOSED: '종료',
        };
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
      },
    },
    {
      title: '작성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '작업',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="link"
          onClick={() => navigate(`/feedbacks/${record.id}`)}
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 제목 및 VOC 작성 버튼 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>VOC 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          VOC 작성
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={feedbacks?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record: any) => ({
          onClick: () => navigate(`/feedbacks/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* VOC 작성 모달 */}
      <Modal
        title="VOC 작성"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={onCreateFinish}>
          <Form.Item
            label="사업장"
            name="siteId"
            rules={[{ required: true, message: '사업장을 선택하세요' }]}
          >
            <Select
              placeholder="사업장을 선택하세요"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={sites?.data?.sites?.map((site: any) => ({
                value: site.id,
                label: `[${site.division === 'HQ' ? '본사' : '영남'}] ${site.name}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item
            label="작성자 유형"
            name="authorType"
            rules={[{ required: true, message: '작성자 유형을 선택하세요' }]}
            initialValue="STAFF"
          >
            <Select>
              <Select.Option value="STAFF">담당자</Select.Option>
              <Select.Option value="CLIENT">고객</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="내용"
            name="content"
            rules={[{ required: true, message: '내용을 입력하세요' }]}
          >
            <Input.TextArea rows={4} placeholder="VOC 내용을 입력해주세요" />
          </Form.Item>

          <Form.Item
            label="별점"
            name="rating"
          >
            <Rate />
          </Form.Item>

          <Form.Item label="사진 첨부 (최대 6개)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}  // 자동 업로드 방지
              maxCount={6}
              multiple
              accept="image/*"
            >
              {fileList.length >= 6 ? null : uploadButton}
            </Upload>
            <div style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
              * 이미지는 최대 6개까지 업로드할 수 있습니다 (각 10MB 이하)
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createMutation.isPending}
            >
              VOC 등록
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
