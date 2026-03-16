/**
 * ContractListPage
 * @description 전자 근로계약서 관리 페이지
 */

import React, { useState } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Upload, Select,
  message, Popconfirm, Card, Typography, Progress, Descriptions,
  Image as AntImage,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, DeleteOutlined, TeamOutlined,
  EyeOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContracts, createContract, assignContract,
  getContractStatus, deleteContract, removeAssignment,
} from '@/api/contract.api';
import { apiClient } from '@/utils/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ContractListPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  // 계약서 목록 조회
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts(),
  });

  // 직원 목록 (배정용)
  const { data: staffData } = useQuery({
    queryKey: ['staff-for-assign'],
    queryFn: () => apiClient.get('/staff', { params: { limit: 500 } }),
    enabled: assignModalOpen,
  });

  // 계약서 생성
  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      message.success('계약서가 생성되었습니다.');
      setCreateModalOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err: any) => message.error(err?.message || '생성 실패'),
  });

  // 대상자 배정
  const assignMutation = useMutation({
    mutationFn: (data: { contractId: string; userIds: string[]; expiresAt?: string }) =>
      assignContract(data.contractId, { userIds: data.userIds, expiresAt: data.expiresAt }),
    onSuccess: () => {
      message.success('대상자가 배정되었습니다.');
      setAssignModalOpen(false);
      assignForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err: any) => message.error(err?.message || '배정 실패'),
  });

  // 계약서 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      message.success('삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const handleCreate = async () => {
    const values = await form.validateFields();
    const pages = fileList.map((f: any) => f.originFileObj);
    createMutation.mutate({ title: values.title, description: values.description, pages });
  };

  const handleAssign = async () => {
    const values = await assignForm.validateFields();
    assignMutation.mutate({
      contractId: selectedContract.id,
      userIds: values.userIds,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
    });
  };

  const openStatus = async (contract: any) => {
    setSelectedContract(contract);
    try {
      const res = await getContractStatus(contract.id);
      setStatusData((res as any)?.data || res);
      setStatusModalOpen(true);
    } catch {
      message.error('현황 조회 실패');
    }
  };

  const contracts = (contractsData as any)?.data || [];

  const columns = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '페이지',
      dataIndex: 'pages',
      key: 'pages',
      width: 80,
      render: (pages: any[]) => `${pages?.length || 0}p`,
    },
    {
      title: '배정',
      dataIndex: 'assignments',
      key: 'assignments',
      width: 120,
      render: (assignments: any[]) => {
        if (!assignments || assignments.length === 0) return <Tag>미배정</Tag>;
        const signed = assignments.filter((a: any) => a.status === 'SIGNED').length;
        return (
          <Space direction="vertical" size={2}>
            <Text>{signed}/{assignments.length}명 서명</Text>
            <Progress
              percent={Math.round((signed / assignments.length) * 100)}
              size="small"
              showInfo={false}
            />
          </Space>
        );
      },
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => dayjs(d).format('YYYY.MM.DD'),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedContract(record); setViewerOpen(true); }}
          >
            보기
          </Button>
          <Button
            size="small"
            icon={<TeamOutlined />}
            onClick={() => { setSelectedContract(record); setAssignModalOpen(true); }}
          >
            배정
          </Button>
          <Button
            size="small"
            onClick={() => openStatus(record)}
          >
            현황
          </Button>
          <Popconfirm title="삭제하시겠습니까?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const staffOptions = ((staffData as any)?.data || []).map((s: any) => ({
    label: `${s.user?.name || s.name} (${s.user?.phone || ''})`,
    value: s.user?.id || s.userId,
  }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>전자 근로계약서</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          계약서 생성
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={contracts}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />

      {/* 계약서 생성 모달 */}
      <Modal
        title="계약서 생성"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); setFileList([]); }}
        confirmLoading={createMutation.isPending}
        okText="생성"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요' }]}>
            <Input placeholder="예: 2026년 3월 근로계약서" />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <TextArea rows={2} placeholder="계약서 설명 (선택)" />
          </Form.Item>
          <Form.Item label="계약서 페이지 (이미지)" required>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
              accept="image/*"
              multiple
            >
              {fileList.length < 20 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>업로드</div>
                </div>
              )}
            </Upload>
            <Text type="secondary">여러 페이지 이미지를 순서대로 업로드하세요 (최대 20장)</Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* 대상자 배정 모달 */}
      <Modal
        title={`대상자 배정 - ${selectedContract?.title || ''}`}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); }}
        confirmLoading={assignMutation.isPending}
        okText="배정"
        width={600}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="userIds"
            label="대상자 선택"
            rules={[{ required: true, message: '대상자를 선택하세요' }]}
          >
            <Select
              mode="multiple"
              placeholder="직원을 검색하세요"
              options={staffOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 서명 현황 모달 */}
      <Modal
        title={`서명 현황 - ${selectedContract?.title || ''}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
        width={700}
      >
        {statusData && (
          <>
            <Descriptions bordered size="small" column={4} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="전체">{statusData.summary?.total}명</Descriptions.Item>
              <Descriptions.Item label={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> 서명</>}>
                {statusData.summary?.signed}명
              </Descriptions.Item>
              <Descriptions.Item label={<><ClockCircleOutlined style={{ color: '#fa8c16' }} /> 대기</>}>
                {statusData.summary?.pending}명
              </Descriptions.Item>
              <Descriptions.Item label={<><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> 만료</>}>
                {statusData.summary?.expired}명
              </Descriptions.Item>
            </Descriptions>
            <Table
              size="small"
              dataSource={statusData.assignments || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '이름', dataIndex: ['user', 'name'], key: 'name' },
                { title: '연락처', dataIndex: ['user', 'phone'], key: 'phone' },
                { title: '역할', dataIndex: ['user', 'role'], key: 'role' },
                {
                  title: '상태',
                  dataIndex: 'status',
                  key: 'status',
                  render: (s: string) => {
                    const map: Record<string, { color: string; text: string }> = {
                      SIGNED: { color: 'green', text: '서명 완료' },
                      PENDING: { color: 'orange', text: '대기 중' },
                      EXPIRED: { color: 'red', text: '만료' },
                    };
                    const info = map[s] || map.PENDING;
                    return <Tag color={info.color}>{info.text}</Tag>;
                  },
                },
                {
                  title: '서명일',
                  dataIndex: 'signedAt',
                  key: 'signedAt',
                  render: (d: string) => d ? dayjs(d).format('YYYY.MM.DD HH:mm') : '-',
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* 계약서 뷰어 모달 */}
      <Modal
        title={selectedContract?.title || '계약서'}
        open={viewerOpen}
        onCancel={() => setViewerOpen(false)}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: 'center' }}>
          <AntImage.PreviewGroup>
            {selectedContract?.pages?.map((page: any) => (
              <div key={page.id} style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {page.pageNumber}페이지
                </Text>
                <AntImage
                  src={page.imageUrl}
                  style={{ maxWidth: '100%', maxHeight: 600 }}
                />
              </div>
            ))}
          </AntImage.PreviewGroup>
        </div>
      </Modal>
    </div>
  );
}
