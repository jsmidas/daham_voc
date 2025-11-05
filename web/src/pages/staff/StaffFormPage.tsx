/**
 * Staff Form Page
 * @description 담당자 등록/수정 페이지 - 그룹/개별 사업장 선택 지원
 */

import { Form, Input, Button, Card, message, Select, Row, Col, Switch, Tree, Space, Tag } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createStaff, updateStaff, getStaffById, assignStaffToSites } from '@/api/staff.api';
import { getSites } from '@/api/site.api';
import { getSiteGroups } from '@/api/site-group.api';
import { getDeliveryRoutes } from '@/api/delivery-route.api';
import { useEffect, useState, useMemo } from 'react';

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

  // 수정 모드일 때 기존 데이터 조회
  const { data: staffData } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => getStaffById(id!),
    enabled: isEditMode,
    retry: false,
  });

  // 전체 사업장 목록 조회
  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
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
        canUseAttendance: staffData.user.canUseAttendance,
        // Staff 정보
        employeeNo: staffData.employeeNo,
        department: staffData.department,
        position: staffData.position,
        managerId: staffData.managerId,
      });

      // 역할 설정
      setSelectedRole(staffData.user.role);

      // 배정된 사업장 그룹 및 개별 사업장 설정
      const assignedSiteIds = (staffData as any).staffSites?.map((ss: any) => ss.siteId) || [];
      const assignedGroupIds = (staffData as any).staffSiteGroups?.map((sg: any) => `group-${sg.siteGroupId}`) || [];

      setCheckedKeys([...assignedGroupIds, ...assignedSiteIds]);
    }
  }, [isEditMode, staffData, form]);

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
      // 사업장 및 그룹 배정 업데이트
      if (id) {
        const { siteIds, siteGroupIds } = parseCheckedKeys(checkedKeys);
        await assignStaffToSites(id, siteIds, siteGroupIds);
      }
      message.success('담당자가 수정되었습니다');
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

    // Division별로 그룹화
    const hqGroups: any[] = [];
    const yeongnamGroups: any[] = [];

    groups.forEach((group: any) => {
      const groupSites = groupedSites.get(group.id) || [];

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
          title: `${site.name} (${site.type})`,
          key: `site-${site.id}`,
          isLeaf: true,
        })),
      };

      if (group.division === 'HQ') {
        hqGroups.push(treeNode);
      } else if (group.division === 'YEONGNAM') {
        yeongnamGroups.push(treeNode);
      }
    });

    // 그룹 미배정 사업장 처리
    const hqUngrouped = ungroupedSites.filter(s => s.division === 'HQ');
    const yeongnamUngrouped = ungroupedSites.filter(s => s.division === 'YEONGNAM');

    const result: DataNode[] = [];

    // 본사
    if (hqGroups.length > 0 || hqUngrouped.length > 0) {
      const hqChildren = [...hqGroups];

      if (hqUngrouped.length > 0) {
        hqChildren.push({
          title: (
            <span>
              <strong>그룹 미배정</strong>
              <Tag color="gray" style={{ marginLeft: 8 }}>
                {hqUngrouped.length}개
              </Tag>
            </span>
          ),
          key: 'hq-ungrouped',
          selectable: false,
          children: hqUngrouped.map((site: any) => ({
            title: `${site.name} (${site.type})`,
            key: `site-${site.id}`,
            isLeaf: true,
          })),
        });
      }

      result.push({
        title: <strong style={{ fontSize: 16 }}>본사</strong>,
        key: 'HQ',
        selectable: false,
        children: hqChildren,
      });
    }

    // 영남지사
    if (yeongnamGroups.length > 0 || yeongnamUngrouped.length > 0) {
      const yeongnamChildren = [...yeongnamGroups];

      if (yeongnamUngrouped.length > 0) {
        yeongnamChildren.push({
          title: (
            <span>
              <strong>그룹 미배정</strong>
              <Tag color="gray" style={{ marginLeft: 8 }}>
                {yeongnamUngrouped.length}개
              </Tag>
            </span>
          ),
          key: 'yeongnam-ungrouped',
          selectable: false,
          children: yeongnamUngrouped.map((site: any) => ({
            title: `${site.name} (${site.type})`,
            key: `site-${site.id}`,
            isLeaf: true,
          })),
        });
      }

      result.push({
        title: <strong style={{ fontSize: 16 }}>영남지사</strong>,
        key: 'YEONGNAM',
        selectable: false,
        children: yeongnamChildren,
      });
    }

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
                <Switch checkedChildren="사용" unCheckedChildren="미사용" />
              </Form.Item>
            </Col>
          </Row>

          {/* 사업장 배정 */}
          <h3 style={{ marginTop: 24 }}>사업장 배정</h3>

          {/* 배송기사인 경우 코스 선택 옵션 표시 */}
          {selectedRole === 'DELIVERY_DRIVER' && (
            <Form.Item label="배송 코스로 사업장 배정">
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
                    const label = `${route.name} (${route.division}) - ${route.stopsCount}개 사업장`;
                    return (
                      <Select.Option key={route.id} value={route.id} label={label}>
                        {label}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Space>
            </Form.Item>
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
