/**
 * 배송 스케줄 관리 페이지
 * - 요일별(평일/토/일) 기본 기사 배정
 * - 특정 날짜 오버라이드 (급한 기사 변경)
 */

import { useState, useMemo } from 'react';
import { Card, Table, Select, Button, message, Tabs, DatePicker, Input, Row, Col, Tag, Modal, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedules,
  upsertSchedule,
  deleteSchedule,
  getOverrides,
  upsertOverride,
  deleteOverride,
  getAssignmentsForDate,
} from '@/api/delivery-schedule.api';
import { getDeliveryRoutes } from '@/api/delivery-route.api';
import { getStaffList } from '@/api/staff.api';
import dayjs from 'dayjs';

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: '조식' },
  { value: 'LUNCH', label: '중식' },
  { value: 'DINNER', label: '석식' },
  { value: 'SUPPER', label: '야식' },
];

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAY_GROUPS = [
  { label: '평일 (월~금)', days: [1, 2, 3, 4, 5] },
  { label: '토요일', days: [6] },
  { label: '일요일', days: [0] },
];

export default function DeliverySchedulePage() {
  const queryClient = useQueryClient();
  const [selectedDayGroup, setSelectedDayGroup] = useState(0); // 0=평일, 1=토, 2=일
  const [overrideDate, setOverrideDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ routeId: '', driverId: '', mealType: '', note: '' });

  // 데이터 조회
  const { data: schedulesData } = useQuery({
    queryKey: ['delivery-schedules'],
    queryFn: () => getSchedules(),
  });

  const { data: routesData } = useQuery({
    queryKey: ['delivery-routes-all'],
    queryFn: () => getDeliveryRoutes({ isActive: true }),
  });

  const { data: driversData } = useQuery({
    queryKey: ['delivery-drivers'],
    queryFn: () => getStaffList({ role: 'DELIVERY_DRIVER', limit: 100 }),
  });

  const { data: _overridesData } = useQuery({
    queryKey: ['delivery-overrides', overrideDate?.format('YYYY-MM-DD')],
    queryFn: () => getOverrides({ date: overrideDate?.format('YYYY-MM-DD') }),
    enabled: !!overrideDate,
  });

  const { data: dateAssignments } = useQuery({
    queryKey: ['date-assignments', overrideDate?.format('YYYY-MM-DD')],
    queryFn: () => getAssignmentsForDate(overrideDate!.format('YYYY-MM-DD')),
    enabled: !!overrideDate,
  });

  const schedules = schedulesData?.data || schedulesData || [];
  const routes = routesData?.data?.data || routesData?.data || [];
  const drivers = (driversData as any)?.items || (driversData as any)?.data?.items || [];
  const todayAssigns = dateAssignments?.data || dateAssignments || [];

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: upsertSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
      message.success('스케줄이 저장되었습니다');
    },
    onError: (e: any) => message.error(e.message || '저장 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
      message.success('삭제되었습니다');
    },
  });

  const overrideMutation = useMutation({
    mutationFn: upsertOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['date-assignments'] });
      setOverrideModal(false);
      message.success('배정 변경이 저장되었습니다');
    },
    onError: (e: any) => message.error(e.message || '저장 실패'),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: deleteOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['date-assignments'] });
      message.success('오버라이드가 삭제되었습니다');
    },
  });

  // 선택된 요일 그룹의 대표 요일
  const selectedDays = WEEKDAY_GROUPS[selectedDayGroup].days;
  // 평일은 월요일(1) 기준

  // 스케줄 데이터를 코스 x 끼니 격자로 변환
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Record<string, any>> = {};
    (Array.isArray(schedules) ? schedules : []).forEach((s: any) => {
      if (selectedDays.includes(s.dayOfWeek)) {
        if (!grid[s.routeId]) grid[s.routeId] = {};
        grid[s.routeId][s.mealType] = s;
      }
    });
    return grid;
  }, [schedules, selectedDays]);

  // 기사 배정 변경
  const handleDriverChange = (routeId: string, mealType: string, driverId: string) => {
    // 평일이면 월~금 모두 동일하게 설정
    for (const day of selectedDays) {
      upsertMutation.mutate({ routeId, driverId, dayOfWeek: day, mealType });
    }
  };

  // 스케줄 삭제
  const handleDeleteSchedule = (routeId: string, mealType: string) => {
    const items = (Array.isArray(schedules) ? schedules : []).filter(
      (s: any) => s.routeId === routeId && s.mealType === mealType && selectedDays.includes(s.dayOfWeek)
    );
    items.forEach((item: any) => deleteMutation.mutate(item.id));
  };

  // 드라이버 옵션
  const driverOptions = (Array.isArray(drivers) ? drivers : []).map((d: any) => ({
    value: d.userId || d.id,
    label: `${d.user?.name || d.name} (${d.user?.phone || d.phone || ''})`,
  }));

  // 코스 테이블 컬럼
  const columns = [
    {
      title: '코스',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Tag color={record.color}>{record.code}</Tag>
          <span>{record.name}</span>
          <Tag color={record.division === 'HQ' ? 'blue' : 'green'}>
            {record.division === 'HQ' ? '본사' : '영남'}
          </Tag>
        </Space>
      ),
    },
    ...MEAL_TYPES.map((meal) => ({
      title: meal.label,
      key: meal.value,
      width: 200,
      render: (_: any, record: any) => {
        const schedule = scheduleGrid[record.id]?.[meal.value];
        return (
          <Select
            style={{ width: '100%' }}
            placeholder="기사 선택"
            allowClear
            value={schedule?.driverId || undefined}
            onChange={(value) => {
              if (value) {
                handleDriverChange(record.id, meal.value, value);
              } else {
                handleDeleteSchedule(record.id, meal.value);
              }
            }}
            options={driverOptions}
            size="small"
          />
        );
      },
    })),
  ];

  // 오버라이드 테이블 컬럼
  const overrideColumns = [
    {
      title: '코스',
      key: 'route',
      render: (_: any, r: any) => (
        <Space>
          <Tag color={r.route?.color}>{r.route?.code}</Tag>
          {r.route?.name}
        </Space>
      ),
    },
    { title: '끼니', dataIndex: 'mealType', render: (v: string) => MEAL_TYPES.find(m => m.value === v)?.label || v },
    { title: '배정 기사', key: 'driver', render: (_: any, r: any) => r.driver?.name },
    { title: '변경 사유', dataIndex: 'note' },
    { title: '출처', key: 'source', render: (_: any, r: any) => r.source === 'override' ? <Tag color="red">변경</Tag> : <Tag color="blue">기본</Tag> },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: any, r: any) => r.source === 'override' ? (
        <Button size="small" danger onClick={() => deleteOverrideMutation.mutate(r.id)}>취소</Button>
      ) : null,
    },
  ];

  return (
    <div>
      <h2>배송 스케줄 관리</h2>

      <Tabs
        items={[
          {
            key: 'schedule',
            label: '요일별 기본 스케줄',
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    {WEEKDAY_GROUPS.map((group, i) => (
                      <Button
                        key={i}
                        type={selectedDayGroup === i ? 'primary' : 'default'}
                        onClick={() => setSelectedDayGroup(i)}
                      >
                        {group.label}
                      </Button>
                    ))}
                  </Space>
                  <p style={{ color: '#999', marginTop: 8, fontSize: 13 }}>
                    각 코스의 끼니별 기본 담당 기사를 설정합니다. 평일은 월~금 동일하게 적용됩니다.
                  </p>
                </div>

                <Table
                  dataSource={Array.isArray(routes) ? routes : []}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </Card>
            ),
          },
          {
            key: 'override',
            label: '날짜별 배정 변경',
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col>
                    <DatePicker
                      value={overrideDate}
                      onChange={(date) => setOverrideDate(date)}
                      format="YYYY-MM-DD"
                    />
                  </Col>
                  <Col>
                    <Button type="primary" onClick={() => {
                      setOverrideForm({ routeId: '', driverId: '', mealType: '', note: '' });
                      setOverrideModal(true);
                    }}>
                      배정 변경 추가
                    </Button>
                  </Col>
                </Row>

                {overrideDate && (
                  <>
                    <p style={{ color: '#666', marginBottom: 12 }}>
                      {overrideDate.format('YYYY년 M월 D일')} ({DAY_LABELS[overrideDate.day()]}) 배정 현황
                    </p>
                    <Table
                      dataSource={Array.isArray(todayAssigns) ? todayAssigns : []}
                      columns={overrideColumns}
                      rowKey={(r) => `${r.routeId}_${r.mealType}`}
                      pagination={false}
                      size="small"
                    />
                  </>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* 오버라이드 추가 모달 */}
      <Modal
        title="배정 변경 추가"
        open={overrideModal}
        onCancel={() => setOverrideModal(false)}
        onOk={() => {
          if (!overrideForm.routeId || !overrideForm.driverId || !overrideForm.mealType || !overrideDate) {
            message.error('코스, 끼니, 기사를 모두 선택하세요');
            return;
          }
          overrideMutation.mutate({
            routeId: overrideForm.routeId,
            driverId: overrideForm.driverId,
            date: overrideDate.format('YYYY-MM-DD'),
            mealType: overrideForm.mealType,
            note: overrideForm.note || undefined,
          });
        }}
        confirmLoading={overrideMutation.isPending}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label>날짜</label>
            <Input value={overrideDate?.format('YYYY-MM-DD')} disabled />
          </div>
          <div>
            <label>코스</label>
            <Select
              style={{ width: '100%' }}
              placeholder="코스 선택"
              value={overrideForm.routeId || undefined}
              onChange={(v) => setOverrideForm({ ...overrideForm, routeId: v })}
              options={(Array.isArray(routes) ? routes : []).map((r: any) => ({
                value: r.id,
                label: `[${r.code}] ${r.name} (${r.division === 'HQ' ? '본사' : '영남'})`,
              }))}
            />
          </div>
          <div>
            <label>끼니</label>
            <Select
              style={{ width: '100%' }}
              placeholder="끼니 선택"
              value={overrideForm.mealType || undefined}
              onChange={(v) => setOverrideForm({ ...overrideForm, mealType: v })}
              options={MEAL_TYPES}
            />
          </div>
          <div>
            <label>배정 기사</label>
            <Select
              style={{ width: '100%' }}
              placeholder="기사 선택"
              value={overrideForm.driverId || undefined}
              onChange={(v) => setOverrideForm({ ...overrideForm, driverId: v })}
              options={driverOptions}
            />
          </div>
          <div>
            <label>변경 사유 (선택)</label>
            <Input
              placeholder="예: 기사A 휴가"
              value={overrideForm.note}
              onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
