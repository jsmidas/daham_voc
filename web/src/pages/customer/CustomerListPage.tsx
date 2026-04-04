/**
 * 고객 관리 페이지
 * @description CUSTOMER 역할 사용자 관리 (셀프 회원가입 고객)
 */

import { useState } from 'react';
import { Table, Input, Button, Tag, Space, Card, Popconfirm, message, Modal } from 'antd';
import { SearchOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaffList, deleteStaff, resetStaffPassword } from '@/api/staff.api';

export default function CustomerListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetModal, setResetModal] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetTargetName, setResetTargetName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: () => getStaffList({ role: 'CUSTOMER' as any, search, page, limit: 20 }),
  });

  const items = (data as any)?.items || [];
  const total = (data as any)?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('고객이 삭제되었습니다');
    },
    onError: () => message.error('삭제 실패'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetStaffPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setResetModal(false);
      setNewPassword('');
      message.success('비밀번호가 초기화되었습니다');
    },
    onError: () => message.error('비밀번호 초기화 실패'),
  });

  const columns = [
    {
      title: '성명',
      key: 'name',
      render: (_: any, record: any) => record.user?.name || record.name,
    },
    {
      title: '핸드폰번호',
      key: 'phone',
      render: (_: any, record: any) => record.user?.phone || record.phone,
    },
    {
      title: '배정 사업장',
      key: 'site',
      render: (_: any, record: any) => {
        const sites = record.staffSites?.filter((s: any) => !s.removedAt) || [];
        return sites.length > 0
          ? sites.map((s: any) => (
              <Tag key={s.id} color="blue">{s.site?.name}</Tag>
            ))
          : <span style={{ color: '#999' }}>없음</span>;
      },
    },
    {
      title: '상태',
      key: 'isActive',
      width: 80,
      render: (_: any, record: any) => (
        <Tag color={(record.user?.isActive ?? record.isActive) ? 'green' : 'red'}>
          {(record.user?.isActive ?? record.isActive) ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '가입일',
      key: 'createdAt',
      width: 120,
      render: (_: any, record: any) => {
        const date = record.user?.createdAt || record.createdAt;
        return date ? new Date(date).toLocaleDateString('ko-KR') : '-';
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => {
        const id = record.id;
        const name = record.user?.name || record.name;
        return (
          <Space>
            <Button
              size="small"
              icon={<LockOutlined />}
              onClick={() => {
                setResetTargetId(id);
                setResetTargetName(name);
                setNewPassword('');
                setResetModal(true);
              }}
            >
              비번초기화
            </Button>
            <Popconfirm
              title={`"${name}" 고객을 삭제하시겠습니까?`}
              onConfirm={() => deleteMutation.mutate(id)}
              okText="삭제"
              cancelText="취소"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>고객 관리</h2>
        <span style={{ color: '#999', fontSize: 13 }}>
          앱에서 회원가입한 고객(CUSTOMER) 목록입니다
        </span>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="이름 또는 전화번호 검색"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Table
          dataSource={items}
          columns={columns}
          rowKey={(r) => r.id}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: setPage,
            showTotal: (t) => `총 ${t}명`,
          }}
          size="middle"
        />
      </Card>

      {/* 비밀번호 초기화 모달 */}
      <Modal
        title={`비밀번호 초기화 - ${resetTargetName}`}
        open={resetModal}
        onCancel={() => setResetModal(false)}
        onOk={() => {
          if (!resetTargetId || !newPassword) {
            message.error('새 비밀번호를 입력하세요');
            return;
          }
          resetPasswordMutation.mutate({ id: resetTargetId, password: newPassword });
        }}
        confirmLoading={resetPasswordMutation.isPending}
        okText="초기화"
      >
        <p style={{ color: '#666', marginBottom: 12 }}>새 비밀번호를 입력하세요.</p>
        <Input.Password
          placeholder="새 비밀번호 (4자리 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>
    </div>
  );
}
