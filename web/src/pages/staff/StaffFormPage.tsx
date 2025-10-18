/**
 * Staff Form Page
 * @description 담당자 등록/수정 페이지
 */

import { Form, Input, Button, Card, message, Select, Row, Col, Switch, Transfer } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createStaff, updateStaff, getStaffById, assignStaffToSites } from '@/api/staff.api';
import { getSites } from '@/api/site.api';
import { useEffect, useState } from 'react';

export default function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEditMode = !!id;

  // 사업장 배정 관리
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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
        // Staff 정보
        employeeNo: staffData.employeeNo,
        department: staffData.department,
        position: staffData.position,
        managerId: staffData.managerId,
      });

      // 배정된 사업장 설정
      const assignedSiteIds = staffData.staffSites?.map((ss) => ss.siteId) || [];
      setTargetKeys(assignedSiteIds);
    }
  }, [isEditMode, staffData, form]);

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
      // 사업장 배정 업데이트
      if (id) {
        await assignStaffToSites(id, targetKeys);
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
    if (isEditMode) {
      // 수정 모드: password 제외하고 전송
      const { password, ...updateData } = values;
      updateMutation.mutate({ id, data: updateData });
    } else {
      // 생성 모드: 사업장 배정 포함
      const payload = {
        ...values,
        siteIds: targetKeys,
      };
      createMutation.mutate(payload);
    }
  };

  // Transfer onChange
  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    setTargetKeys(newTargetKeys as string[]);
  };

  // Transfer onSelectChange
  const handleSelectChange = (sourceSelectedKeys: React.Key[], targetSelectedKeys: React.Key[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[]);
  };

  // Transfer data source
  const transferDataSource = sitesData?.data?.sites?.map((site: any) => ({
    key: site.id,
    title: `${site.name} (${site.type})`,
    description: site.address,
  })) || [];

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
                <Select placeholder="권한 선택">
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
          </Row>

          {/* 사업장 배정 */}
          <h3 style={{ marginTop: 24 }}>사업장 배정</h3>
          <Form.Item label="배정할 사업장 선택">
            <Transfer
              dataSource={transferDataSource}
              titles={['사용 가능한 사업장', '배정된 사업장']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleTransferChange}
              onSelectChange={handleSelectChange}
              render={(item) => item.title || ''}
              listStyle={{
                width: '100%',
                height: 400,
              }}
              showSearch
              filterOption={(inputValue, item) =>
                (item.title || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
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
