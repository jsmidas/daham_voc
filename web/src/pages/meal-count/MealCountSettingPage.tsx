/**
 * Meal Count Setting Page
 * @description 사업장별 식수 입력 마감시간 설정 페이지
 */

import { Table, Button, Space, Select, message, Modal, Form, InputNumber, Switch, TimePicker, Card, Descriptions, Tag, Input } from 'antd';
import { SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getMealCountSetting, upsertMealCountSetting } from '@/api/meal-count.api';
import type { MealCountSetting } from '@/api/meal-count.api';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function MealCountSettingPage() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [lunchMenuCount, setLunchMenuCount] = useState(1);
  const [form] = Form.useForm();

  // 사업장 목록 조회
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites({ isActive: true }),
  });

  // 선택한 사업장의 식수 설정 조회
  const { data: setting, isLoading: settingLoading } = useQuery({
    queryKey: ['meal-count-setting', selectedSiteId],
    queryFn: () => getMealCountSetting(selectedSiteId!),
    enabled: !!selectedSiteId,
  });

  // 설정 저장 Mutation
  const saveMutation = useMutation({
    mutationFn: (data: Partial<MealCountSetting>) =>
      upsertMealCountSetting(selectedSiteId!, data),
    onSuccess: () => {
      message.success('설정이 저장되었습니다');
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['meal-count-setting', selectedSiteId] });
    },
    onError: (error: any) => {
      message.error(error.message || '설정 저장에 실패했습니다');
    },
  });

  const handleOpenModal = () => {
    if (!selectedSiteId) {
      message.warning('사업장을 선택하세요');
      return;
    }

    const currentSetting = setting?.data;

    if (currentSetting) {
      const menuCount = currentSetting.lunchMenuCount || 1;
      setLunchMenuCount(menuCount);
      form.setFieldsValue({
        deadlineHoursBefore: currentSetting.deadlineHoursBefore || 24,
        breakfastStartTime: currentSetting.breakfastStartTime ? dayjs(currentSetting.breakfastStartTime, 'HH:mm') : undefined,
        lunchStartTime: currentSetting.lunchStartTime ? dayjs(currentSetting.lunchStartTime, 'HH:mm') : undefined,
        dinnerStartTime: currentSetting.dinnerStartTime ? dayjs(currentSetting.dinnerStartTime, 'HH:mm') : undefined,
        lunchMenuCount: menuCount,
        lunchMenu1Name: currentSetting.lunchMenu1Name || '',
        lunchMenu2Name: currentSetting.lunchMenu2Name || '',
        lunchMenu3Name: currentSetting.lunchMenu3Name || '',
        allowLateSubmission: currentSetting.allowLateSubmission ?? false,
        isActive: currentSetting.isActive ?? true,
      });
    } else {
      setLunchMenuCount(1);
      form.setFieldsValue({
        deadlineHoursBefore: 24,
        lunchMenuCount: 1,
        lunchMenu1Name: '',
        lunchMenu2Name: '',
        lunchMenu3Name: '',
        allowLateSubmission: false,
        isActive: true,
      });
    }

    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const data: Partial<MealCountSetting> = {
        deadlineHoursBefore: values.deadlineHoursBefore,
        breakfastStartTime: values.breakfastStartTime ? values.breakfastStartTime.format('HH:mm') : undefined,
        lunchStartTime: values.lunchStartTime ? values.lunchStartTime.format('HH:mm') : undefined,
        dinnerStartTime: values.dinnerStartTime ? values.dinnerStartTime.format('HH:mm') : undefined,
        lunchMenuCount: values.lunchMenuCount,
        lunchMenu1Name: values.lunchMenu1Name,
        lunchMenu2Name: values.lunchMenu2Name,
        lunchMenu3Name: values.lunchMenu3Name,
        allowLateSubmission: values.allowLateSubmission,
        isActive: values.isActive,
      };

      saveMutation.mutate(data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const calculateDeadline = (startTime: string | undefined, hoursBefore: number) => {
    if (!startTime) return '-';

    const [hours, minutes] = startTime.split(':').map(Number);
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);
    deadline.setHours(deadline.getHours() - hoursBefore);

    const deadlineHours = deadline.getHours().toString().padStart(2, '0');
    const deadlineMinutes = deadline.getMinutes().toString().padStart(2, '0');

    return `${deadlineHours}:${deadlineMinutes}`;
  };

  const currentSetting = setting?.data;
  const deadlineHours = currentSetting?.deadlineHoursBefore || 24;

  return (
    <div>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>식수 입력 마감시간 설정</h1>
      </div>

      {/* 사업장 선택 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>사업장 선택</div>
            <Select
              placeholder="사업장을 선택하세요"
              style={{ width: '100%', minWidth: 300 }}
              onChange={setSelectedSiteId}
              value={selectedSiteId}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={sites?.data?.sites?.map((site: any) => ({
                label: `${site.name} (${site.division})`,
                value: site.id,
              }))}
            />
          </div>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={handleOpenModal}
            disabled={!selectedSiteId}
          >
            설정 관리
          </Button>
        </Space>
      </Card>

      {/* 현재 설정 정보 */}
      {selectedSiteId && currentSetting && (
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              <span>현재 설정</span>
              {currentSetting.isActive ? (
                <Tag color="green">활성</Tag>
              ) : (
                <Tag color="red">비활성</Tag>
              )}
            </Space>
          }
          loading={settingLoading}
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="마감 시간 (조리 시작 전)">
              {currentSetting.deadlineHoursBefore}시간
            </Descriptions.Item>
            <Descriptions.Item label="마감 후 입력 허용">
              {currentSetting.allowLateSubmission ? (
                <Tag color="orange">허용</Tag>
              ) : (
                <Tag color="red">불허</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="조식 조리 시작 시간">
              {currentSetting.breakfastStartTime || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="조식 입력 마감 시간">
              {calculateDeadline(currentSetting.breakfastStartTime, deadlineHours)}
            </Descriptions.Item>
            <Descriptions.Item label="중식 조리 시작 시간">
              {currentSetting.lunchStartTime || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="중식 입력 마감 시간">
              {calculateDeadline(currentSetting.lunchStartTime, deadlineHours)}
            </Descriptions.Item>
            <Descriptions.Item label="석식 조리 시작 시간">
              {currentSetting.dinnerStartTime || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="석식 입력 마감 시간">
              {calculateDeadline(currentSetting.dinnerStartTime, deadlineHours)}
            </Descriptions.Item>
            <Descriptions.Item label="중식 메뉴 개수" span={2}>
              {currentSetting.lunchMenuCount}개
            </Descriptions.Item>
            {currentSetting.lunchMenu1Name && (
              <Descriptions.Item label="중식 메뉴 1" span={2}>
                <Tag color="blue">{currentSetting.lunchMenu1Name}</Tag>
              </Descriptions.Item>
            )}
            {currentSetting.lunchMenu2Name && (
              <Descriptions.Item label="중식 메뉴 2" span={2}>
                <Tag color="blue">{currentSetting.lunchMenu2Name}</Tag>
              </Descriptions.Item>
            )}
            {currentSetting.lunchMenu3Name && (
              <Descriptions.Item label="중식 메뉴 3" span={2}>
                <Tag color="blue">{currentSetting.lunchMenu3Name}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>

          <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
            <strong>💡 안내</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>조리 시작 시간 기준으로 설정한 시간 전까지 식수 입력이 가능합니다</li>
              <li>예: 조리 시작 06:00, 마감 24시간 전 → 입력 마감 시간은 전날 06:00</li>
              <li>마감 후 입력을 허용하면 늦은 제출로 표시되지만 등록은 가능합니다</li>
            </ul>
          </div>
        </Card>
      )}

      {selectedSiteId && !currentSetting && !settingLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ClockCircleOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
              아직 설정이 없습니다. 설정을 추가해주세요.
            </p>
            <Button type="primary" icon={<SettingOutlined />} onClick={handleOpenModal}>
              설정 추가
            </Button>
          </div>
        </Card>
      )}

      {/* 설정 모달 */}
      <Modal
        title="식수 입력 마감시간 설정"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={saveMutation.isPending}
        okText="저장"
        cancelText="취소"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            deadlineHoursBefore: 24,
            lunchMenuCount: 1,
            lunchMenu1Name: '',
            lunchMenu2Name: '',
            lunchMenu3Name: '',
            allowLateSubmission: false,
            isActive: true,
          }}
        >
          <Form.Item
            label="마감 시간 (조리 시작 전)"
            name="deadlineHoursBefore"
            rules={[
              { required: true, message: '마감 시간을 입력하세요' },
              { type: 'number', min: 1, max: 72, message: '1~72 사이의 값을 입력하세요' },
            ]}
            extra="조리 시작 시간 기준으로 몇 시간 전까지 입력을 받을지 설정합니다"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={72}
              addonAfter="시간"
              placeholder="예: 24"
            />
          </Form.Item>

          <Form.Item
            label="조식 조리 시작 시간"
            name="breakfastStartTime"
            extra="조식을 조리하기 시작하는 시간을 설정합니다"
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              placeholder="시간 선택"
              minuteStep={10}
            />
          </Form.Item>

          <Form.Item
            label="중식 조리 시작 시간"
            name="lunchStartTime"
            extra="중식을 조리하기 시작하는 시간을 설정합니다"
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              placeholder="시간 선택"
              minuteStep={10}
            />
          </Form.Item>

          <Form.Item
            label="석식 조리 시작 시간"
            name="dinnerStartTime"
            extra="석식을 조리하기 시작하는 시간을 설정합니다"
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              placeholder="시간 선택"
              minuteStep={10}
            />
          </Form.Item>

          <Form.Item
            label="중식 메뉴 개수"
            name="lunchMenuCount"
            rules={[{ required: true, message: '중식 메뉴 개수를 선택하세요' }]}
            extra="중식에 제공되는 메뉴의 종류 개수를 선택합니다 (예: 베이직/플러스, 죽/미음/일반)"
          >
            <Select
              style={{ width: '100%' }}
              onChange={(value) => setLunchMenuCount(value)}
              options={[
                { label: '1개', value: 1 },
                { label: '2개', value: 2 },
                { label: '3개', value: 3 },
              ]}
            />
          </Form.Item>

          {lunchMenuCount >= 1 && (
            <Form.Item
              label="중식 메뉴 1 명칭"
              name="lunchMenu1Name"
              extra="첫 번째 중식 메뉴의 이름 (예: 베이직, 죽, 1종)"
            >
              <Input placeholder="예: 베이직" maxLength={20} />
            </Form.Item>
          )}

          {lunchMenuCount >= 2 && (
            <Form.Item
              label="중식 메뉴 2 명칭"
              name="lunchMenu2Name"
              extra="두 번째 중식 메뉴의 이름 (예: 플러스, 미음)"
            >
              <Input placeholder="예: 플러스" maxLength={20} />
            </Form.Item>
          )}

          {lunchMenuCount >= 3 && (
            <Form.Item
              label="중식 메뉴 3 명칭"
              name="lunchMenu3Name"
              extra="세 번째 중식 메뉴의 이름 (예: 갈식, 일반)"
            >
              <Input placeholder="예: 일반" maxLength={20} />
            </Form.Item>
          )}

          <Form.Item
            label="마감 후 입력 허용"
            name="allowLateSubmission"
            valuePropName="checked"
            extra="허용 시 마감 후에도 입력 가능하지만 '늦은 제출'로 표시됩니다"
          >
            <Switch checkedChildren="허용" unCheckedChildren="불허" />
          </Form.Item>

          <Form.Item
            label="설정 활성화"
            name="isActive"
            valuePropName="checked"
            extra="비활성화 시 마감 시간 체크가 적용되지 않습니다"
          >
            <Switch checkedChildren="활성" unCheckedChildren="비활성" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
