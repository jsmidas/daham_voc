/**
 * Feedback List Page
 * @description VOC 관리 페이지
 */

import { Table, Tag, Button, Modal, Form, Input, message, Upload, Image, Rate, Select } from 'antd';
import { PlusOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeedbacks, replyToFeedback, createFeedback } from '@/api/feedback.api';
import { getSites } from '@/api/site.api';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

export default function FeedbackListPage() {
  const queryClient = useQueryClient();
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [replyForm] = Form.useForm();
  const [createForm] = Form.useForm();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => getFeedbacks(),
    retry: false,
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, data }: any) => replyToFeedback(id, data),
    onSuccess: () => {
      message.success('답변이 등록되었습니다');
      setIsReplyModalOpen(false);
      replyForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: any) => {
      message.error(error.message || '답변 등록 실패');
    },
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

  const handleRespond = (record: any) => {
    setSelectedFeedback(record);
    setIsReplyModalOpen(true);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const onReplyFinish = (values: any) => {
    respondMutation.mutate({
      id: selectedFeedback.id,
      data: values,
    });
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
          onClick={() => handleRespond(record)}
          disabled={record.status === 'CLOSED'}
        >
          답변
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
                label: `${site.name} (${site.type === 'CLIENT' ? '고객사' : '당사'})`,
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

      {/* VOC 답변 모달 */}
      <Modal
        title="VOC 답변"
        open={isReplyModalOpen}
        onCancel={() => setIsReplyModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            <strong>작성자:</strong> {selectedFeedback?.author?.name}
          </p>
          <p style={{ margin: '8px 0 0 0' }}>
            <strong>내용:</strong> {selectedFeedback?.content}
          </p>
          {selectedFeedback?.images && selectedFeedback.images.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>첨부 이미지:</strong>
              <Image.PreviewGroup>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {selectedFeedback.images.map((img: any, index: number) => (
                    <Image
                      key={index}
                      src={img.thumbnailUrl}
                      alt={`이미지 ${index + 1}`}
                      width={60}
                      height={60}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      preview={{
                        src: img.imageUrl,
                      }}
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}
        </div>

        <Form form={replyForm} layout="vertical" onFinish={onReplyFinish}>
          <Form.Item
            label="관리자 답변"
            name="adminReply"
            rules={[{ required: true, message: '답변을 입력하세요' }]}
          >
            <Input.TextArea rows={4} placeholder="고객님의 의견에 대한 답변을 입력해주세요" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={respondMutation.isPending}
            >
              답변 등록
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
