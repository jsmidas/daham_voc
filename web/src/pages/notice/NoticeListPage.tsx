/**
 * Notice List Page
 * @description 공지 관리 페이지 (목록 + 작성/수정/삭제)
 */

import { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Switch,
  DatePicker,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinFilled,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import {
  getAdminNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  type Notice,
  type NoticeTarget,
  type Division,
  type Role,
} from '@/api/notice.api';
import { getStaffList } from '@/api/staff.api';
import { useAuthStore } from '@/store/authStore';
import { RoleLabels, DivisionLabels } from '@/types/index';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

const TARGET_OPTIONS: { value: NoticeTarget; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'DIVISION', label: '부문별' },
  { value: 'ROLE', label: '역할별' },
  { value: 'USER', label: '개인별' },
];

const TARGET_LABEL: Record<NoticeTarget, string> = {
  ALL: '전체',
  DIVISION: '부문별',
  ROLE: '역할별',
  USER: '개인별',
};

const TARGET_COLOR: Record<NoticeTarget, string> = {
  ALL: 'magenta',
  DIVISION: 'blue',
  ROLE: 'green',
  USER: 'orange',
};

export default function NoticeListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [targetType, setTargetType] = useState<NoticeTarget | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [previewing, setPreviewing] = useState<Notice | null>(null);
  const [form] = Form.useForm();
  const watchTargetType = Form.useWatch('targetType', form) as NoticeTarget | undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['notices-admin', { page, limit, search, targetType }],
    queryFn: () => getAdminNotices({ page, limit, search, targetType }),
  });

  // 개인별 타겟 시 사용자 검색용 staff 목록 (한 번만 로딩)
  const { data: staffData } = useQuery({
    queryKey: ['notices-staff-options'],
    queryFn: () => getStaffList({ page: 1, limit: 500 }),
    enabled: watchTargetType === 'USER' || (editing?.targetType === 'USER'),
  });

  const userOptions = useMemo(() => {
    return (staffData?.items || []).map((s: any) => ({
      label: `${s.user?.name} (${RoleLabels[s.user?.role as Role] || s.user?.role}${s.user?.division ? ' · ' + DivisionLabels[s.user.division as Division] : ''})`,
      value: s.user?.id,
    }));
  }, [staffData]);

  const createMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      message.success('공지가 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['notices-admin'] });
      closeModal();
    },
    onError: (err: any) => {
      message.error(err?.data?.error?.message || err?.message || '등록 실패');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateNotice(id, data),
    onSuccess: () => {
      message.success('공지가 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['notices-admin'] });
      closeModal();
    },
    onError: (err: any) => {
      message.error(err?.data?.error?.message || err?.message || '수정 실패');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      message.success('공지가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['notices-admin'] });
    },
    onError: (err: any) => {
      message.error(err?.data?.error?.message || err?.message || '삭제 실패');
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      targetType: 'ALL',
      isPinned: false,
      saveAsDraft: false,
    });
    setModalOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditing(notice);
    form.setFieldsValue({
      title: notice.title,
      content: notice.content,
      targetType: notice.targetType,
      targetDivisions: notice.targetDivisions,
      targetRoles: notice.targetRoles,
      targetUserIds: notice.targetUserIds,
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt ? dayjs(notice.expiresAt) : null,
      saveAsDraft: !notice.publishedAt,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const payload: any = {
        title: values.title,
        content: values.content,
        targetType: values.targetType,
        targetDivisions: values.targetType === 'DIVISION' ? values.targetDivisions || [] : [],
        targetRoles: values.targetType === 'ROLE' ? values.targetRoles || [] : [],
        targetUserIds: values.targetType === 'USER' ? values.targetUserIds || [] : [],
        isPinned: !!values.isPinned,
        expiresAt: values.expiresAt ? (values.expiresAt as Dayjs).toISOString() : null,
        publishedAt: values.saveAsDraft ? null : new Date().toISOString(),
      };

      if (editing) {
        updateMutation.mutate({ id: editing.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    });
  };

  const columns: ColumnsType<Notice> = [
    {
      title: '',
      key: 'pin',
      width: 32,
      render: (_, n) =>
        n.isPinned ? <PushpinFilled style={{ color: '#faad14' }} /> : null,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, n) => (
        <Space>
          <a onClick={() => setPreviewing(n)} style={{ fontWeight: 500 }}>
            {title}
          </a>
          {!n.publishedAt && <Tag color="default">임시저장</Tag>}
          {n.expiresAt && dayjs(n.expiresAt).isBefore(dayjs()) && (
            <Tag color="red">만료</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '대상',
      key: 'target',
      width: 220,
      render: (_, n) => {
        const tag = (
          <Tag color={TARGET_COLOR[n.targetType]}>{TARGET_LABEL[n.targetType]}</Tag>
        );
        if (n.targetType === 'DIVISION') {
          return (
            <Space size={4} wrap>
              {tag}
              {n.targetDivisions.map((d) => (
                <Tag key={d}>{DivisionLabels[d as Division]}</Tag>
              ))}
            </Space>
          );
        }
        if (n.targetType === 'ROLE') {
          return (
            <Space size={4} wrap>
              {tag}
              {n.targetRoles.map((r) => (
                <Tag key={r}>{RoleLabels[r as Role] || r}</Tag>
              ))}
            </Space>
          );
        }
        if (n.targetType === 'USER') {
          return (
            <Space size={4}>
              {tag}
              <span>{n.targetUserIds.length}명</span>
            </Space>
          );
        }
        return tag;
      },
    },
    {
      title: '작성자',
      key: 'author',
      width: 120,
      render: (_, n) => n.author?.name || '-',
    },
    {
      title: '게시일',
      key: 'publishedAt',
      width: 160,
      render: (_, n) =>
        n.publishedAt ? dayjs(n.publishedAt).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '읽음',
      key: 'reads',
      width: 80,
      render: (_, n) => n._count?.reads ?? 0,
    },
    {
      title: '작업',
      key: 'action',
      width: 180,
      render: (_, n) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreviewing(n)}
          >
            미리보기
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(n)}
          >
            수정
          </Button>
          <Popconfirm
            title="이 공지를 삭제하시겠습니까?"
            onConfirm={() => deleteMutation.mutate(n.id)}
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h1 style={{ margin: 0 }}>공지 관리</h1>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            공지 작성
          </Button>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="제목/내용 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(v) => {
              setPage(1);
              setSearch(v);
            }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="대상 유형"
            value={targetType}
            onChange={(v) => {
              setPage(1);
              setTargetType(v);
            }}
            allowClear
            style={{ width: 140 }}
            options={TARGET_OPTIONS}
          />
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.data || []}
        columns={columns}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        size="middle"
      />

      <Modal
        title={editing ? '공지 수정' : '공지 작성'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={720}
        okText={editing ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="제목"
            name="title"
            rules={[{ required: true, message: '제목을 입력하세요' }]}
          >
            <Input placeholder="공지 제목" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="내용"
            name="content"
            rules={[{ required: true, message: '내용을 입력하세요' }]}
          >
            <TextArea
              placeholder="공지 내용을 입력하세요"
              autoSize={{ minRows: 6, maxRows: 14 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="대상 유형"
                name="targetType"
                rules={[{ required: true, message: '대상을 선택하세요' }]}
              >
                <Select options={TARGET_OPTIONS} disabled={!isSuperAdmin && watchTargetType === 'ALL'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="상단 고정" name="isPinned" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {watchTargetType === 'DIVISION' && (
            <Form.Item
              label="부문 선택"
              name="targetDivisions"
              rules={[{ required: true, message: '부문을 1개 이상 선택하세요' }]}
            >
              <Select
                mode="multiple"
                placeholder="부문 선택"
                options={Object.entries(DivisionLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          )}

          {watchTargetType === 'ROLE' && (
            <Form.Item
              label="역할 선택"
              name="targetRoles"
              rules={[{ required: true, message: '역할을 1개 이상 선택하세요' }]}
            >
              <Select
                mode="multiple"
                placeholder="역할 선택"
                options={Object.entries(RoleLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          )}

          {watchTargetType === 'USER' && (
            <Form.Item
              label="대상자 선택"
              name="targetUserIds"
              rules={[{ required: true, message: '대상자를 1명 이상 선택하세요' }]}
            >
              <Select
                mode="multiple"
                placeholder="이름/역할로 검색"
                options={userOptions}
                filterOption={(input, opt) =>
                  String(opt?.label || '').toLowerCase().includes(input.toLowerCase())
                }
                showSearch
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="만료 일시 (선택)" name="expiresAt">
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="설정하지 않으면 무기한"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="임시저장" name="saveAsDraft" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={previewing?.title}
        open={!!previewing}
        onCancel={() => setPreviewing(null)}
        footer={null}
        width={520}
      >
        {previewing && (
          <div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
              {previewing.author?.name} ·{' '}
              {previewing.publishedAt
                ? dayjs(previewing.publishedAt).format('YYYY-MM-DD HH:mm')
                : '임시저장'}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7 }}>
              {previewing.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
