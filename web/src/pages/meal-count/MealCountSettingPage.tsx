/**
 * Meal Count Setting Page
 * @description 사업장별 식수 입력 마감시간 설정 페이지 (재설계 v2)
 */

import { Button, Space, message, Modal, Form, Switch, TimePicker, Card, Tag, Input, Row, Col, Table, Alert } from 'antd';
import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getMealCountSetting, upsertMealCountSetting } from '@/api/meal-count.api';
import type { MealCountSetting } from '@/api/meal-count.api';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import type { TableRowSelection } from 'antd/es/table/interface';

interface SiteWithSetting {
  siteId: string;
  siteName: string;
  division: string;
  setting?: MealCountSetting;
}

export default function MealCountSettingPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSiteId, setCurrentSiteId] = useState<string | undefined>();
  const [copyMode, setCopyMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // 사업장 목록 조회
  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites({ isActive: true }),
  });

  // 모든 사업장의 설정 조회
  const { data: allSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['meal-count-settings-all'],
    queryFn: async () => {
      if (!sites?.data?.sites) return {};
      const promises = sites.data.sites.map((site: any) =>
        getMealCountSetting(site.id)
          .then(res => ({ siteId: site.id, setting: res.data }))
          .catch(() => ({ siteId: site.id, setting: null }))
      );
      const results = await Promise.all(promises);
      const settingsMap: Record<string, MealCountSetting | null> = {};
      results.forEach(r => {
        settingsMap[r.siteId] = r.setting;
      });
      return settingsMap;
    },
    enabled: !!sites?.data?.sites,
    staleTime: 0, // 항상 최신 데이터 가져오기
    gcTime: 0, // 캐시 즉시 만료
  });

  // 전체 사업장 리스트 (설정 유무와 관계없이)
  const allSitesList = useMemo<SiteWithSetting[]>(() => {
    if (!sites?.data?.sites) return [];
    return sites.data.sites.map((site: any) => ({
      siteId: site.id,
      siteName: site.name,
      division: site.division,
      setting: allSettings?.[site.id] || undefined,
    }));
  }, [sites, allSettings]);

  // 설정 저장 Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { siteId: string; setting: Partial<MealCountSetting> }) =>
      upsertMealCountSetting(data.siteId, data.setting),
    onSuccess: async () => {
      message.success('설정이 저장되었습니다');

      // 캐시 무효화 및 리프레시
      await queryClient.invalidateQueries({ queryKey: ['meal-count-settings-all'] });
      await refetchSettings();

      // 모달 닫기
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message || '설정 저장에 실패했습니다');
    },
  });

  // 선택한 사업장에 복제 Mutation
  const batchSaveMutation = useMutation({
    mutationFn: async (data: { siteIds: string[]; setting: Partial<MealCountSetting> }) => {
      const promises = data.siteIds.map(siteId =>
        upsertMealCountSetting(siteId, data.setting)
      );
      await Promise.all(promises);
    },
    onSuccess: async (_, variables) => {
      message.success(`${variables.siteIds.length}개 사업장에 설정이 적용되었습니다`);

      // 캐시 무효화 및 리프레시
      await queryClient.invalidateQueries({ queryKey: ['meal-count-settings-all'] });
      await refetchSettings();

      // 모달 닫기
      setModalVisible(false);
      form.resetFields();
      setSelectedRowKeys([]);
    },
    onError: (error: any) => {
      message.error(error.message || '설정 복제에 실패했습니다');
    },
  });

  const handleOpenModal = (siteId?: string, isCopyMode = false) => {
    setCurrentSiteId(siteId);
    setCopyMode(isCopyMode);
    form.resetFields();

    if (siteId && !isCopyMode) {
      // 개별 사업장 수정
      const siteData = allSitesList.find(s => s.siteId === siteId);
      const setting = siteData?.setting;

      if (setting) {
        setTimeout(() => {
          form.setFieldsValue({
            breakfastDeadline: setting.breakfastDeadline ? dayjs(setting.breakfastDeadline, 'HH:mm') : undefined,
            lunchDeadline: setting.lunchDeadline ? dayjs(setting.lunchDeadline, 'HH:mm') : undefined,
            dinnerDeadline: setting.dinnerDeadline ? dayjs(setting.dinnerDeadline, 'HH:mm') : undefined,
            breakfastMenuCount: setting.breakfastMenuCount ?? 1,
            lunchMenuCount: setting.lunchMenuCount ?? 1,
            dinnerMenuCount: setting.dinnerMenuCount ?? 1,
            supperMenuCount: setting.supperMenuCount ?? 1,
            // 메뉴 이름
            breakfastMenu1Name: setting.breakfastMenu1Name,
            breakfastMenu2Name: setting.breakfastMenu2Name,
            breakfastMenu3Name: setting.breakfastMenu3Name,
            breakfastMenu4Name: setting.breakfastMenu4Name,
            breakfastMenu5Name: setting.breakfastMenu5Name,
            lunchMenu1Name: setting.lunchMenu1Name,
            lunchMenu2Name: setting.lunchMenu2Name,
            lunchMenu3Name: setting.lunchMenu3Name,
            lunchMenu4Name: setting.lunchMenu4Name,
            lunchMenu5Name: setting.lunchMenu5Name,
            dinnerMenu1Name: setting.dinnerMenu1Name,
            dinnerMenu2Name: setting.dinnerMenu2Name,
            dinnerMenu3Name: setting.dinnerMenu3Name,
            dinnerMenu4Name: setting.dinnerMenu4Name,
            dinnerMenu5Name: setting.dinnerMenu5Name,
            supperMenu1Name: setting.supperMenu1Name,
            supperMenu2Name: setting.supperMenu2Name,
            supperMenu3Name: setting.supperMenu3Name,
            supperMenu4Name: setting.supperMenu4Name,
            supperMenu5Name: setting.supperMenu5Name,
            allowLateSubmission: setting.allowLateSubmission ?? false,
            isActive: setting.isActive ?? true,
          });
        }, 0);
      }
    } else {
      // 신규 또는 복제 모드
      setTimeout(() => {
        form.setFieldsValue({
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

      // 디버깅: Form 값 확인
      console.log('Form values:', values);
      console.log('breakfastDeadline:', values.breakfastDeadline);
      console.log('lunchDeadline:', values.lunchDeadline);
      console.log('dinnerDeadline:', values.dinnerDeadline);

      const settingData: Partial<MealCountSetting> = {
        breakfastDeadline: values.breakfastDeadline ? values.breakfastDeadline.format('HH:mm') : undefined,
        lunchDeadline: values.lunchDeadline ? values.lunchDeadline.format('HH:mm') : undefined,
        dinnerDeadline: values.dinnerDeadline ? values.dinnerDeadline.format('HH:mm') : undefined,
        breakfastMenuCount: parseInt(values.breakfastMenuCount) ?? 1,
        lunchMenuCount: parseInt(values.lunchMenuCount) ?? 1,
        dinnerMenuCount: parseInt(values.dinnerMenuCount) ?? 1,
        supperMenuCount: parseInt(values.supperMenuCount) ?? 1,
        allowLateSubmission: values.allowLateSubmission,
        isActive: values.isActive,
      };

      console.log('Setting data to save:', settingData);

      if (copyMode) {
        // 선택한 사업장에 복제
        if (selectedRowKeys.length === 0) {
          message.warning('사업장을 선택해주세요');
          return;
        }
        await batchSaveMutation.mutateAsync({
          siteIds: selectedRowKeys as string[],
          setting: settingData,
        });
      } else if (currentSiteId) {
        // 개별 수정
        await saveMutation.mutateAsync({ siteId: currentSiteId, setting: settingData });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('입력값을 확인해주세요');
    }
  };

  const rowSelection: TableRowSelection<SiteWithSetting> = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record: SiteWithSetting) => ({
      name: record.siteName,
    }),
  };

  // 부문 표시 함수
  const getDivisionTag = (division: string) => {
    if (division === 'HQ') {
      return <Tag color="blue">본사</Tag>;
    } else if (division === 'YEONGNAM') {
      return <Tag color="green">영남</Tag>;
    }
    return <Tag>{division}</Tag>;
  };

  const columns = [
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
      width: 80,
      render: (division: string) => getDivisionTag(division),
      filters: [
        { text: '본사', value: 'HQ' },
        { text: '영남지사', value: 'YEONGNAM' },
      ],
      onFilter: (value: any, record: SiteWithSetting) => record.division === value,
    },
    {
      title: '사업장',
      dataIndex: 'siteName',
      key: 'siteName',
      width: 180,
      render: (_: any, record: SiteWithSetting) => (
        <span style={{ fontWeight: 500 }}>{record.siteName}</span>
      ),
    },
    {
      title: '조식 마감',
      key: 'breakfast',
      width: 150,
      render: (_: any, record: SiteWithSetting) => (
        record.setting?.breakfastDeadline ? (
          <Tag color="blue">전날 {record.setting.breakfastDeadline}</Tag>
        ) : (
          <span style={{ color: '#999' }}>미설정</span>
        )
      ),
    },
    {
      title: '중식 마감',
      key: 'lunch',
      width: 150,
      render: (_: any, record: SiteWithSetting) => (
        record.setting?.lunchDeadline ? (
          <Tag color="green">당일 {record.setting.lunchDeadline}</Tag>
        ) : (
          <span style={{ color: '#999' }}>미설정</span>
        )
      ),
    },
    {
      title: '석식 마감',
      key: 'dinner',
      width: 150,
      render: (_: any, record: SiteWithSetting) => (
        record.setting?.dinnerDeadline ? (
          <Tag color="orange">당일 {record.setting.dinnerDeadline}</Tag>
        ) : (
          <span style={{ color: '#999' }}>미설정</span>
        )
      ),
    },
    {
      title: '메뉴 개수',
      key: 'menuCount',
      width: 200,
      render: (_: any, record: SiteWithSetting) => {
        if (!record.setting) return <span style={{ color: '#999' }}>미설정</span>;
        return (
          <Space size={4}>
            <Tag>조 {record.setting.breakfastMenuCount}개</Tag>
            <Tag>중 {record.setting.lunchMenuCount}개</Tag>
            <Tag>석 {record.setting.dinnerMenuCount}개</Tag>
            <Tag>야 {record.setting.supperMenuCount}개</Tag>
          </Space>
        );
      },
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_: any, record: SiteWithSetting) => {
        if (!record.setting) return <Tag>미설정</Tag>;
        return (
          <Space>
            {record.setting.isActive ? <Tag color="green">활성</Tag> : <Tag>비활성</Tag>}
            {record.setting.allowLateSubmission && <Tag color="orange">마감후허용</Tag>}
          </Space>
        );
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: SiteWithSetting) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record.siteId)}
        >
          {record.setting ? '수정' : '설정'}
        </Button>
      ),
    },
  ];

  const settingsCount = allSitesList.filter(s => s.setting).length;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>식수 마감시간 설정</h1>
      </div>

      {/* 안내 메시지 */}
      <Alert
        message="마감시간 설정 안내"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li><strong>조식:</strong> 전날 저녁에 마감 (예: 전날 20:00)</li>
            <li><strong>중식/석식:</strong> 당일 마감 (예: 당일 10:00, 15:00)</li>
            <li><strong>일괄 적용:</strong> 사업장을 선택하고 "선택한 사업장에 설정 복제" 버튼을 클릭하세요</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 설정 목록 테이블 */}
      <Card
        title={
          <Space>
            <span>전체 사업장 ({allSitesList.length}개)</span>
            <Tag color="green">설정됨 {settingsCount}개</Tag>
            <Tag color="default">미설정 {allSitesList.length - settingsCount}개</Tag>
          </Space>
        }
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <span style={{ color: '#1890ff' }}>
                {selectedRowKeys.length}개 선택됨
              </span>
            )}
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => handleOpenModal(undefined, true)}
              disabled={selectedRowKeys.length === 0}
            >
              선택한 사업장에 설정 복제
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={allSitesList}
          rowKey="siteId"
          loading={sitesLoading || settingsLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 설정 모달 */}
      <Modal
        title={
          copyMode
            ? `선택한 ${selectedRowKeys.length}개 사업장에 설정 복제`
            : '마감시간 설정'
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={saveMutation.isPending || batchSaveMutation.isPending}
        okText={copyMode ? `${selectedRowKeys.length}개 사업장에 적용` : '저장'}
        cancelText="취소"
        width={800}
      >
        {copyMode && (
          <Alert
            message="설정 복제 안내"
            description={
              <div>
                <p>선택한 <strong>{selectedRowKeys.length}개 사업장</strong>에 동일한 설정이 적용됩니다:</p>
                <div style={{ maxHeight: 100, overflow: 'auto', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                  {selectedRowKeys.map(key => {
                    const site = allSitesList.find(s => s.siteId === key);
                    return site ? <Tag key={key} style={{ margin: 2 }}>{site.siteName}</Tag> : null;
                  })}
                </div>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical">
          {/* 마감 시간 설정 */}
          <Card title="마감 시간 설정" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={
                    <Space>
                      <span>조식 마감</span>
                      <Tag color="blue" style={{ fontSize: 11 }}>전날</Tag>
                    </Space>
                  }
                  name="breakfastDeadline"
                  tooltip="조식은 전날 저녁에 마감됩니다"
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} placeholder="예: 20:00" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <Space>
                      <span>중식 마감</span>
                      <Tag color="green" style={{ fontSize: 11 }}>당일</Tag>
                    </Space>
                  }
                  name="lunchDeadline"
                  tooltip="중식은 당일 오전에 마감됩니다"
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} placeholder="예: 10:00" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <Space>
                      <span>석식 마감</span>
                      <Tag color="orange" style={{ fontSize: 11 }}>당일</Tag>
                    </Space>
                  }
                  name="dinnerDeadline"
                  tooltip="석식은 당일 오후에 마감됩니다"
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} placeholder="예: 15:00" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 메뉴 개수 설정 */}
          <Card title="메뉴 개수" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="조식" name="breakfastMenuCount" rules={[{ required: true }]}>
                  <Input type="number" min={0} max={5} suffix="개" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="중식" name="lunchMenuCount" rules={[{ required: true }]}>
                  <Input type="number" min={0} max={5} suffix="개" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="석식" name="dinnerMenuCount" rules={[{ required: true }]}>
                  <Input type="number" min={0} max={5} suffix="개" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="야식" name="supperMenuCount" rules={[{ required: true }]}>
                  <Input type="number" min={0} max={5} suffix="개" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 기타 설정 */}
          <Card title="기타 설정" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="마감 후 입력 허용" name="allowLateSubmission" valuePropName="checked">
                  <Switch checkedChildren="허용" unCheckedChildren="불허" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="설정 활성화" name="isActive" valuePropName="checked">
                  <Switch checkedChildren="활성" unCheckedChildren="비활성" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
    </div>
  );
}
