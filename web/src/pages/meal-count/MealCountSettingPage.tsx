/**
 * Meal Count Setting Page
 * @description 사업장별 식수 입력 마감시간 설정 페이지
 */

import { Button, Space, Select, message, Modal, Form, InputNumber, Switch, TimePicker, Card, Descriptions, Tag, Input, Collapse, Row, Col } from 'antd';
import { SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getMealCountSetting, upsertMealCountSetting } from '@/api/meal-count.api';
import type { MealCountSetting } from '@/api/meal-count.api';
import { useState } from 'react';
import dayjs from 'dayjs';

// 마감 시간 계산 함수
const calculateDeadlineTime = (startTime: string | undefined, hoursBefore: number): string => {
  if (!startTime) return '-';

  const [hours, minutes] = startTime.split(':').map(Number);
  const deadline = new Date();
  deadline.setHours(hours, minutes, 0, 0);
  deadline.setHours(deadline.getHours() - hoursBefore);

  const deadlineHours = deadline.getHours().toString().padStart(2, '0');
  const deadlineMinutes = deadline.getMinutes().toString().padStart(2, '0');

  return `${deadlineHours}:${deadlineMinutes}`;
};

// 미리보기 컴포넌트
function DeadlinePreview({ form }: { form: any }) {
  const deadlineHours = Form.useWatch('deadlineHoursBefore', form) || 24;
  const breakfastStart = Form.useWatch('breakfastStartTime', form);
  const lunchStart = Form.useWatch('lunchStartTime', form);
  const dinnerStart = Form.useWatch('dinnerStartTime', form);

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}
      title={
        <Space>
          <ClockCircleOutlined />
          <span>마감 시간 미리보기</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {breakfastStart && (
          <div>
            <strong>조식:</strong> {breakfastStart.format('HH:mm')} 조리 시작 →
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {calculateDeadlineTime(breakfastStart.format('HH:mm'), deadlineHours)} 마감
            </Tag>
          </div>
        )}
        {lunchStart && (
          <div>
            <strong>중식:</strong> {lunchStart.format('HH:mm')} 조리 시작 →
            <Tag color="green" style={{ marginLeft: 8 }}>
              {calculateDeadlineTime(lunchStart.format('HH:mm'), deadlineHours)} 마감
            </Tag>
          </div>
        )}
        {dinnerStart && (
          <div>
            <strong>석식:</strong> {dinnerStart.format('HH:mm')} 조리 시작 →
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {calculateDeadlineTime(dinnerStart.format('HH:mm'), deadlineHours)} 마감
            </Tag>
          </div>
        )}
        {!breakfastStart && !lunchStart && !dinnerStart && (
          <div style={{ color: '#999', fontSize: 12 }}>
            * 조리 시작 시간을 설정하면 마감 시간이 자동으로 계산됩니다
          </div>
        )}
      </Space>
    </Card>
  );
}

