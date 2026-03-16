/**
 * ContractListPage
 * @description 전자 근로계약서 관리 페이지
 */

import { useState } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Upload, Select,
  message, Popconfirm, Typography, Progress, Descriptions,
  Image as AntImage, DatePicker, Alert,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, DeleteOutlined, TeamOutlined,
  EyeOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContracts, createContract, assignContract,
  getContractStatus, deleteContract, getContractTargets,
  assignMultipleContracts,
} from '@/api/contract.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ContractListPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [bulkAssignForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);

  // 계약서 목록 조회
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts(),
  });

  // 계약 대상자 목록 조회
  const { data: targetsData } = useQuery({
    queryKey: ['contract-targets'],
    queryFn: () => getContractTargets(),
    enabled: bulkAssignModalOpen || assignModalOpen,
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

  // 대상자 배정 (단건)
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

  // 일괄 배정
  const bulkAssignMutation = useMutation({
    mutationFn: (data: { contractIds: string[]; userIds: string[]; expiresAt?: string }) =>
      assignMultipleContracts(data),
    onSuccess: (res: any) => {
      const result = res?.data;
      message.success(`${result?.contracts || 0}건의 계약서에 ${result?.count || 0}건 배정 완료`);
      setBulkAssignModalOpen(false);
      bulkAssignForm.resetFields();
      setSelectedContractIds([]);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err: any) => message.error(err?.message || '일괄 배정 실패'),
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

  const handleBulkAssign = async () => {
    const values = await bulkAssignForm.validateFields();
    bulkAssignMutation.mutate({
      contractIds: selectedContractIds,
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
  const targets = (targetsData as any)?.data || [];

  const targetOptions = targets.map((t: any) => ({
    label: `${t.name} (${t.phone})`,
    value: t.id,
  }));

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

  const rowSelection = {
    selectedRowKeys: selectedContractIds,
    onChange: (keys: React.Key[]) => setSelectedContractIds(keys as string[]),
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>전자 근로계약서</Title>
        <Space>
          {selectedContractIds.length > 0 && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => setBulkAssignModalOpen(true)}
            >
              선택 계약서 일괄 배정 ({selectedContractIds.length}건)
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            계약서 생성
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={contracts}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        rowSelection={rowSelection}
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

      {/* 대상자 배정 모달 (단건) */}
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
          {targetOptions.length > 0 && (
            <Alert
              message={`계약 대상자 ${targetOptions.length}명이 자동으로 선택됩니다. 담당자 관리에서 대상자를 설정할 수 있습니다.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item
            name="userIds"
            label="대상자 선택"
            rules={[{ required: true, message: '대상자를 선택하세요' }]}
            initialValue={targetOptions.map((t: any) => t.value)}
          >
            <Select
              mode="multiple"
              placeholder="대상자를 검색하세요"
              options={targetOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="expiresAt" label="서명 기한 (선택)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 일괄 배정 모달 */}
      <Modal
        title={`일괄 배정 - ${selectedContractIds.length}건의 계약서`}
        open={bulkAssignModalOpen}
        onOk={handleBulkAssign}
        onCancel={() => { setBulkAssignModalOpen(false); bulkAssignForm.resetFields(); }}
        confirmLoading={bulkAssignMutation.isPending}
        okText="일괄 배정"
        width={700}
      >
        <Alert
          message={`선택된 계약서 ${selectedContractIds.length}건이 선택한 대상자 전원에게 각각 배정됩니다. 대상자는 각 계약서에 개별 서명해야 합니다.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginBottom: 16 }}>
          <Text strong>선택된 계약서:</Text>
          <div style={{ marginTop: 8 }}>
            {contracts
              .filter((c: any) => selectedContractIds.includes(c.id))
              .map((c: any) => (
                <Tag key={c.id} style={{ marginBottom: 4 }}>{c.title}</Tag>
              ))
            }
          </div>
        </div>
        <Form form={bulkAssignForm} layout="vertical">
          {targetOptions.length > 0 && (
            <Alert
              message={`계약 대상자 ${targetOptions.length}명이 자동으로 선택됩니다.`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item
            name="userIds"
            label="대상자 선택"
            rules={[{ required: true, message: '대상자를 선택하세요' }]}
            initialValue={targetOptions.map((t: any) => t.value)}
          >
            <Select
              mode="multiple"
              placeholder="대상자를 검색하세요"
              options={targetOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="expiresAt" label="서명 기한 (선택)">
            <DatePicker style={{ width: '100%' }} />
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
