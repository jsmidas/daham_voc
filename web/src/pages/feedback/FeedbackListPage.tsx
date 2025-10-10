/**
 * Feedback List Page
 * @description VOC 관리 페이지
 */

import { Table, Tag, Button, Modal, Form, Input, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeedbacks, replyToFeedback } from '@/api/feedback.api';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function FeedbackListPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => getFeedbacks(),
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, data }: any) => replyToFeedback(id, data),
    onSuccess: () => {
      message.success('답변이 등록되었습니다');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: any) => {
      message.error(error.message || '답변 등록 실패');
    },
  });

  const handleRespond = (record: any) => {
    setSelectedFeedback(record);
    setIsModalOpen(true);
  };

  const onFinish = (values: any) => {
    respondMutation.mutate({
      id: selectedFeedback.id,
      data: values,
    });
  };

  const columns = [
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
      width: 80,
      render: (rating: number) => rating ? `⭐ ${rating}` : '-',
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
      {/* 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>VOC 관리</h1>
      </div>

      <Table
        columns={columns}
        dataSource={feedbacks?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="VOC 답변"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
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
