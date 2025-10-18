/**
 * Staff List Page
 * @description 담당자 목록 페이지
 */

import { useState } from 'react';
import { Table, Button, Input, Select, Space, message, Popconfirm, Tag, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStaffList, deleteStaff, resetStaffPassword } from '@/api/staff.api';
import type { Staff, Division, Role } from '@/api/staff.api';
import { RoleLabels, DivisionLabels } from '@/types/index';
import type { ColumnsType } from 'antd/es/table';

export default function StaffListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 필터 상태
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [division, setDivision] = useState<Division | undefined>();
  const [role, setRole] = useState<Role | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 담당자 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['staff', { page, limit, division, role, search }],
    queryFn: () => getStaffList({ page, limit, division, role, search }),
  });

  // 담당자 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      message.success('담당자가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '삭제 실패');
    },
  });

  // 비밀번호 초기화 mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetStaffPassword(id, newPassword),
    onSuccess: () => {
      message.success('비밀번호가 "1234"로 초기화되었습니다');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '비밀번호 초기화 실패');
    },
  });

  // 검색 실행
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  // 필터 초기화
  const handleReset = () => {
    setDivision(undefined);
    setRole(undefined);
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  // 비밀번호 초기화 (기본값 "1234")
  const handleResetPassword = (id: string) => {
    resetPasswordMutation.mutate({ id, newPassword: '1234' });
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Staff> = [
    {
      title: '사번',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 120,
    },
    {
      title: '이름',
      dataIndex: ['user', 'name'],
      key: 'name',
      width: 120,
    },
    {
      title: '전화번호',
      dataIndex: ['user', 'phone'],
      key: 'phone',
      width: 140,
    },
    {
      title: '이메일',
      dataIndex: ['user', 'email'],
      key: 'email',
      width: 200,
      render: (email) => email || '-',
    },
    {
      title: '권한',
      dataIndex: ['user', 'role'],
      key: 'role',
      width: 140,
      render: (role: Role) => (
        <Tag color={role === 'SUPER_ADMIN' ? 'red' : role.includes('ADMIN') ? 'blue' : 'green'}>
          {RoleLabels[role]}
        </Tag>
      ),
    },
    {
      title: '부문',
      dataIndex: ['user', 'division'],
      key: 'division',
      width: 100,
      render: (div?: Division) => (div ? DivisionLabels[div] : '-'),
    },
    {
      title: '부서',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept) => dept || '-',
    },
    {
      title: '직책',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      render: (pos) => pos || '-',
    },
    {
      title: '배정된 사업장',
      dataIndex: 'staffSites',
      key: 'sites',
      width: 120,
      render: (sites: any[]) => sites?.length || 0,
    },
    {
      title: '상태',
      dataIndex: ['user', 'isActive'],
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '활성' : '비활성'}</Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/staff/${record.id}/edit`)}
          >
            수정
          </Button>
          <Popconfirm
            title="비밀번호 초기화"
            description="비밀번호를 '1234'로 초기화하시겠습니까?"
            onConfirm={() => handleResetPassword(record.id)}
            okText="초기화"
            cancelText="취소"
          >
            <Button type="link" size="small" icon={<KeyOutlined />}>
              비밀번호
            </Button>
          </Popconfirm>
          <Popconfirm
            title="담당자 삭제"
            description="정말 삭제하시겠습니까?"
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
      {/* 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>담당자 관리</h1>
      </div>

      {/* 필터 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="부문 선택"
              value={division}
              onChange={setDivision}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="HQ">본사</Select.Option>
              <Select.Option value="YEONGNAM">영남지사</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="권한 선택"
              value={role}
              onChange={setRole}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="SUPER_ADMIN">슈퍼 관리자</Select.Option>
              <Select.Option value="HQ_ADMIN">본사 관리자</Select.Option>
              <Select.Option value="YEONGNAM_ADMIN">영남 관리자</Select.Option>
              <Select.Option value="GROUP_MANAGER">그룹 관리자</Select.Option>
              <Select.Option value="SITE_MANAGER">사업장 관리자</Select.Option>
              <Select.Option value="SITE_STAFF">사업장 담당자</Select.Option>
              <Select.Option value="DELIVERY_DRIVER">배송 기사</Select.Option>
              <Select.Option value="CLIENT">고객사</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="이름, 전화번호, 이메일, 사번 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                초기화
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/staff/new')}>
                담당자 추가
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.pagination.total || 0,
            onChange: (newPage) => setPage(newPage),
            showTotal: (total) => `총 ${total}명`,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
