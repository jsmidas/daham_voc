/**
 * Attendance Settings Page
 * @description 근무지 설정 - 사업장별 출퇴근 시간, GPS 허용 반경 설정
 */

import { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  TimePicker,
  message,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllAttendanceSettings,
  upsertAttendanceSetting,
} from '@/api/attendance.api';
import type { AttendanceSetting } from '@/api/attendance.api';
import { getSitesLight } from '@/api/site.api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function AttendanceSettingsPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceSetting | null>(null);
  const [form] = Form.useForm();

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['attendance-settings-all'],
    queryFn: () => getAllAttendanceSettings(),
  });

  const { data: sitesRes } = useQuery({
    queryKey: ['sites-light'],
    queryFn: () => getSitesLight({ isActive: true }),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const settings: AttendanceSetting[] = settingsRes?.data || [];
  const sites = sitesRes?.data?.sites || [];

  // 이미 설정된 사업장 ID 목록
  const configuredSiteIds = settings.map((s) => s.siteId);

  const mutation = useMutation({
    mutationFn: (data: {
      siteId: string;
      expectedCheckIn: string;
      expectedCheckOut: string;
      allowedRadius?: number;
    }) => upsertAttendanceSetting(data),
    onSuccess: () => {
      message.success('저장되었습니다.');
      setModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['attendance-settings-all'] });
    },
    onError: () => {
      message.error('저장에 실패했습니다.');
    },
  });

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AttendanceSetting) => {
    setEditingRecord(record);
    form.setFieldsValue({
      siteId: record.siteId,
      expectedCheckIn: dayjs(record.expectedCheckIn, 'HH:mm'),
      expectedCheckOut: dayjs(record.expectedCheckOut, 'HH:mm'),
      allowedRadius: record.allowedRadius,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      mutation.mutate({
        siteId: values.siteId,
        expectedCheckIn: values.expectedCheckIn.format('HH:mm'),
        expectedCheckOut: values.expectedCheckOut.format('HH:mm'),
        allowedRadius: values.allowedRadius,
      });
    });
  };

  const columns = [
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'siteName',
      width: 200,
    },
    {
      title: '유형',
      dataIndex: ['site', 'type'],
      key: 'siteType',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '출근 시간',
      dataIndex: 'expectedCheckIn',
      key: 'expectedCheckIn',
      width: 120,
    },
    {
      title: '퇴근 시간',
      dataIndex: 'expectedCheckOut',
      key: 'expectedCheckOut',
      width: 120,
    },
    {
      title: 'GPS 허용 반경 (m)',
      dataIndex: 'allowedRadius',
      key: 'allowedRadius',
      width: 150,
      render: (radius: number) => `${radius}m`,
    },
    {
      title: '위도',
      dataIndex: ['site', 'latitude'],
      key: 'latitude',
      width: 120,
      render: (v: number) => v?.toFixed(6) || '-',
    },
    {
      title: '경도',
      dataIndex: ['site', 'longitude'],
      key: 'longitude',
      width: 120,
      render: (v: number) => v?.toFixed(6) || '-',
    },
    {
      title: '작업',
      key: 'action',
      width: 80,
      render: (_: any, record: AttendanceSetting) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          수정
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>근무지 설정</Title>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            설정 추가
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={settings}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </Card>

      <Modal
        title={editingRecord ? '근무지 설정 수정' : '근무지 설정 추가'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        confirmLoading={mutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="siteId"
            label="사업장"
            rules={[{ required: true, message: '사업장을 선택하세요' }]}
          >
            <Select
              placeholder="사업장 선택"
              disabled={!!editingRecord}
              showSearch
              optionFilterProp="label"
              options={sites
                .filter(
                  (s: any) =>
                    !!editingRecord || !configuredSiteIds.includes(s.id)
                )
                .map((s: any) => ({
                  value: s.id,
                  label: s.name,
                }))}
            />
          </Form.Item>

          <Form.Item
            name="expectedCheckIn"
            label="출근 시간"
            rules={[{ required: true, message: '출근 시간을 입력하세요' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expectedCheckOut"
            label="퇴근 시간"
            rules={[{ required: true, message: '퇴근 시간을 입력하세요' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="allowedRadius"
            label="GPS 허용 반경 (미터)"
            initialValue={100}
          >
            <InputNumber min={1} max={10000} style={{ width: '100%' }} addonAfter="m" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
