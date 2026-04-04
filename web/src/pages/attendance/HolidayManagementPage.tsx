/**
 * Holiday Management Page
 * @description 공휴일 관리 페이지
 */

import { useState } from 'react';
import { Table, Button, Space, DatePicker, Input, Select, Modal, Form, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/utils/axios';
import dayjs from 'dayjs';

async function getHolidays(year: number) {
  return apiClient.get('/holidays', { params: { year } });
}

async function createHoliday(data: { date: string; name: string }) {
  return apiClient.post('/holidays', data);
}

async function updateHoliday(id: string, data: { name: string }) {
  return apiClient.patch(`/holidays/${id}`, data);
}

async function deleteHoliday(id: string) {
  return apiClient.delete(`/holidays/${id}`);
}

export default function HolidayManagementPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: () => getHolidays(selectedYear),
  });

  const createMutation = useMutation({
    mutationFn: (data: { date: string; name: string }) => createHoliday(data),
    onSuccess: () => {
      message.success('공휴일이 추가되었습니다');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '추가 실패');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateHoliday(id, { name }),
    onSuccess: () => {
      message.success('공휴일이 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setModalOpen(false);
      setEditingHoliday(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '수정 실패');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      message.success('공휴일이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '삭제 실패');
    },
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingHoliday) {
        updateMutation.mutate({ id: editingHoliday.id, name: values.name });
      } else {
        createMutation.mutate({
          date: values.date.format('YYYY-MM-DD'),
          name: values.name,
        });
      }
    });
  };

  const handleEdit = (record: any) => {
    setEditingHoliday(record);
    form.setFieldsValue({
      date: dayjs(record.date),
      name: record.name,
    });
    setModalOpen(true);
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateStr).getDay()];
  };

  const columns = [
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '요일',
      dataIndex: 'date',
      key: 'dayOfWeek',
      width: 80,
      render: (date: string) => {
        const day = getDayOfWeek(date);
        const color = day === '일' ? '#cf1322' : day === '토' ? '#1890ff' : undefined;
        return <span style={{ color, fontWeight: 'bold' }}>{day}</span>;
      },
    },
    {
      title: '공휴일 이름',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="red">{name}</Tag>,
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            수정
          </Button>
          <Popconfirm
            title="이 공휴일을 삭제하시겠습니까?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>공휴일 관리</h1>
        <Space>
          <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
            {yearOptions.map((y) => (
              <Select.Option key={y} value={y}>{y}년</Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingHoliday(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            공휴일 추가
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
        대한민국 법정 공휴일이 기본 등록되어 있습니다. 대체공휴일, 임시공휴일, 선거일 등은 수동으로 추가해주세요.
      </div>

      <Table
        columns={columns}
        dataSource={holidays?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title={editingHoliday ? '공휴일 수정' : '공휴일 추가'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setEditingHoliday(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="날짜"
            name="date"
            rules={[{ required: true, message: '날짜를 선택하세요' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabled={!!editingHoliday}
            />
          </Form.Item>
          <Form.Item
            label="공휴일 이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력하세요' }]}
          >
            <Input placeholder="예: 대체공휴일, 임시공휴일" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
