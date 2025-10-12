/**
 * Attendance List Page
 * @description 근태 관리 페이지
 */

import { useState } from 'react';
import {
  Table,
  Space,
  Select,
  DatePicker,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Spin,
  Button,
  Modal,
  Form,
  TimePicker,
  Input,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendances, updateAttendance } from '@/api/attendance.api';
import { getSites } from '@/api/site.api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

export default function AttendanceListPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [siteFilter, setSiteFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // 사업장 목록 조회
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites({}),
  });

  // 출퇴근 목록 조회
  const { data: attendances, isLoading } = useQuery({
    queryKey: [
      'attendances',
      {
        siteId: siteFilter,
        status: statusFilter,
        dateFrom: dateRange[0].format('YYYY-MM-DD'),
        dateTo: dateRange[1].format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      getAttendances({
        siteId: siteFilter,
        status: statusFilter,
        dateFrom: dateRange[0].format('YYYY-MM-DD'),
        dateTo: dateRange[1].format('YYYY-MM-DD'),
      }),
  });

  // 통계 계산
  const stats = {
    total: attendances?.data?.length || 0,
    normal: attendances?.data?.filter((a: any) => a.status === 'NORMAL').length || 0,
    late: attendances?.data?.filter((a: any) => a.status === 'LATE').length || 0,
    earlyLeave:
      attendances?.data?.filter((a: any) => a.status === 'EARLY_LEAVE').length || 0,
    outsideRange:
      attendances?.data?.filter((a: any) => a.status === 'OUTSIDE_RANGE').length || 0,
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'EARLY_LEAVE':
        return 'orange';
      case 'OUTSIDE_RANGE':
        return 'error';
      case 'ABSENT':
        return 'default';
      default:
        return 'default';
    }
  };

  // 상태별 한글
  const getStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return '정상';
      case 'LATE':
        return '지각';
      case 'EARLY_LEAVE':
        return '조퇴';
      case 'OUTSIDE_RANGE':
        return '범위 밖';
      case 'ABSENT':
        return '결근';
      default:
        return status;
    }
  };

  // 근무 시간 계산
  const calculateWorkHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return '-';
    const start = dayjs(checkIn);
    const end = dayjs(checkOut);
    const hours = end.diff(start, 'hour', true);
    return `${hours.toFixed(1)}시간`;
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (!attendances?.data || attendances.data.length === 0) {
      message.warning('다운로드할 데이터가 없습니다');
      return;
    }

    const dateStr = `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`;

    // 엑셀 데이터 생성
    const excelData = attendances.data.map((record: any) => ({
      '직원명': record.user?.name || '-',
      '사업장': record.site?.name || '-',
      '체크인': dayjs(record.checkInTime).format('YYYY-MM-DD HH:mm'),
      '체크아웃': record.checkOutTime ? dayjs(record.checkOutTime).format('YYYY-MM-DD HH:mm') : '근무 중',
      '휴게시작': record.breakStartTime ? dayjs(record.breakStartTime).format('HH:mm') : '-',
      '휴게종료': record.breakEndTime ? dayjs(record.breakEndTime).format('HH:mm') : '-',
      '근무시간': calculateWorkHours(record.checkInTime, record.checkOutTime),
      '상태': getStatusText(record.status),
      '비고': record.note || '-',
    }));

    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '근태현황');

    // 열 너비 설정
    worksheet['!cols'] = [
      { wch: 12 }, // 직원명
      { wch: 20 }, // 사업장
      { wch: 18 }, // 체크인
      { wch: 18 }, // 체크아웃
      { wch: 10 }, // 휴게시작
      { wch: 10 }, // 휴게종료
      { wch: 12 }, // 근무시간
      { wch: 12 }, // 상태
      { wch: 30 }, // 비고
    ];

    // 파일 다운로드
    XLSX.writeFile(workbook, `근태현황_${dateStr}.xlsx`);
    message.success('엑셀 파일이 다운로드되었습니다');
  };

  // 출퇴근 수정 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      message.success('수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      setEditModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '수정에 실패했습니다');
    },
  });

  // 수정 버튼 클릭
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      breakStartTime: record.breakStartTime ? dayjs(record.breakStartTime) : null,
      breakEndTime: record.breakEndTime ? dayjs(record.breakEndTime) : null,
      note: record.note || '',
    });
    setEditModalVisible(true);
  };

  // 수정 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          breakStartTime: values.breakStartTime
            ? values.breakStartTime.toISOString()
            : null,
          breakEndTime: values.breakEndTime
            ? values.breakEndTime.toISOString()
            : null,
          note: values.note,
        },
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: '직원명',
      dataIndex: ['user', 'name'],
      key: 'userName',
      width: 100,
    },
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'siteName',
      width: 150,
    },
    {
      title: '체크인',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '체크아웃',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 150,
      render: (time?: string) =>
        time ? dayjs(time).format('MM-DD HH:mm') : <Tag>근무 중</Tag>,
    },
    {
      title: '휴게시작',
      dataIndex: 'breakStartTime',
      key: 'breakStartTime',
      width: 120,
      render: (time?: string) =>
        time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: '휴게종료',
      dataIndex: 'breakEndTime',
      key: 'breakEndTime',
      width: 120,
      render: (time?: string) =>
        time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: '근무시간',
      key: 'workHours',
      width: 100,
      render: (_: any, record: any) =>
        calculateWorkHours(record.checkInTime, record.checkOutTime),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '비고',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note?: string) => note || '-',
    },
    {
      title: '작업',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          size="small"
        >
          수정
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>근태 관리</h1>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 기록"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="정상"
              value={stats.normal}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지각"
              value={stats.late}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="조퇴"
              value={stats.earlyLeave}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 필터 */}
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
          format="YYYY-MM-DD"
        />
        <Select
          placeholder="사업장 선택"
          style={{ width: 200 }}
          allowClear
          onChange={setSiteFilter}
          value={siteFilter}
          loading={!sites}
        >
          {sites?.data?.sites?.map((site: any) => (
            <Select.Option key={site.id} value={site.id}>
              {site.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          style={{ width: 150 }}
          allowClear
          onChange={setStatusFilter}
          value={statusFilter}
        >
          <Select.Option value="NORMAL">정상</Select.Option>
          <Select.Option value="LATE">지각</Select.Option>
          <Select.Option value="EARLY_LEAVE">조퇴</Select.Option>
          <Select.Option value="OUTSIDE_RANGE">범위 밖</Select.Option>
          <Select.Option value="ABSENT">결근</Select.Option>
        </Select>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExcelDownload}
          disabled={!attendances?.data || attendances.data.length === 0}
        >
          엑셀 다운로드
        </Button>
      </Space>

      {/* 출퇴근 목록 */}
      <Table
        columns={columns}
        dataSource={attendances?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />

      {/* 수정 모달 */}
      <Modal
        title="휴게시간 수정"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        confirmLoading={updateMutation.isPending}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="휴게 시작 시간"
            name="breakStartTime"
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder="시작 시간 선택"
              minuteStep={5}
            />
          </Form.Item>

          <Form.Item
            label="휴게 종료 시간"
            name="breakEndTime"
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder="종료 시간 선택"
              minuteStep={5}
            />
          </Form.Item>

          <Form.Item label="비고" name="note">
            <Input.TextArea
              rows={3}
              placeholder="특이사항을 입력하세요 (선택)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
