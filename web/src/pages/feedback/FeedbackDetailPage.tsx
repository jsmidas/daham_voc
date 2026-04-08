/**
 * Feedback Detail Page
 * @description VOC 상세 페이지 - 전체 내용 + 다중 답변
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Button, Tag, Image, Space, Divider, Input, message, Select, Timeline, Popconfirm, Spin,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, StarFilled, DeleteOutlined,
} from '@ant-design/icons';
import { getFeedbackById, addFeedbackReply, deleteFeedbackReply, updateFeedbackStatus } from '@/api/feedback.api';

const { TextArea } = Input;

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'red' },
  IN_PROGRESS: { label: '처리중', color: 'orange' },
  RESOLVED: { label: '완료', color: 'green' },
  CLOSED: { label: '종료', color: 'default' },
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: '슈퍼관리자',
  HQ_ADMIN: '본사관리자',
  YEONGNAM_ADMIN: '영남관리자',
  GROUP_MANAGER: '그룹관리자',
  SITE_MANAGER: '사업장관리자',
  SITE_STAFF: '사업장담당자',
  DELIVERY_DRIVER: '배송기사',
  CLIENT: '고객사',
  CUSTOMER: '일반고객',
};

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => getFeedbackById(id!),
    enabled: !!id,
  });

  const feedback = (feedbackData as any)?.data || feedbackData;

  const addReplyMutation = useMutation({
    mutationFn: () => addFeedbackReply(id!, { content: replyContent }),
    onSuccess: () => {
      message.success('답변이 등록되었습니다');
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '답변 등록 실패');
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => deleteFeedbackReply(replyId),
    onSuccess: () => {
      message.success('답변이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateFeedbackStatus(id!, { status }),
    onSuccess: () => {
      message.success('상태가 변경되었습니다');
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '상태 변경 실패');
    },
  });

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  if (!feedback) {
    return <div style={{ textAlign: 'center', padding: 100 }}>VOC를 찾을 수 없습니다</div>;
  }

  const status = statusLabels[feedback.status] || statusLabels.PENDING;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/feedbacks')}>
          목록으로
        </Button>
        <Space>
          <span>상태:</span>
          <Select
            value={feedback.status}
            onChange={(value) => statusMutation.mutate(value)}
            style={{ width: 120 }}
          >
            <Select.Option value="PENDING">대기</Select.Option>
            <Select.Option value="IN_PROGRESS">처리중</Select.Option>
            <Select.Option value="RESOLVED">완료</Select.Option>
            <Select.Option value="CLOSED">종료</Select.Option>
          </Select>
        </Space>
      </div>

      {/* VOC 본문 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space size="middle">
            <Tag color={feedback.site?.division === 'HQ' ? 'blue' : feedback.site?.division === 'YEONGNAM' ? 'green' : 'orange'}>
              {feedback.site?.division === 'HQ' ? '본사' : feedback.site?.division === 'YEONGNAM' ? '영남' : '위탁'}
            </Tag>
            <strong style={{ fontSize: 16 }}>{feedback.site?.name}</strong>
            <Tag color={status.color}>{status.label}</Tag>
          </Space>
          <span style={{ color: '#999' }}>
            {new Date(feedback.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 작성자 정보 */}
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
          <Space>
            <UserOutlined />
            <strong>{feedback.author?.name}</strong>
            <Tag>{roleLabels[feedback.author?.role] || feedback.authorType}</Tag>
            {feedback.rating > 0 && (
              <span>
                {Array.from({ length: feedback.rating }).map((_, i) => (
                  <StarFilled key={i} style={{ color: '#faad14', fontSize: 14 }} />
                ))}
              </span>
            )}
          </Space>
        </div>

        {/* 내용 */}
        <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
          {feedback.content}
        </div>

        {/* 이미지 */}
        {feedback.images?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Image.PreviewGroup>
              <Space wrap>
                {feedback.images.map((img: any) => (
                  <Image
                    key={img.id}
                    src={img.thumbnailUrl || img.imageUrl}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}

        {/* 기존 adminReply (레거시) */}
        {feedback.adminReply && (
          <>
            <Divider />
            <div style={{ padding: '12px 16px', background: '#e6f7ff', borderRadius: 8 }}>
              <strong>관리자 답변</strong>
              <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                {feedback.repliedAt && new Date(feedback.repliedAt).toLocaleString('ko-KR')}
              </span>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{feedback.adminReply}</div>
            </div>
          </>
        )}
      </Card>

      {/* 답변 목록 */}
      <Card title={`답변 (${feedback.replies?.length || 0}건)`} style={{ marginTop: 16 }}>
        {feedback.replies?.length > 0 ? (
          <Timeline
            items={feedback.replies.map((reply: any) => ({
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      <strong>{reply.author?.name}</strong>
                      <Tag color="blue" style={{ fontSize: 11 }}>{roleLabels[reply.author?.role] || reply.author?.role}</Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {new Date(reply.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </Space>
                    <Popconfirm
                      title="답변을 삭제하시겠습니까?"
                      onConfirm={() => deleteReplyMutation.mutate(reply.id)}
                      okText="삭제"
                      cancelText="취소"
                    >
                      <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{reply.content}</div>
                </div>
              ),
            }))}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            아직 답변이 없습니다
          </div>
        )}

        {/* 답변 작성 */}
        <Divider />
        <TextArea
          rows={3}
          placeholder="답변을 입력하세요..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => addReplyMutation.mutate()}
            disabled={!replyContent.trim()}
            loading={addReplyMutation.isPending}
          >
            답변 등록
          </Button>
        </div>
      </Card>
    </div>
  );
}
