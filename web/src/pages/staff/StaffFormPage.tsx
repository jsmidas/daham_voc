/**
 * Staff Form Page
 * @description 담당자 등록/수정 페이지 - 그룹/개별 사업장 선택 지원
 */

import { Form, Input, Button, Card, message, Select, Row, Col, Switch, Tree, Space, Tag, TimePicker, Checkbox, Table } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createStaff, updateStaff, getStaffById, assignStaffToSites, getWorkSchedule, saveWorkSchedule } from '@/api/staff.api';
import { getSites } from '@/api/site.api';
import { getSiteGroups } from '@/api/site-group.api';
import { getDeliveryRoutes, getDriverRoutes } from '@/api/delivery-route.api';
import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';

export default function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEditMode = !!id;

  // 선택된 체크박스 키 (그룹 ID + 사업장 ID)
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  // 선택된 역할 (배송기사 여부 확인용)
  const [selectedRole, setSelectedRole] = useState<string | undefined>();

  // 선택된 배송 코스
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();

  // 배정된 코스 목록 (수정 모드에서 배송기사인 경우)
  const [assignedRoutes, setAssignedRoutes] = useState<any[]>([]);

  // 요일별 근무시간
  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토', '공휴일'];
  const defaultSchedule = [1, 2, 3, 4, 5, 6, 0, 7].map((day) => ({
    dayOfWeek: day,
    isWorkDay: day >= 1 && day <= 5,
    checkInTime: day >= 1 && day <= 5 ? '09:00' : null,
    checkOutTime: day >= 1 && day <= 5 ? '18:00' : null,
  }));
  const [workSchedules, setWorkSchedules] = useState(defaultSchedule);
  const [showWorkSchedule, setShowWorkSchedule] = useState(false);

  // 수정 모드일 때 기존 데이터 조회
  const { data: staffData } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => getStaffById(id!),
    enabled: isEditMode,
    retry: false,
  });

  // 전체 사업장 목록 조회 (limit 설정으로 모든 사업장 가져오기)
  const { data: sitesData } = useQuery({
    queryKey: ['sites', 'all'],
    queryFn: () => getSites({ limit: 1000 }),
  });

  // 사업장 그룹 목록 조회
  const { data: siteGroupsData } = useQuery({
    queryKey: ['site-groups'],
    queryFn: () => getSiteGroups(),
  });

  // 배송 코스 목록 조회 (배송기사인 경우에만)
  const { data: routesData } = useQuery({
    queryKey: ['delivery-routes'],
    queryFn: () => getDeliveryRoutes(),
    enabled: selectedRole === 'DELIVERY_DRIVER',
  });

  // 폼에 기존 데이터 설정
  useEffect(() => {
    if (isEditMode && staffData) {
      form.setFieldsValue({
        // User 정보
        name: staffData.user.name,
        phone: staffData.user.phone,
        email: staffData.user.email,
        role: staffData.user.role,
        division: staffData.user.division,
        isActive: staffData.user.isActive,
        canUseAttendance: (staffData.user as any).canUseAttendance || false,
        isContractTarget: (staffData.user as any).isContractTarget || false,
        viewScope: (staffData.user as any).viewScope || 'NONE',
        canViewFeedbacks: (staffData.user as any).canViewFeedbacks || false,
        canViewMealPhotos: (staffData.user as any).canViewMealPhotos || false,
        canViewMealCounts: (staffData.user as any).canViewMealCounts || false,
        // Staff 정보
        employeeNo: staffData.employeeNo,
        department: staffData.department,
        position: staffData.position,
        managerId: staffData.managerId,
      });

      // 출퇴근 사용 시 근무시간 표시
      if ((staffData.user as any).canUseAttendance) {
        setShowWorkSchedule(true);
        // 근무시간 데이터 로드
        getWorkSchedule(id!).then((data: any) => {
          if (data && data.length > 0) {
            const ordered = [1, 2, 3, 4, 5, 6, 0, 7].map((day) => {
              const found = data.find((s: any) => s.dayOfWeek === day);
              return found || { dayOfWeek: day, isWorkDay: false, checkInTime: null, checkOutTime: null };
            });
            setWorkSchedules(ordered);
          }
        }).catch(() => {});
      }

      // 역할 설정
      setSelectedRole(staffData.user.role);

      // 배정된 사업장 그룹 및 개별 사업장 설정
      const assignedSiteIds = (staffData as any).staffSites?.map((ss: any) => `site-${ss.siteId}`) || [];
      const assignedGroupIds = (staffData as any).staffSiteGroups?.map((sg: any) => `group-${sg.siteGroupId}`) || [];

      setCheckedKeys([...assignedGroupIds, ...assignedSiteIds]);

      // 배송기사인 경우 배정된 코스 조회
      if (staffData.user.role === 'DELIVERY_DRIVER' && staffData.user.id) {
        loadAssignedRoutes(staffData.user.id);
      }
    }
  }, [isEditMode, staffData, form]);

  // 배송기사에게 배정된 코스 로드
  const loadAssignedRoutes = async (driverId: string) => {
    try {
      const response = await getDriverRoutes(driverId);

      // API 응답이 배열인지 확인
      let routes = response.data?.data || response.data || [];

      // 단일 객체인 경우 배열로 변환
      if (!Array.isArray(routes)) {
        routes = routes ? [routes] : [];
      }

      setAssignedRoutes(routes);

      // 배정된 코스의 사업장들을 checkedKeys에 추가
      if (routes.length > 0) {
        const routeSiteIds: string[] = [];
        routes.forEach((route: any) => {
          if (route.stops && route.stops.length > 0) {
            route.stops.forEach((stop: any) => {
              const siteId = stop.siteId || stop.site?.id;
              if (siteId) {
                routeSiteIds.push(`site-${siteId}`);
              }
            });
          }
        });

        // 기존 체크된 키에 코스 사업장 추가 (중복 제거)
        setCheckedKeys((prevKeys) => {
          const allKeys = [...prevKeys, ...routeSiteIds];
          return Array.from(new Set(allKeys));
        });
      }
    } catch (error) {
      console.error('배정된 코스 조회 실패:', error);
    }
  };

  // 역할 변경 핸들러
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);

    // 권한에 따라 자동으로 division 설정
    let division = undefined;
    if (role === 'HQ_ADMIN' || role === 'SITE_MANAGER' || role === 'SITE_STAFF') {
      division = 'HQ';
    } else if (role === 'YEONGNAM_ADMIN') {
      division = 'YEONGNAM';
    } else if (role === 'DELIVERY_DRIVER') {
      // 배송 기사는 division을 선택할 수 있도록 유지
      division = form.getFieldValue('division');
    }
    // SUPER_ADMIN은 division 없음 (모든 곳 접근 가능)

    form.setFieldsValue({ role, division });
  };

  // 배송 코스 선택 핸들러 (해당 코스의 모든 사업장을 자동으로 추가)
  const handleRouteSelect = async (routeId: string) => {
    if (!routeId) {
      setSelectedRouteId(undefined);
      return;
    }

    setSelectedRouteId(routeId);

    try {
      // 선택한 코스의 상세 정보를 가져와서 해당 코스의 사업장 ID 목록 추출
      const route = routesData?.data?.find((r: any) => r.id === routeId);

      if (route && route.stopsCount > 0) {
        const { data: routeDetail } = await import('@/api/delivery-route.api').then(m =>
          m.getDeliveryRouteById(routeId)
        );

        // API 응답 구조: routeDetail이 직접 데이터
        const stops = routeDetail?.data?.stops || routeDetail?.stops;

        if (stops && stops.length > 0) {
          const newSiteIds = stops.map((stop: any) => stop.siteId || stop.site?.id);

          // 기존 선택된 사업장과 중복 제거하고 추가
          const uniqueKeys = Array.from(new Set([...checkedKeys, ...newSiteIds]));

          setCheckedKeys(uniqueKeys);
          message.success(`${route.name}의 사업장 ${newSiteIds.length}개가 추가되었습니다`);
        } else {
          message.warning('해당 코스에 배정된 사업장이 없습니다');
        }
      }
    } catch (error) {
      console.error('코스 사업장 불러오기 실패:', error);
      message.error('코스 사업장 불러오기 실패');
    }
  };

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      message.success('담당자가 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      navigate('/staff');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '등록 실패');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateStaff(id, data),
    onSuccess: async () => {
      // 사업장 및 그룹 배정 + 근무시간 업데이트
      if (id) {
        try {
          const { siteIds, siteGroupIds } = parseCheckedKeys(checkedKeys);
          await assignStaffToSites(id, siteIds, siteGroupIds);

          // 근무시간 저장
          if (showWorkSchedule) {
            await saveWorkSchedule(id, workSchedules);
          }

          message.success('담당자 정보 및 사업장 배정이 수정되었습니다');
        } catch (error: any) {
          message.error('사업장 배정 업데이트 실패: ' + (error.response?.data?.error?.message || error.message));
          console.error('사업장 배정 실패:', error);
        }
      } else {
        message.success('담당자가 수정되었습니다');
      }
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      navigate('/staff');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || '수정 실패');
    },
  });

  const onFinish = (values: any) => {
    const { siteIds, siteGroupIds } = parseCheckedKeys(checkedKeys);

    if (isEditMode) {
      // 수정 모드: password 제외하고 전송
      const { password, ...updateData } = values;
      updateMutation.mutate({ id, data: updateData });
    } else {
      // 생성 모드: 사업장 및 그룹 배정 포함
      const payload = {
        ...values,
        siteIds,
        siteGroupIds,
      };
      createMutation.mutate(payload);
    }
  };

  // checkedKeys에서 그룹 ID와 사업장 ID 분리
  const parseCheckedKeys = (keys: React.Key[]) => {
    const siteGroupIds: string[] = [];
    const siteIds: string[] = [];

    keys.forEach((key) => {
      const keyStr = String(key);
      if (keyStr.startsWith('group-')) {
        // 그룹 ID (group- 접두사 제거)
        siteGroupIds.push(keyStr.replace('group-', ''));
      } else if (keyStr.startsWith('site-')) {
        // 개별 사업장 ID (site- 접두사 제거)
        siteIds.push(keyStr.replace('site-', ''));
      }
    });

    return { siteGroupIds, siteIds };
  };

  // 사업장 타입을 한글로 변환
  const getSiteTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      CONSIGNMENT: '위탁',
      DELIVERY: '운반급식',
      LUNCHBOX: '도시락',
      EVENT: '행사',
    };
    return typeLabels[type] || type;
  };

  // Tree 데이터 구조 생성
  const treeData = useMemo(() => {
    if (!siteGroupsData || !sitesData) return [];

    const groups = siteGroupsData.groups || [];
    const sites = sitesData.data?.sites || [];

    // 그룹별로 사업장 매핑
    const groupedSites = new Map<string, any[]>();
    const ungroupedSites: any[] = [];

    sites.forEach((site: any) => {
      if (site.groupId) {
        if (!groupedSites.has(site.groupId)) {
          groupedSites.set(site.groupId, []);
        }
        groupedSites.get(site.groupId)!.push(site);
      } else {
        ungroupedSites.push(site);
      }
    });

    // Division별로 그룹화 (모든 division 처리)
    const divisionGroups = new Map<string, any[]>();

    groups.forEach((group: any) => {
      const groupSites = groupedSites.get(group.id) || [];
      const division = group.division || 'OTHER'; // division이 없으면 'OTHER'로 처리

      const treeNode: DataNode = {
        title: (
          <span>
            <strong>{group.name}</strong>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              그룹 ({groupSites.length}개 사업장)
            </Tag>
          </span>
        ),
        key: `group-${group.id}`,
        children: groupSites.map((site: any) => ({
          title: `${site.name} (${getSiteTypeLabel(site.type)})`,
          key: `site-${site.id}`,
          isLeaf: true,
        })),
      };

      if (!divisionGroups.has(division)) {
        divisionGroups.set(division, []);
      }
      divisionGroups.get(division)!.push(treeNode);
    });

    // Division별 라벨 매핑
    const divisionLabels: Record<string, string> = {
      HQ: '본사',
      YEONGNAM: '영남지사',
      CONSIGNMENT: '위탁사업장',
      OTHER: '기타',
    };

    // 그룹 미배정 사업장을 division별로 분류
    const ungroupedByDivision = new Map<string, any[]>();
    ungroupedSites.forEach((site: any) => {
      const division = site.division || 'OTHER';
      if (!ungroupedByDivision.has(division)) {
        ungroupedByDivision.set(division, []);
      }
      ungroupedByDivision.get(division)!.push(site);
    });

    const result: DataNode[] = [];

    // 모든 division 처리
    const allDivisions = new Set([...divisionGroups.keys(), ...ungroupedByDivision.keys()]);

    allDivisions.forEach((division) => {
      const groups = divisionGroups.get(division) || [];
      const ungrouped = ungroupedByDivision.get(division) || [];

      if (groups.length === 0 && ungrouped.length === 0) {
        return; // 이 division에 아무것도 없으면 스킵
      }

      const children = [...groups];

      // 그룹 미배정 사업장 추가
      if (ungrouped.length > 0) {
        children.push({
          title: (
            <span>
              <strong>그룹 미배정</strong>
              <Tag color="gray" style={{ marginLeft: 8 }}>
                {ungrouped.length}개
              </Tag>
            </span>
          ),
          key: `${division}-ungrouped`,
          selectable: false,
          children: ungrouped.map((site: any) => ({
            title: `${site.name} (${getSiteTypeLabel(site.type)})`,
            key: `site-${site.id}`,
            isLeaf: true,
          })),
        });
      }

      result.push({
        title: <strong style={{ fontSize: 16 }}>{divisionLabels[division] || division}</strong>,
        key: division,
        selectable: false,
        children,
      });
    });

    return result;
  }, [siteGroupsData, sitesData]);

  // Tree 체크 핸들러
  const onCheck = (checked: any) => {
    setCheckedKeys(checked);
  };

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{isEditMode ? '담당자 수정' : '담당자 등록'}</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            isActive: true,
            canUseAttendance: false,
            isContractTarget: false,
            viewScope: 'NONE',
            canViewFeedbacks: false,
            canViewMealPhotos: false,
            canViewMealCounts: false,
          }}
        >
          {/* 기본 정보 */}
          <h3>기본 정보</h3>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="이름"
                name="name"
                rules={[{ required: true, message: '이름을 입력하세요' }]}
              >
                <Input placeholder="예: 홍길동" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="전화번호"
                name="phone"
                rules={[
                  { required: true, message: '전화번호를 입력하세요' },
                  { pattern: /^01\d{8,9}$/, message: '올바른 전화번호 형식이 아닙니다 (예: 01012345678)' },
                ]}
              >
                <Input placeholder="01012345678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="이메일 (선택)"
                name="email"
                rules={[{ type: 'email', message: '올바른 이메일 형식이 아닙니다' }]}
              >
                <Input placeholder="예: test@naver.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="사번 (선택)"
                name="employeeNo"
              >
                <Input placeholder="예: EMP001" disabled={isEditMode} />
              </Form.Item>
            </Col>
          </Row>

          {!isEditMode && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="비밀번호"
                  name="password"
                  rules={[
                    { required: true, message: '비밀번호를 입력하세요' },
                    { min: 4, message: '비밀번호는 최소 4자 이상이어야 합니다' },
                  ]}
                >
                  <Input.Password placeholder="초기 비밀번호 입력" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* 권한 및 부서 정보 */}
          <h3 style={{ marginTop: 24 }}>권한 및 부서 정보</h3>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="권한"
                name="role"
                rules={[{ required: true, message: '권한을 선택하세요' }]}
              >
                <Select placeholder="권한 선택" onChange={handleRoleChange}>
                  <Select.Option value="SUPER_ADMIN">슈퍼 관리자</Select.Option>
                  <Select.Option value="HQ_ADMIN">본사 관리자</Select.Option>
                  <Select.Option value="YEONGNAM_ADMIN">영남 관리자</Select.Option>
                  <Select.Option value="GROUP_MANAGER">그룹 관리자</Select.Option>
                  <Select.Option value="SITE_MANAGER">사업장 관리자</Select.Option>
                  <Select.Option value="SITE_STAFF">사업장 담당자</Select.Option>
                  <Select.Option value="DELIVERY_DRIVER">배송 기사</Select.Option>
                  <Select.Option value="CLIENT">고객사</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="부문"
                name="division"
              >
                <Select placeholder="부문 선택" allowClear>
                  <Select.Option value="HQ">본사</Select.Option>
                  <Select.Option value="YEONGNAM">영남지사</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="부서"
                name="department"
              >
                <Input placeholder="예: 영업팀" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="직책"
                name="position"
              >
                <Input placeholder="예: 팀장" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="활성 상태"
                name="isActive"
                valuePropName="checked"
              >
                <Switch checkedChildren="활성" unCheckedChildren="비활성" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="출퇴근 기능 사용"
                name="canUseAttendance"
                valuePropName="checked"
                tooltip="출퇴근 기능을 사용할 수 있는 권한을 부여합니다. 앱 메인 화면에 출퇴근 현황이 표시됩니다."
              >
                <Switch
                  checkedChildren="사용"
                  unCheckedChildren="미사용"
                  onChange={(checked) => setShowWorkSchedule(checked)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 요일별 근무시간 */}
          {showWorkSchedule && (
            <>
              <h3 style={{ marginTop: 24 }}>
                요일별 근무시간 (한국시간)
                <Tag
                  color="blue"
                  style={{ marginLeft: 8, cursor: 'help', fontWeight: 'normal', fontSize: 12 }}
                  title={"[퇴근 처리 기준]\n\n• 정상 퇴근: 근무지 내에서 퇴근 시간 전후 퇴근 처리\n• 원격 퇴근: 근무지 GPS 범위 밖에서 퇴근 처리 시 자동 기록\n• 지연 퇴근: 퇴근 예정시간 2시간 초과 후 처리 시 자동 기록\n• 퇴근 누락: 퇴근 처리를 하지 않은 경우 (푸시 알림 발송)\n\n※ 공휴일 설정은 대한민국 법정 공휴일 기준입니다."}
                >
                  ? 기준 안내
                </Tag>
              </h3>
              <div style={{ marginBottom: 12 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setWorkSchedules(prev => prev.map(s => ({
                      ...s,
                      isWorkDay: s.dayOfWeek >= 1 && s.dayOfWeek <= 5,
                      checkInTime: s.dayOfWeek >= 1 && s.dayOfWeek <= 5 ? '09:00' : null,
                      checkOutTime: s.dayOfWeek >= 1 && s.dayOfWeek <= 5 ? '18:00' : null,
                    })));
                  }}
                >
                  평일 09:00~18:00 일괄 적용
                </Button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: 80 }}>요일</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', width: 80 }}>근무일</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', width: 140 }}>출근 시간</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', width: 140 }}>퇴근 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {workSchedules.map((schedule, idx) => {
                    const dayLabel = DAY_LABELS[schedule.dayOfWeek] || `${schedule.dayOfWeek}`;
                    const isHoliday = schedule.dayOfWeek === 0 || schedule.dayOfWeek === 6 || schedule.dayOfWeek === 7;
                    return (
                      <tr key={schedule.dayOfWeek} style={{ borderBottom: '1px solid #f0f0f0', background: isHoliday ? '#fff7e6' : undefined }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold', color: schedule.dayOfWeek === 0 ? '#cf1322' : schedule.dayOfWeek === 6 ? '#1890ff' : undefined }}>
                          {dayLabel}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <Checkbox
                            checked={schedule.isWorkDay}
                            onChange={(e) => {
                              const updated = [...workSchedules];
                              updated[idx] = {
                                ...updated[idx],
                                isWorkDay: e.target.checked,
                                checkInTime: e.target.checked ? (updated[idx].checkInTime || '09:00') : null,
                                checkOutTime: e.target.checked ? (updated[idx].checkOutTime || '18:00') : null,
                              };
                              setWorkSchedules(updated);
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {schedule.isWorkDay ? (
                            <TimePicker
                              value={schedule.checkInTime ? dayjs(schedule.checkInTime, 'HH:mm') : null}
                              format="HH:mm"
                              minuteStep={10}
                              size="small"
                              onChange={(time) => {
                                const updated = [...workSchedules];
                                updated[idx] = { ...updated[idx], checkInTime: time ? time.format('HH:mm') : null };
                                setWorkSchedules(updated);
                              }}
                            />
                          ) : (
                            <span style={{ color: '#999' }}>휴무</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {schedule.isWorkDay ? (
                            <TimePicker
                              value={schedule.checkOutTime ? dayjs(schedule.checkOutTime, 'HH:mm') : null}
                              format="HH:mm"
                              minuteStep={10}
                              size="small"
                              onChange={(time) => {
                                const updated = [...workSchedules];
                                updated[idx] = { ...updated[idx], checkOutTime: time ? time.format('HH:mm') : null };
                                setWorkSchedules(updated);
                              }}
                            />
                          ) : (
                            <span style={{ color: '#999' }}>휴무</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="전자계약서 대상"
                name="isContractTarget"
                valuePropName="checked"
                tooltip="전자계약서 배정 시 자동으로 대상자 목록에 포함됩니다."
              >
                <Switch checkedChildren="대상" unCheckedChildren="비대상" />
              </Form.Item>
            </Col>
          </Row>

          {/* 데이터 열람 권한 */}
          <h3 style={{ marginTop: 24 }}>데이터 열람 권한</h3>
          <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
            사업장에 소속되지 않아도 범위 내 데이터를 모바일 앱에서 열람할 수 있습니다.
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="열람 범위"
                name="viewScope"
                tooltip="선택한 범위 내 모든 사업장의 데이터를 열람할 수 있습니다."
              >
                <Select>
                  <Select.Option value="NONE">없음</Select.Option>
                  <Select.Option value="ALL">전체</Select.Option>
                  <Select.Option value="HQ">본사</Select.Option>
                  <Select.Option value="YEONGNAM">영남지사</Select.Option>
                  <Select.Option value="CONSIGNMENT">위탁사업장</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="VOC 열람"
                name="canViewFeedbacks"
                valuePropName="checked"
              >
                <Switch checkedChildren="허용" unCheckedChildren="불가" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="배식사진 열람"
                name="canViewMealPhotos"
                valuePropName="checked"
              >
                <Switch checkedChildren="허용" unCheckedChildren="불가" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="식수 열람"
                name="canViewMealCounts"
                valuePropName="checked"
              >
                <Switch checkedChildren="허용" unCheckedChildren="불가" />
              </Form.Item>
            </Col>
          </Row>

          {/* 사업장 배정 */}
          <h3 style={{ marginTop: 24 }}>사업장 배정</h3>

          {/* 배송기사인 경우 배정된 코스 표시 및 코스 선택 옵션 표시 */}
          {selectedRole === 'DELIVERY_DRIVER' && (
            <>
              {/* 배정된 코스 목록 표시 (수정 모드일 때) */}
              {isEditMode && assignedRoutes.length > 0 && (
                <Form.Item label="배정된 배송 코스">
                  <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 4,
                    padding: 12,
                    marginBottom: 8
                  }}>
                    <Space wrap size={[8, 8]}>
                      {assignedRoutes.map((route: any) => (
                        <Tag
                          key={route.id}
                          color="green"
                          style={{ fontSize: 14, padding: '4px 12px' }}
                        >
                          {route.name} ({route.division === 'HQ' ? '본사' : '영남'}) - {route.stopsCount || route.stops?.length || 0}개 사업장
                        </Tag>
                      ))}
                    </Space>
                    <div style={{ color: '#52c41a', marginTop: 8, fontSize: 12 }}>
                      위 코스의 사업장은 아래 목록에서 자동으로 체크 표시됩니다.
                    </div>
                  </div>
                </Form.Item>
              )}

              <Form.Item label="배송 코스로 사업장 추가 배정">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ color: '#666', marginBottom: 8 }}>
                    💡 배송 코스를 선택하면 해당 코스의 모든 사업장이 자동으로 추가됩니다.
                  </div>
                  <Select
                    placeholder="배송 코스 선택"
                    style={{ width: '100%' }}
                    value={selectedRouteId}
                    onChange={handleRouteSelect}
                    allowClear
                  >
                    {routesData?.data?.map((route: any) => {
                      const isAssigned = assignedRoutes.some((ar: any) => ar.id === route.id);
                      const label = `${route.name} (${route.division === 'HQ' ? '본사' : '영남'}) - ${route.stopsCount}개 사업장${isAssigned ? ' (배정됨)' : ''}`;
                      return (
                        <Select.Option key={route.id} value={route.id} label={label} disabled={isAssigned}>
                          {label}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Space>
              </Form.Item>
            </>
          )}

          <Form.Item label="배정할 사업장/그룹 선택">
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 16,
              maxHeight: 500,
              overflow: 'auto'
            }}>
              <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
                💡 <strong>그룹 체크</strong>: 해당 그룹의 모든 사업장 자동 관리 (신규 사업장 추가 시 자동 반영)<br />
                💡 <strong>개별 사업장 체크</strong>: 특정 사업장만 관리
              </div>
              {treeData.length > 0 ? (
                <Tree
                  checkable
                  checkedKeys={checkedKeys}
                  onCheck={onCheck}
                  treeData={treeData}
                  defaultExpandAll
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
                  사업장 데이터를 불러오는 중...
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              선택됨: {checkedKeys.length}개
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              style={{ marginRight: 8 }}
            >
              {isEditMode ? '수정' : '등록'}
            </Button>
            <Button onClick={() => navigate('/staff')}>취소</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
