/**
 * ContractListPage
 * @description 전자 근로계약서 관리 페이지
 */

import { useState, useRef, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Upload, Select,
  message, Popconfirm, Typography, Progress, Descriptions,
  Image as AntImage, DatePicker, Alert,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, DeleteOutlined, TeamOutlined,
  EyeOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, SendOutlined, EditOutlined,
  PrinterOutlined, FileImageOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContracts, createContract, assignContract,
  getContractStatus, deleteContract, getContractTargets,
  assignMultipleContracts, replaceSignZones, removeAssignment,
} from '@/api/contract.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SignZoneItem {
  label: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder: number;
  signGroup: number;
}

const ZONE_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

/** 다중 서명 영역 드래그 배치 컴포넌트 */
function SignZoneEditor({
  pages,
  initialZones,
  onSave,
  saving,
}: {
  pages: any[];
  initialZones: SignZoneItem[];
  onSave: (zones: SignZoneItem[]) => void;
  saving: boolean;
}) {
  const [selectedPage, setSelectedPage] = useState(initialZones[0]?.pageNumber || 1);
  const [zones, setZones] = useState<SignZoneItem[]>(initialZones);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [drawingZone, setDrawingZone] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newSignGroup, setNewSignGroup] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setStartPos(pos);
    setDragging(true);
    setDrawingZone({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [getRelativePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !startPos) return;
    const pos = getRelativePos(e);
    setDrawingZone({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  }, [dragging, startPos, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (drawingZone && drawingZone.w >= 2 && drawingZone.h >= 2) {
      const label = newLabel.trim() || `서명 ${zones.length + 1}`;
      setZones((prev) => [...prev, {
        label,
        pageNumber: selectedPage,
        x: Math.round(drawingZone.x * 100) / 100,
        y: Math.round(drawingZone.y * 100) / 100,
        width: Math.round(drawingZone.w * 100) / 100,
        height: Math.round(drawingZone.h * 100) / 100,
        sortOrder: prev.length,
        signGroup: newSignGroup,
      }]);
      setNewLabel('');
    }
    setDragging(false);
    setStartPos(null);
    setDrawingZone(null);
  }, [drawingZone, selectedPage, zones.length, newLabel]);

  const removeZone = (index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index).map((z, i) => ({ ...z, sortOrder: i })));
  };

  const currentPage = pages.find((p: any) => p.pageNumber === selectedPage);
  const zonesForPage = zones.filter((z) => z.pageNumber === selectedPage);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <Text strong>페이지:</Text>
          <Select
            value={selectedPage}
            onChange={(v) => setSelectedPage(v)}
            style={{ width: 120, marginLeft: 8 }}
          >
            {pages.map((p: any) => (
              <Select.Option key={p.pageNumber} value={p.pageNumber}>
                {p.pageNumber}페이지
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <Text strong>라벨:</Text>
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`서명 ${zones.length + 1}`}
            style={{ width: 160, marginLeft: 8 }}
          />
        </div>
        <div>
          <Text strong>서명 그룹:</Text>
          <Select
            value={newSignGroup}
            onChange={(v) => setNewSignGroup(v)}
            style={{ width: 120, marginLeft: 8 }}
          >
            {[1, 2, 3, 4, 5].map((g) => (
              <Select.Option key={g} value={g}>그룹 {g}</Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <Alert
        message="같은 서명 그룹의 영역은 한번 서명으로 동시에 적용됩니다. 다른 그룹은 별도 서명이 필요합니다."
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
      />

      <Alert
        message="드래그하여 서명 영역을 추가하세요. 여러 영역을 추가할 수 있습니다."
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
      />

      {zones.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text strong>등록된 서명 영역 ({zones.length}개):</Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {zones.map((z, i) => (
              <Tag
                key={i}
                color={ZONE_COLORS[(z.signGroup - 1) % ZONE_COLORS.length]}
                closable
                onClose={() => removeZone(i)}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPage(z.pageNumber)}
              >
                {z.label} ({z.pageNumber}p) [그룹{z.signGroup}]
              </Tag>
            ))}
          </div>
        </div>
      )}

      {currentPage && (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            cursor: 'crosshair',
            userSelect: 'none',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            overflow: 'hidden',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={currentPage.imageUrl}
            alt={`${selectedPage}페이지`}
            style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
            draggable={false}
          />
          {/* 저장된 영역들 */}
          {zonesForPage.map((z, i) => {
            const colorIdx = (z.signGroup - 1) % ZONE_COLORS.length;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.width}%`,
                  height: `${z.height}%`,
                  border: `2px solid ${ZONE_COLORS[colorIdx]}`,
                  backgroundColor: `${ZONE_COLORS[colorIdx]}22`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{
                  color: ZONE_COLORS[colorIdx],
                  fontWeight: 'bold',
                  fontSize: 11,
                  textShadow: '0 0 3px white, 0 0 3px white',
                }}>
                  {z.label} [G{z.signGroup}]
                </span>
              </div>
            );
          })}
          {/* 드래그 중인 영역 */}
          {drawingZone && drawingZone.w > 0 && drawingZone.h > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${drawingZone.x}%`,
                top: `${drawingZone.y}%`,
                width: `${drawingZone.w}%`,
                height: `${drawingZone.h}%`,
                border: '2px dashed #1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.15)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          disabled={zones.length === 0}
          loading={saving}
          onClick={() => onSave(zones)}
        >
          서명 영역 저장 ({zones.length}개)
        </Button>
      </div>
    </div>
  );
}

export default function ContractListPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [signZoneModalOpen, setSignZoneModalOpen] = useState(false);
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
    onSuccess: (res: any) => {
      message.success('계약서가 생성되었습니다. 서명 영역을 지정해주세요.');
      setCreateModalOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      // 생성된 계약서로 서명 영역 설정 모달 열기
      const contract = res?.data;
      if (contract) {
        setSelectedContract(contract);
        setSignZoneModalOpen(true);
      }
    },
    onError: (err: any) => message.error(err?.message || '생성 실패'),
  });

  // 서명 영역 저장
  const signZoneMutation = useMutation({
    mutationFn: (data: { contractId: string; zones: SignZoneItem[] }) =>
      replaceSignZones(data.contractId, data.zones),
    onSuccess: (res: any) => {
      message.success('서명 영역이 저장되었습니다.');
      setSignZoneModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      // selectedContract 갱신 (다시 열 때 최신 signZones 반영)
      const updated = res?.data;
      if (updated) setSelectedContract(updated);
    },
    onError: (err: any) => message.error(err?.message || '저장 실패'),
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
      title: '서명',
      key: 'signZone',
      width: 100,
      render: (_: any, record: any) => {
        const zoneCount = record.signZones?.length || 0;
        return zoneCount > 0
          ? <Tag color="green">{zoneCount}개 설정됨</Tag>
          : <Tag color="red">미설정</Tag>;
      },
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
      width: 100,
      render: (d: string) => dayjs(d).format('YYYY.MM.DD'),
    },
    {
      title: '',
      key: 'actions',
      width: 250,
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
            icon={<EditOutlined />}
            onClick={() => { setSelectedContract(record); setSignZoneModalOpen(true); }}
          >
            서명설정
          </Button>
          <Button
            size="small"
            icon={<TeamOutlined />}
            onClick={() => {
              setSelectedContract(record);
              setAssignModalOpen(true);
              // 기존 배정된 사용자만 선택 상태로 설정
              const existingUserIds = (record.assignments || []).map((a: any) => a.userId);
              setTimeout(() => assignForm.setFieldsValue({ userIds: existingUserIds }), 0);
            }}
          >
            배정
          </Button>
          <Button size="small" onClick={() => openStatus(record)}>현황</Button>
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

      {/* 서명 영역 설정 모달 */}
      <Modal
        title={`서명 영역 설정 - ${selectedContract?.title || ''}`}
        open={signZoneModalOpen}
        onCancel={() => setSignZoneModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedContract?.pages?.length > 0 && (
          <SignZoneEditor
            pages={selectedContract.pages}
            initialZones={(selectedContract.signZones || []).map((z: any) => ({
              label: z.label,
              pageNumber: z.pageNumber,
              x: z.x,
              y: z.y,
              width: z.width,
              height: z.height,
              sortOrder: z.sortOrder,
              signGroup: z.signGroup || 1,
            }))}
            onSave={(zones) => {
              signZoneMutation.mutate({ contractId: selectedContract.id, zones });
            }}
            saving={signZoneMutation.isPending}
          />
        )}
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
          <Form.Item
            name="userIds"
            label="대상자 선택"
            rules={[{ required: true, message: '대상자를 선택하세요' }]}
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
                {
                  title: '',
                  key: 'action',
                  width: 60,
                  render: (_: any, record: any) => (
                    <Popconfirm
                      title="이 배정을 삭제하시겠습니까?"
                      onConfirm={async () => {
                        try {
                          await removeAssignment(record.id);
                          message.success('배정이 삭제되었습니다.');
                          // 현황 새로고침
                          const res = await getContractStatus(selectedContract.id);
                          setStatusData((res as any)?.data || res);
                          queryClient.invalidateQueries({ queryKey: ['contracts'] });
                        } catch {
                          message.error('삭제 실패');
                        }
                      }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ),
                },
                {
                  title: '서명 문서',
                  key: 'signedDoc',
                  width: 120,
                  render: (_: any, record: any) => {
                    if (record.status !== 'SIGNED') return '-';
                    if (!record.signedDocumentUrl) return '-';

                    // signedDocumentUrl은 JSON 배열: [{pageNumber, url}]
                    let signedPages: { pageNumber: number; url: string }[] = [];
                    try {
                      signedPages = JSON.parse(record.signedDocumentUrl);
                    } catch {
                      // 레거시: 단일 URL
                      signedPages = [{ pageNumber: 1, url: record.signedDocumentUrl }];
                    }

                    const signedPageMap = new Map(signedPages.map((sp) => [sp.pageNumber, sp.url]));

                    return (
                      <Space size={4}>
                        <Button
                          size="small"
                          icon={<FileImageOutlined />}
                          onClick={() => {
                            const contract = selectedContract;
                            const allPages = contract?.pages || [];
                            Modal.info({
                              title: `${record.user?.name} 서명 문서`,
                              width: 800,
                              content: (
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                  {allPages.map((p: any) => (
                                    <div key={p.pageNumber} style={{ marginBottom: 8 }}>
                                      <img
                                        src={signedPageMap.get(p.pageNumber) || p.imageUrl}
                                        alt={`${p.pageNumber}페이지`}
                                        style={{ maxWidth: '100%' }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ),
                            });
                          }}
                        >
                          보기
                        </Button>
                        <Button
                          size="small"
                          icon={<PrinterOutlined />}
                          onClick={() => {
                            const printWin = window.open('', '_blank');
                            if (printWin) {
                              const contract = selectedContract;
                              const allPages = contract?.pages || [];
                              printWin.document.write(`<html><head><title>${record.user?.name} - ${contract?.title}</title>
                                <style>
                                  @media print { @page { margin: 10mm; } img { page-break-after: always; } }
                                  body { margin: 0; text-align: center; }
                                  img { max-width: 100%; height: auto; }
                                </style></head><body>`);
                              allPages.forEach((p: any) => {
                                const imgSrc = signedPageMap.get(p.pageNumber) || p.imageUrl;
                                printWin.document.write(`<img src="${imgSrc}" />`);
                              });
                              printWin.document.write('</body></html>');
                              printWin.document.close();
                              printWin.onload = () => { printWin.print(); };
                            }
                          }}
                        >
                          인쇄
                        </Button>
                      </Space>
                    );
                  },
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
            {selectedContract?.pages?.map((page: any) => {
              const zonesForPage = (selectedContract?.signZones || []).filter(
                (z: any) => z.pageNumber === page.pageNumber
              );
              return (
                <div key={page.id} style={{ marginBottom: 16, position: 'relative' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    {page.pageNumber}페이지
                  </Text>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <AntImage
                      src={page.imageUrl}
                      style={{ maxWidth: '100%', maxHeight: 600 }}
                    />
                    {zonesForPage.map((z: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${z.x}%`,
                          top: `${z.y}%`,
                          width: `${z.width}%`,
                          height: `${z.height}%`,
                          border: `2px dashed ${ZONE_COLORS[i % ZONE_COLORS.length]}`,
                          backgroundColor: `${ZONE_COLORS[i % ZONE_COLORS.length]}1a`,
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{
                          color: ZONE_COLORS[i % ZONE_COLORS.length],
                          fontSize: 10,
                          fontWeight: 'bold',
                          textShadow: '0 0 3px white, 0 0 3px white',
                        }}>
                          {z.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </AntImage.PreviewGroup>
        </div>
      </Modal>
    </div>
  );
}
