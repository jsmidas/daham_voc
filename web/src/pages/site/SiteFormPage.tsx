/**
 * Site Form Page
 * @description 사업장 등록/수정 페이지
 */

import { Form, Input, Button, Card, message, Select } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createSite, updateSite, getSiteById } from '@/api/site.api';
import { useEffect } from 'react';

export default function SiteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEditMode = !!id;

  // 수정 모드일 때 기존 데이터 조회
  const { data: siteData } = useQuery({
    queryKey: ['site', id],
    queryFn: () => getSiteById(id!),
    enabled: isEditMode,
    retry: false,
  });

  // 폼에 기존 데이터 설정
  useEffect(() => {
    if (siteData?.data) {
      form.setFieldsValue(siteData.data);
    }
  }, [siteData, form]);

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      message.success('사업장이 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      navigate('/sites');
    },
    onError: (error: any) => {
      message.error(error.message || '등록 실패');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateSite(id, data),
    onSuccess: () => {
      message.success('사업장이 수정되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site', id] });
      navigate('/sites');
    },
    onError: (error: any) => {
      message.error(error.message || '수정 실패');
    },
  });

  const onFinish = (values: any) => {
    // 좌표를 숫자로 변환
    const payload = {
      ...values,
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
    };

    if (isEditMode) {
      updateMutation.mutate({ id, data: payload });
    } else {
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
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="사업장명"
            name="name"
            rules={[{ required: true, message: '사업장명을 입력하세요' }]}
          >
            <Input placeholder="예: 삼성전자 본사" />
          </Form.Item>

          <Form.Item
            label="유형"
            name="type"
            rules={[{ required: true, message: '유형을 선택하세요' }]}
          >
            <Select placeholder="유형 선택">
              <Select.Option value="위탁">위탁</Select.Option>
              <Select.Option value="운반급식">운반급식</Select.Option>
              <Select.Option value="도시락">도시락</Select.Option>
              <Select.Option value="행사">행사</Select.Option>
            </Select>
          </Form.Item>

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

          <Form.Item
            label="주소"
            name="address"
            rules={[{ required: true, message: '주소를 입력하세요' }]}
          >
            <Input placeholder="예: 서울시 서초구 서초대로 74길 11" />
          </Form.Item>

          <Form.Item
            label="위도"
            name="latitude"
            rules={[{ required: true, message: '위도를 입력하세요' }]}
          >
            <Input type="number" step="0.000001" placeholder="예: 37.5012767" />
          </Form.Item>

          <Form.Item
            label="경도"
            name="longitude"
            rules={[{ required: true, message: '경도를 입력하세요' }]}
          >
            <Input type="number" step="0.000001" placeholder="예: 127.0396597" />
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
            <Button onClick={() => navigate('/sites')}>취소</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
