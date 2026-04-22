/**
 * 배송 스케줄 관리 페이지
 * - 요일별(평일/토/일) 기본 기사 배정 (코스당 1명)
 * - 특정 날짜 오버라이드 (급한 기사 변경)
 */

import { useState, useMemo } from 'react';
import { Card, Table, Select, Button, message, Tabs, DatePicker, Input, Row, Col, Tag, Modal, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedules,
  upsertSchedule,
  deleteSchedule,
  upsertOverride,
  deleteOverride,
  getAssignmentsForDate,
} from '@/api/delivery-schedule.api';
import { getDeliveryRoutes } from '@/api/delivery-route.api';
import { getStaffList } from '@/api/staff.api';
import dayjs from 'dayjs';

// 끼니는 내부적으로 LUNCH 고정 (코스 = 1기사)
const DEFAULT_MEAL = 'LUNCH';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const SCHEDULE_GROUPS = [
  { label: '평일 (월~금)', scheduleType: 'WEEKDAY' as const },
  { label: '토요일',       scheduleType: 'SATURDAY' as const },
  { label: '일요일',       scheduleType: 'SUNDAY' as const },
  { label: '특별한날',      scheduleType: 'HOLIDAY' as const },
];

export default function DeliverySchedulePage() {
  const queryClient = useQueryClient();
  const [selectedDayGroup, setSelectedDayGroup] = useState(0);
  const [overrideDate, setOverrideDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ routeId: '', driverId: '', note: '' });

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
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
      message.success('기사가 배정되었습니다');
    },
    onError: (e: any) => message.error(e.message || '저장 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
      message.success('배정이 해제되었습니다');
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
      message.success('원래 배정으로 복구되었습니다');
    },
  });

  const selectedScheduleType = SCHEDULE_GROUPS[selectedDayGroup].scheduleType;

  // 선택된 scheduleType에 맞는 코스만 필터
  const filteredRoutes = useMemo(() => {
    const allRoutes = Array.isArray(routes) ? routes : [];
    return allRoutes.filter((r: any) => r.scheduleType === selectedScheduleType);
  }, [routes, selectedScheduleType]);

  // 코스 → 배정 기사 매핑 (스케줄 우선, 없으면 기존 배정에서 가져옴)
  const scheduleMap = useMemo(() => {
    const map: Record<string, any> = {};
    // 1순위: DeliverySchedule (현재 선택된 시점)
    (Array.isArray(schedules) ? schedules : []).forEach((s: any) => {
      if (s.scheduleType === selectedScheduleType && !map[s.routeId]) {
        map[s.routeId] = s;
      }
    });
    // 2순위: DeliveryAssignment (코스 관리의 기존 배정) - 스케줄이 없는 코스만
    (Array.isArray(filteredRoutes) ? filteredRoutes : []).forEach((route: any) => {
      if (!map[route.id] && route.assignedDrivers?.length > 0) {
        map[route.id] = {
          driverId: route.assignedDrivers[0].id,
          source: 'assignment',
        };
      }
    });
    return map;
  }, [schedules, selectedScheduleType, filteredRoutes]);

  // 기사 배정 (scheduleType 단위 1회)
  const handleDriverChange = (routeId: string, driverId: string) => {
    upsertMutation.mutate({ routeId, driverId, scheduleType: selectedScheduleType, mealType: DEFAULT_MEAL });
  };

  // 배정 해제
  const handleDeleteSchedule = (routeId: string) => {
    const items = (Array.isArray(schedules) ? schedules : []).filter(
      (s: any) => s.routeId === routeId && s.scheduleType === selectedScheduleType
    );
    items.forEach((item: any) => deleteMutation.mutate(item.id));
  };

  // 드라이버 옵션
  const driverOptions = (Array.isArray(drivers) ? drivers : []).map((d: any) => ({
    value: d.userId || d.id,
    label: `${d.user?.name || d.name} (${d.user?.phone || d.phone || ''})`,
  }));

  // 코스 테이블 컬럼 (코스 + 담당기사)
  const columns = [
    {
      title: '코스',
      key: 'name',
      width: 250,
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
    {
      title: '사업장 수',
      key: 'stopsCount',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: any) => record.stopsCount || 0,
    },
    {
      title: '담당 기사',
      key: 'driver',
      width: 320,
      render: (_: any, record: any) => {
        const schedule = scheduleMap[record.id];
        const isFromAssignment = schedule?.source === 'assignment';
        return (
          <Space>
            <Select
              style={{ width: 220 }}
              placeholder="기사 선택"
              allowClear
              value={schedule?.driverId || undefined}
              onChange={(value) => {
                if (value) {
                  handleDriverChange(record.id, value);
                } else {
                  handleDeleteSchedule(record.id);
                }
              }}
              options={driverOptions}
              size="small"
            />
            {isFromAssignment && (
              <Tag color="orange" style={{ fontSize: 11 }}>기존</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  // 날짜별 배정 현황 (오버라이드 탭)
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
    { title: '배정 기사', key: 'driver', render: (_: any, r: any) => r.driver?.name },
    { title: '변경 사유', dataIndex: 'note' },
    {
      title: '출처',
      key: 'source',
      width: 80,
      render: (_: any, r: any) =>
        r.source === 'override' ? <Tag color="red">변경</Tag> : <Tag color="blue">기본</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: any, r: any) => r.source === 'override' ? (
        <Button size="small" danger onClick={() => deleteOverrideMutation.mutate(r.id)}>원복</Button>
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
                    {SCHEDULE_GROUPS.map((group, i) => (
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
                    각 코스의 담당 기사를 설정합니다. 평일은 월~금 동일하게 적용됩니다.
                  </p>
                </div>

                <Table
                  dataSource={filteredRoutes}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
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
                      setOverrideForm({ routeId: '', driverId: '', note: '' });
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
          if (!overrideForm.routeId || !overrideForm.driverId || !overrideDate) {
            message.error('코스와 기사를 모두 선택하세요');
            return;
          }
          overrideMutation.mutate({
            routeId: overrideForm.routeId,
            driverId: overrideForm.driverId,
            date: overrideDate.format('YYYY-MM-DD'),
            mealType: DEFAULT_MEAL,
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