export default function MealCountSettingPage() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [breakfastMenuCount, setBreakfastMenuCount] = useState(1);
  const [lunchMenuCount, setLunchMenuCount] = useState(1);
  const [dinnerMenuCount, setDinnerMenuCount] = useState(1);
  const [supperMenuCount, setSupperMenuCount] = useState(1);
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

    // 먼저 폼을 리셋
    form.resetFields();

    if (currentSetting) {
      setBreakfastMenuCount(currentSetting.breakfastMenuCount || 1);
      setLunchMenuCount(currentSetting.lunchMenuCount || 1);
      setDinnerMenuCount(currentSetting.dinnerMenuCount || 1);
      setSupperMenuCount(currentSetting.supperMenuCount || 1);

      // 약간의 지연을 두고 값 설정
      setTimeout(() => {
        form.setFieldsValue({
          deadlineHoursBefore: currentSetting.deadlineHoursBefore || 24,
          breakfastStartTime: currentSetting.breakfastStartTime ? dayjs(currentSetting.breakfastStartTime, 'HH:mm') : undefined,
          lunchStartTime: currentSetting.lunchStartTime ? dayjs(currentSetting.lunchStartTime, 'HH:mm') : undefined,
          dinnerStartTime: currentSetting.dinnerStartTime ? dayjs(currentSetting.dinnerStartTime, 'HH:mm') : undefined,
          breakfastMenuCount: currentSetting.breakfastMenuCount || 1,
          lunchMenuCount: currentSetting.lunchMenuCount || 1,
          dinnerMenuCount: currentSetting.dinnerMenuCount || 1,
          supperMenuCount: currentSetting.supperMenuCount || 1,
          breakfastMenu1Name: currentSetting.breakfastMenu1Name || '',
          breakfastMenu2Name: currentSetting.breakfastMenu2Name || '',
          breakfastMenu3Name: currentSetting.breakfastMenu3Name || '',
          breakfastMenu4Name: currentSetting.breakfastMenu4Name || '',
          breakfastMenu5Name: currentSetting.breakfastMenu5Name || '',
          lunchMenu1Name: currentSetting.lunchMenu1Name || '',
          lunchMenu2Name: currentSetting.lunchMenu2Name || '',
          lunchMenu3Name: currentSetting.lunchMenu3Name || '',
          lunchMenu4Name: currentSetting.lunchMenu4Name || '',
          lunchMenu5Name: currentSetting.lunchMenu5Name || '',
          dinnerMenu1Name: currentSetting.dinnerMenu1Name || '',
          dinnerMenu2Name: currentSetting.dinnerMenu2Name || '',
          dinnerMenu3Name: currentSetting.dinnerMenu3Name || '',
          dinnerMenu4Name: currentSetting.dinnerMenu4Name || '',
          dinnerMenu5Name: currentSetting.dinnerMenu5Name || '',
          supperMenu1Name: currentSetting.supperMenu1Name || '',
          supperMenu2Name: currentSetting.supperMenu2Name || '',
          supperMenu3Name: currentSetting.supperMenu3Name || '',
          supperMenu4Name: currentSetting.supperMenu4Name || '',
          supperMenu5Name: currentSetting.supperMenu5Name || '',
          allowLateSubmission: currentSetting.allowLateSubmission ?? false,
          isActive: currentSetting.isActive ?? true,
        });
      }, 0);
    } else {
      setBreakfastMenuCount(1);
      setLunchMenuCount(1);
      setDinnerMenuCount(1);
      setSupperMenuCount(1);
      setTimeout(() => {
        form.setFieldsValue({
          deadlineHoursBefore: 24,
          breakfastMenuCount: 1,
          lunchMenuCount: 1,
          dinnerMenuCount: 1,
          supperMenuCount: 1,
          allowLateSubmission: false,
          isActive: true,
        });
      }, 0);
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
        breakfastMenuCount: values.breakfastMenuCount,
        lunchMenuCount: values.lunchMenuCount,
        dinnerMenuCount: values.dinnerMenuCount,
        supperMenuCount: values.supperMenuCount,
        breakfastMenu1Name: values.breakfastMenu1Name,
        breakfastMenu2Name: values.breakfastMenu2Name,
        breakfastMenu3Name: values.breakfastMenu3Name,
        breakfastMenu4Name: values.breakfastMenu4Name,
        breakfastMenu5Name: values.breakfastMenu5Name,
        lunchMenu1Name: values.lunchMenu1Name,
        lunchMenu2Name: values.lunchMenu2Name,
        lunchMenu3Name: values.lunchMenu3Name,
        lunchMenu4Name: values.lunchMenu4Name,
        lunchMenu5Name: values.lunchMenu5Name,
        dinnerMenu1Name: values.dinnerMenu1Name,
        dinnerMenu2Name: values.dinnerMenu2Name,
        dinnerMenu3Name: values.dinnerMenu3Name,
        dinnerMenu4Name: values.dinnerMenu4Name,
        dinnerMenu5Name: values.dinnerMenu5Name,
        supperMenu1Name: values.supperMenu1Name,
        supperMenu2Name: values.supperMenu2Name,
        supperMenu3Name: values.supperMenu3Name,
        supperMenu4Name: values.supperMenu4Name,
        supperMenu5Name: values.supperMenu5Name,
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

  // 메뉴명 렌더링 헬퍼 함수
  const renderMenuInputs = (mealType: string, count: number) => {
    const inputs = [];
    for (let i = 1; i <= count; i++) {
      inputs.push(
        <Col span={12} key={i}>
          <Form.Item
            label={`메뉴 ${i}`}
            name={`${mealType}Menu${i}Name`}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder={`메뉴 ${i}`} maxLength={20} />
          </Form.Item>
        </Col>
      );
    }
    return inputs;
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
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
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
            <Descriptions.Item label="마감 시간" span={2}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                    조리 시작 {currentSetting.deadlineHoursBefore}시간 전
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  💡 예: 조식 07:00 조리 시작 → {calculateDeadline('07:00', deadlineHours)} 마감
                  {currentSetting.allowLateSubmission &&
                    <span style={{ marginLeft: 8, color: '#fa8c16' }}>(마감 후에도 입력 가능)</span>
                  }
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="조식">
              {currentSetting.breakfastStartTime || '-'} (마감: {calculateDeadline(currentSetting.breakfastStartTime, deadlineHours)}) / 메뉴 {currentSetting.breakfastMenuCount}개
            </Descriptions.Item>
            <Descriptions.Item label="조식 메뉴">
              {[1, 2, 3, 4, 5].map(i => currentSetting[`breakfastMenu${i}Name` as keyof MealCountSetting]).filter(Boolean).map((name, idx) => (
                <Tag key={idx} color="blue">{name as string}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="중식">
              {currentSetting.lunchStartTime || '-'} (마감: {calculateDeadline(currentSetting.lunchStartTime, deadlineHours)}) / 메뉴 {currentSetting.lunchMenuCount}개
            </Descriptions.Item>
            <Descriptions.Item label="중식 메뉴">
              {[1, 2, 3, 4, 5].map(i => currentSetting[`lunchMenu${i}Name` as keyof MealCountSetting]).filter(Boolean).map((name, idx) => (
                <Tag key={idx} color="blue">{name as string}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="석식">
              {currentSetting.dinnerStartTime || '-'} (마감: {calculateDeadline(currentSetting.dinnerStartTime, deadlineHours)}) / 메뉴 {currentSetting.dinnerMenuCount}개
            </Descriptions.Item>
            <Descriptions.Item label="석식 메뉴">
              {[1, 2, 3, 4, 5].map(i => currentSetting[`dinnerMenu${i}Name` as keyof MealCountSetting]).filter(Boolean).map((name, idx) => (
                <Tag key={idx} color="blue">{name as string}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="야식 메뉴 개수" span={2}>
              {currentSetting.supperMenuCount}개
              {[1, 2, 3, 4, 5].map(i => currentSetting[`supperMenu${i}Name` as keyof MealCountSetting]).filter(Boolean).length > 0 && (
                <span style={{ marginLeft: 8 }}>
                  {[1, 2, 3, 4, 5].map(i => currentSetting[`supperMenu${i}Name` as keyof MealCountSetting]).filter(Boolean).map((name, idx) => (
                    <Tag key={idx} color="blue">{name as string}</Tag>
                  ))}
                </span>
              )}
            </Descriptions.Item>
          </Descriptions>
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
        width={900}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="마감 시간 (조리 시작 몇 시간 전에 입력 마감)"
                name="deadlineHoursBefore"
                rules={[
                  { required: true, message: '마감 시간을 입력하세요' },
                  { type: 'number', min: 1, max: 72, message: '1~72 사이' },
                ]}
                style={{ marginBottom: 12 }}
                tooltip="식사 조리 시작 시간 기준으로 몇 시간 전에 식수 입력을 마감할지 설정합니다. 예: 24시간 전 = 하루 전"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={72}
                  addonAfter="시간 전"
                  placeholder="예: 24"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="설정 활성화"
                name="isActive"
                valuePropName="checked"
                style={{ marginBottom: 12 }}
              >
                <Switch checkedChildren="활성" unCheckedChildren="비활성" />
              </Form.Item>
            </Col>
          </Row>

          {/* 마감 시간 미리보기 */}
          <DeadlinePreview form={form} />

          <Form.Item
            label="마감 후 입력 허용"
            name="allowLateSubmission"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Switch checkedChildren="허용" unCheckedChildren="불허" />
          </Form.Item>

          <Collapse
            defaultActiveKey={['breakfast', 'lunch', 'dinner']}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'breakfast',
                label: '조식 설정',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="조리 시작 시간" name="breakfastStartTime" style={{ marginBottom: 12 }}>
                          <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="메뉴 개수"
                          name="breakfastMenuCount"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 12 }}
                        >
                          <Select onChange={setBreakfastMenuCount}>
                            {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n}개</Select.Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      {renderMenuInputs('breakfast', breakfastMenuCount)}
                    </Row>
                  </>
                ),
              },
              {
                key: 'lunch',
                label: '중식 설정',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="조리 시작 시간" name="lunchStartTime" style={{ marginBottom: 12 }}>
                          <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="메뉴 개수"
                          name="lunchMenuCount"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 12 }}
                        >
                          <Select onChange={setLunchMenuCount}>
                            {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n}개</Select.Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      {renderMenuInputs('lunch', lunchMenuCount)}
                    </Row>
                  </>
                ),
              },
              {
                key: 'dinner',
                label: '석식 설정',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="조리 시작 시간" name="dinnerStartTime" style={{ marginBottom: 12 }}>
                          <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="메뉴 개수"
                          name="dinnerMenuCount"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 12 }}
                        >
                          <Select onChange={setDinnerMenuCount}>
                            {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n}개</Select.Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      {renderMenuInputs('dinner', dinnerMenuCount)}
                    </Row>
                  </>
                ),
              },
              {
                key: 'supper',
                label: '야식 설정',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          label="메뉴 개수"
                          name="supperMenuCount"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 12 }}
                        >
                          <Select onChange={setSupperMenuCount}>
                            {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n}개</Select.Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      {renderMenuInputs('supper', supperMenuCount)}
                    </Row>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </div>
  );
}
