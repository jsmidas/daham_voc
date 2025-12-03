/**
 * Site Form Page
 * @description 사업장 등록/수정 페이지
 */

import { Form, Input, Button, Card, message, Select, Alert, Space, DatePicker, InputNumber, Row, Col, Switch } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createSite, updateSite, getSiteById } from '@/api/site.api';
import { getMenuTypes } from '@/api/menu-type.api';
import { getSiteGroups } from '@/api/site-group.api';
import { getMealMenus, getSiteMealMenus, assignMealMenusToSite } from '@/api/meal-menu.api';
import { useEffect } from 'react';
import { DivisionLabels } from '@/types';

export default function SiteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEditMode = !!id;

  // 계층 구조에서 전달된 초기값 가져오기 또는 목록에서 전달된 페이지/필터 정보
  const stateData = location.state as {
    groupId?: string;
    division?: string;
    type?: string;
    returnPage?: number;
    returnPageSize?: number;
    returnSearch?: string;
    returnType?: string;
    returnDivision?: string;
    returnGroup?: string;
  } | null;

  // 사업장 목록으로 돌아갈 때 필터 상태 포함 URL 생성
  const getReturnUrl = () => {
    if (!stateData) return '/sites';
    const params = new URLSearchParams();
    if (stateData.returnPage && stateData.returnPage > 1) params.set('page', stateData.returnPage.toString());
    if (stateData.returnPageSize && stateData.returnPageSize !== 50) params.set('pageSize', stateData.returnPageSize.toString());
    if (stateData.returnSearch) params.set('search', stateData.returnSearch);
    if (stateData.returnType) params.set('type', stateData.returnType);
    if (stateData.returnDivision) params.set('division', stateData.returnDivision);
    if (stateData.returnGroup) params.set('group', stateData.returnGroup);
    const queryString = params.toString();
    return queryString ? `/sites?${queryString}` : '/sites';
  };

  // 수정 모드일 때 기존 데이터 조회
  const { data: siteData } = useQuery({
    queryKey: ['site', id],
    queryFn: () => getSiteById(id!),
    enabled: isEditMode,
    retry: false,
  });

  // 식단유형 목록 조회
  const { data: menuTypesData, isLoading: isLoadingMenuTypes } = useQuery({
    queryKey: ['menu-types'],
    queryFn: getMenuTypes,
  });

  // 사업장 그룹 목록 조회
  const { data: siteGroupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['site-groups'],
    queryFn: () => getSiteGroups(),
  });

  // 식수 메뉴 목록 조회
  const { data: mealMenusData, isLoading: isLoadingMealMenus } = useQuery({
    queryKey: ['meal-menus'],
    queryFn: () => getMealMenus(),
  });

  // 사업장에 할당된 식수 메뉴 조회 (수정 모드)
  const { data: siteMealMenusData } = useQuery({
    queryKey: ['site-meal-menus', id],
    queryFn: () => getSiteMealMenus(id!),
    enabled: isEditMode && !!id,
  });

  // 폼에 기존 데이터 설정 (수정 모드) 또는 초기값 설정 (생성 모드)
  useEffect(() => {
    if (isEditMode && siteData?.data) {
      // 수정 모드: 기존 데이터 로드
      const formData = {
        ...siteData.data,
        contractStartDate: siteData.data.contractStartDate ? dayjs(siteData.data.contractStartDate) : undefined,
        contractEndDate: siteData.data.contractEndDate ? dayjs(siteData.data.contractEndDate) : undefined,
        // siteMenuTypes를 menuTypeIds 배열로 변환
        menuTypeIds: siteData.data.siteMenuTypes?.map((smt: any) => smt.menuTypeId) || [],
        // siteMealMenus를 mealMenuIds 배열로 변환
        mealMenuIds: siteMealMenusData?.data?.map((m: any) => m.id) || [],
      };
      form.setFieldsValue(formData);
    } else if (!isEditMode && stateData) {
      // 생성 모드: 계층 구조에서 전달된 초기값 설정
      form.setFieldsValue({
        groupId: stateData.groupId,
        division: stateData.division,
        type: stateData.type,
      });
    }
  }, [isEditMode, siteData, stateData, form, siteMealMenusData]);

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      message.success('사업장이 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site-groups'] });
      // 계층 구조에서 온 경우 다시 돌아가기, 아니면 사업장 목록으로
      navigate(stateData ? '/site-groups' : '/sites');
    },
    onError: (error: any) => {
      console.error('=== Create Error ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);

      // 서버에서 반환한 자세한 에러 메시지 표시
      const errorMessage = error.response?.data?.message || error.message || '등록 실패';
      const errorDetails = error.response?.data?.details;

      if (errorDetails && Array.isArray(errorDetails)) {
        // Validation 에러인 경우 자세한 메시지 표시
        const detailMessages = errorDetails.map((d: any) => `${d.field}: ${d.message}`).join('\n');
        message.error(`${errorMessage}\n${detailMessages}`, 10);
      } else {
        message.error(errorMessage);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateSite(id, data),
    onSuccess: () => {
      message.success('사업장이 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site', id] });
      queryClient.invalidateQueries({ queryKey: ['site-groups'] });
      // 이전 페이지 및 필터 정보가 있으면 해당 상태로 이동
      navigate(getReturnUrl());
    },
    onError: (error: any) => {
      console.error('=== Update Error ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);

      // 서버에서 반환한 자세한 에러 메시지 표시
      const errorMessage = error.response?.data?.error?.message || error.message || '수정 실패';
      const errorDetails = error.response?.data?.error?.details;

      if (errorDetails && Array.isArray(errorDetails)) {
        // Validation 에러인 경우 사용자 친화적인 메시지로 변환
        const fieldMessages: Record<string, string> = {
          contactPhone1: '연락처 1',
          contactPhone2: '연락처 2',
          name: '사업장명',
          address: '주소',
          latitude: '위도',
          longitude: '경도',
        };

        const detailMessages = errorDetails.map((d: any) => {
          const fieldName = fieldMessages[d.field] || d.field;
          if (d.field === 'contactPhone1' || d.field === 'contactPhone2') {
            return `${fieldName}: 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678, 053-123-4567)`;
          }
          return `${fieldName}: ${d.message}`;
        }).join('\n');

        message.error({
          content: `입력값을 확인해주세요\n${detailMessages}`,
          duration: 8,
        });
      } else {
        message.error(errorMessage);
      }
    },
  });

  const onFinish = async (values: any) => {
    console.log('=== onFinish 호출 ===');
    console.log('Form values:', values);

    // mealMenuIds는 별도로 처리
    const { mealMenuIds, ...restValues } = values;

    // 좌표를 숫자로 변환하고 날짜를 ISO 문자열로 변환
    const payload = {
      ...restValues,
      groupId: restValues.groupId || undefined, // 빈 문자열을 undefined로 변환
      latitude: parseFloat(restValues.latitude),
      longitude: parseFloat(restValues.longitude),
      contactPerson1: restValues.contactPerson1 || undefined,
      contactPhone1: restValues.contactPhone1 || undefined,
      contactPerson2: restValues.contactPerson2 || undefined,
      contactPhone2: restValues.contactPhone2 || undefined,
      deliveryRoute: restValues.deliveryRoute || undefined,
      pricePerMeal: restValues.pricePerMeal ? parseFloat(restValues.pricePerMeal) : undefined,
      contractStartDate: restValues.contractStartDate ? restValues.contractStartDate.toISOString() : undefined,
      contractEndDate: restValues.contractEndDate ? restValues.contractEndDate.toISOString() : undefined,
    };

    console.log('Payload to send:', payload);
    console.log('Payload types:', {
      latitude: typeof payload.latitude,
      longitude: typeof payload.longitude,
      pricePerMeal: typeof payload.pricePerMeal,
      contractStartDate: typeof payload.contractStartDate,
      contractEndDate: typeof payload.contractEndDate,
      groupId: typeof payload.groupId,
    });

    if (isEditMode) {
      updateMutation.mutate({ id, data: payload });
      // 식수 메뉴 할당 (사업장 수정 시)
      if (mealMenuIds && id) {
        try {
          await assignMealMenusToSite(id, mealMenuIds);
        } catch (error) {
          console.error('식수 메뉴 할당 실패:', error);
        }
      }
    } else {
      // 신규 등록 시에는 사업장이 생성된 후 mealMenuIds 할당 필요
      // createMutation onSuccess에서 처리
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{isEditMode ? '사업장 수정' : '사업장 등록'}</h1>
      </div>

      <Card>
        <Alert
          message="주소 입력 방법"
          description="주소 입력란 옆의 파란색 '주소 검색' 버튼을 클릭하여 Kakao 주소 검색 팝업에서 주소를 선택하세요. 브라우저의 자동완성 기능을 사용하지 마세요. 주소 선택 시 위도/경도가 자동으로 입력됩니다."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{}}
        >
          {/* 사업장 그룹 */}
          <Form.Item
            label="사업장 그룹"
            name="groupId"
            rules={[{ required: true, message: '사업장 그룹을 선택하세요' }]}
            tooltip="사업장이 속한 그룹을 선택하세요 (필수)"
          >
            <Select
              placeholder="그룹 선택"
              loading={isLoadingGroups}
              options={[

                ...(siteGroupsData?.groups?.map((group: any) => ({
                  label: `${group.name} (${DivisionLabels[group.division as keyof typeof DivisionLabels]})`,
                  value: group.id,
                })) || [])
              ]}
            />
          </Form.Item>

          {/* 사업장명 */}
          <Form.Item
            label="사업장명"
            name="name"
            rules={[{ required: true, message: '사업장명을 입력하세요' }]}
          >
            <Input placeholder="예: 삼성전자 본사" />
          </Form.Item>

          {/* 유형, 부문, 거래상태 */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="유형"
                name="type"
                rules={[{ required: true, message: '유형을 선택하세요' }]}
              >
                <Select placeholder="유형 선택">
                  <Select.Option value="CONSIGNMENT">위탁</Select.Option>
                  <Select.Option value="DELIVERY">운반급식</Select.Option>
                  <Select.Option value="LUNCHBOX">도시락</Select.Option>
                  <Select.Option value="EVENT">행사</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="부문"
                name="division"
                rules={[{ required: true, message: '부문을 선택하세요' }]}
              >
                <Select placeholder="부문 선택">
                  <Select.Option value="HQ">본사</Select.Option>
                  <Select.Option value="YEONGNAM">영남지사</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="거래 상태"
                name="isActive"
                valuePropName="checked"
                tooltip="OFF로 설정하면 지도, 식수요청, 앱 등 모든 서비스에서 제외됩니다"
                initialValue={true}
              >
                <Switch
                  checkedChildren="거래중"
                  unCheckedChildren="거래중단"
                  style={{ marginTop: 4 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="주소" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="address"
                noStyle
                rules={[{ required: true, message: '주소를 검색하세요' }]}
              >
                <Input
                  style={{ width: 'calc(100% - 200px)' }}
                  placeholder="주소 검색 버튼을 클릭하세요"
                  readOnly
                  autoComplete="off"
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  console.log('=== 주소 검색 버튼 클릭 ===');
                  console.log('daum 객체 존재:', !!(window as any).daum);

                  if (!(window as any).daum) {
                    message.error('Kakao 우편번호 서비스를 불러올 수 없습니다.');
                    return;
                  }

                  const postcodeInstance = new (window as any).daum.Postcode({
                    oncomplete: function(data: any) {
                      console.log('=== 주소 선택됨 ===');
                      console.log('선택된 데이터:', data);

                      const fullAddress = data.roadAddress || data.jibunAddress;
                      console.log('최종 주소:', fullAddress);

                      // 주소 입력
                      form.setFieldsValue({ address: fullAddress });
                      message.info('주소가 입력되었습니다. 좌표 변환 중...');

                      // 좌표 변환 (REST API 키 사용)
                      const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
                      console.log('REST API 키:', apiKey);

                      if (!apiKey || apiKey === 'your_kakao_map_key_here') {
                        message.warning('좌표는 수동으로 입력해주세요 (REST API 키 미설정)');
                        return;
                      }

                      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(fullAddress)}`;

                      fetch(url, {
                        headers: {
                          Authorization: `KakaoAK ${apiKey}`,
                        },
                      })
                        .then(response => {
                          console.log('응답 상태:', response.status);
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                          }
                          return response.json();
                        })
                        .then(result => {
                          console.log('API 응답:', result);
                          if (result.documents && result.documents.length > 0) {
                            const { x, y } = result.documents[0];
                            form.setFieldsValue({
                              latitude: parseFloat(y),
                              longitude: parseFloat(x),
                            });
                            message.success('주소와 좌표가 입력되었습니다!');
                          } else {
                            message.warning('좌표를 찾을 수 없습니다. 수동으로 입력해주세요.');
                          }
                        })
                        .catch(error => {
                          console.error('좌표 변환 오류:', error);
                          message.error('좌표 변환 실패. 수동으로 입력해주세요.');
                        });
                    },
                  });

                  console.log('Postcode 인스턴스 생성 완료');
                  postcodeInstance.open();
                  console.log('주소 검색 창 열기 완료');
                }}
              >
                주소 검색
              </Button>
              <Button
                onClick={() => {
                  form.setFieldsValue({
                    address: undefined,
                    latitude: undefined,
                    longitude: undefined,
                  });
                  message.info('주소 정보가 초기화되었습니다');
                }}
              >
                초기화
              </Button>
            </Space.Compact>
          </Form.Item>

          {/* 위도, 경도 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="위도"
                name="latitude"
                rules={[{ required: true, message: '위도를 입력하세요' }]}
              >
                <Input type="number" step="0.000001" placeholder="예: 37.5012767" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="경도"
                name="longitude"
                rules={[{ required: true, message: '경도를 입력하세요' }]}
              >
                <Input type="number" step="0.000001" placeholder="예: 127.0396597" />
              </Form.Item>
            </Col>
          </Row>

          {/* 담당자 1 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="담당자명 1"
                name="contactPerson1"
              >
                <Input placeholder="예: 홍길동" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="연락처 1"
                name="contactPhone1"
              >
                <Input placeholder="예: 010-1234-5678" />
              </Form.Item>
            </Col>
          </Row>

          {/* 담당자 2 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="담당자명 2"
                name="contactPerson2"
              >
                <Input placeholder="예: 김철수" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="연락처 2"
                name="contactPhone2"
              >
                <Input placeholder="예: 010-9876-5432" />
              </Form.Item>
            </Col>
          </Row>

          {/* 식단유형, 식수메뉴 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="식단유형"
                name="menuTypeIds"
                tooltip="식단표에 표시할 식단 유형 (예: 5찬 저가, 4찬 고가 등)"
              >
                <Select
                  mode="multiple"
                  placeholder="식단유형 선택"
                  loading={isLoadingMenuTypes}
                  options={menuTypesData?.menuTypes?.map((menuType) => ({
                    label: menuType.name,
                    value: menuType.id,
                  })) || []}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="식수 메뉴"
                name="mealMenuIds"
                rules={[{ required: true, message: '식수 메뉴를 1개 이상 선택하세요' }]}
                tooltip="고객이 식수 입력 시 선택할 수 있는 메뉴 (예: A코스, B코스) - 필수"
              >
                <Select
                  mode="multiple"
                  placeholder="식수 메뉴 선택 (필수)"
                  loading={isLoadingMealMenus}
                  options={mealMenusData?.data?.map((menu: any) => ({
                    label: menu.name,
                    value: menu.id,
                  })) || []}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 단가, 배송코스 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="단가 (원)"
                name="pricePerMeal"
                tooltip="1인당 식사 단가를 입력하세요"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="예: 7000"
                  formatter={value => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => (value!.replace(/₩\s?|(,*)/g, '') ? parseFloat(value!.replace(/₩\s?|(,*)/g, '')) : 0) as 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="배송코스"
                name="deliveryRoute"
                tooltip="배송 경로나 구역을 입력하세요"
              >
                <Input placeholder="예: A코스, 강남구역" />
              </Form.Item>
            </Col>
          </Row>

          {/* 계약기간 */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="계약시작일"
                name="contractStartDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="계약 시작일 선택" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="계약종료일"
                name="contractEndDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="계약 종료일 선택" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              style={{ marginRight: 8 }}
            >
              {isEditMode ? '수정' : '등록'}
            </Button>
            <Button onClick={() => navigate(getReturnUrl())}>취소</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
