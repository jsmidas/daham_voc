/**
 * Site List Page
 * @description 사업장 목록 페이지
 */

import { Table, Button, Space, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSites, deleteSite } from '@/api/site.api';
import { useState } from 'react';

const { Search } = Input;

export default function SiteListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [divisionFilter, setDivisionFilter] = useState<string | undefined>();

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', { search, type: typeFilter, division: divisionFilter }],
    queryFn: () => getSites({ search, type: typeFilter, division: divisionFilter }),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      message.success('사업장이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: any) => {
      message.error(error.message || '삭제 실패');
    },
  });

  const columns = [
    {
      title: '사업장명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/sites/${record.id}/edit`)}
          >
            수정
          </Button>
          <Popconfirm
            title="삭제하시겠습니까?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 제목과 주요 액션 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>사업장 관리</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/sites/new')}
        >
          사업장 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Search
          placeholder="사업장명 검색"
          onSearch={setSearch}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="부문 선택"
          style={{ width: 150 }}
          allowClear
          onChange={setDivisionFilter}
          value={divisionFilter}
        >
          <Select.Option value="HQ">본사</Select.Option>
          <Select.Option value="YEONGNAM">영남지사</Select.Option>
        </Select>
        <Select
          placeholder="유형 선택"
          style={{ width: 150 }}
          allowClear
          onChange={setTypeFilter}
          value={typeFilter}
        >
          <Select.Option value="위탁">위탁</Select.Option>
          <Select.Option value="운반급식">운반급식</Select.Option>
          <Select.Option value="도시락">도시락</Select.Option>
          <Select.Option value="행사">행사</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={sites?.data?.sites || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
