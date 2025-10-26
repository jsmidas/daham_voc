/**
 * Login Page
 * @description 로그인 페이지
 */

import { Form, Input, Button, Card, message, Typography, Checkbox } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import logoImage from '@/assets/logo.png';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [form] = Form.useForm();

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const savedPhone = localStorage.getItem('savedPhone');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberPhone = localStorage.getItem('rememberPhone') === 'true';
    const rememberPassword = localStorage.getItem('rememberPassword') === 'true';

    if (savedPhone && rememberPhone) {
      form.setFieldValue('phone', savedPhone);
      form.setFieldValue('rememberPhone', true);
    }
    if (savedPassword && rememberPassword) {
      form.setFieldValue('password', savedPassword);
      form.setFieldValue('rememberPassword', true);
    }
  }, [form]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setAuth(response.data.token, response.data.user);
      message.success('로그인 성공');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      // 에러 타입에 따른 상세 메시지 표시
      let errorMessage = '로그인에 실패했습니다';

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          errorMessage = '전화번호 또는 비밀번호가 일치하지 않습니다';
        } else if (status === 403) {
          errorMessage = '계정이 비활성화되었습니다. 관리자에게 문의하세요';
        } else if (status === 422) {
          // 검증 에러
          if (data.error?.details && Array.isArray(data.error.details)) {
            const messages = data.error.details.map((d: any) => d.message).join(', ');
            errorMessage = messages;
          } else {
            errorMessage = '입력 형식이 올바르지 않습니다';
          }
        } else if (status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
        } else if (data.error?.message) {
          errorMessage = data.error.message;
        }
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요';
      }

      message.error(errorMessage, 4);
    },
  });

  const onFinish = (values: any) => {
    // 로그인 정보 저장 처리
    if (values.rememberPhone) {
      localStorage.setItem('savedPhone', values.phone);
      localStorage.setItem('rememberPhone', 'true');
    } else {
      localStorage.removeItem('savedPhone');
      localStorage.removeItem('rememberPhone');
    }

    if (values.rememberPassword) {
      localStorage.setItem('savedPassword', values.password);
      localStorage.setItem('rememberPassword', 'true');
    } else {
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('rememberPassword');
    }

    // 로그인 실행
    loginMutation.mutate({
      phone: values.phone,
      password: values.password,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        styles={{
          body: { padding: '48px 40px' }
        }}
        bordered={false}
      >
        {/* 로고 및 브랜드 영역 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src={logoImage}
            alt="다함 로고"
            style={{
              width: 120,
              height: 120,
              marginBottom: 24,
              borderRadius: 12,
            }}
          />
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>
            다함 VOC
          </Title>
          <Text
            style={{
              fontSize: 16,
              color: '#FF9500',
              fontWeight: 500,
              letterSpacing: '0.5px'
            }}
          >
            맛있는 변화의 시작
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label={<span style={{ fontSize: 14, fontWeight: 500 }}>전화번호</span>}
            name="phone"
            rules={[
              { required: true, message: '전화번호를 입력하세요' },
              { pattern: /^010\d{8}$/, message: '010으로 시작하는 11자리 번호를 입력하세요 (예: 01012345678)' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="01012345678"
              size="large"
              maxLength={11}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 14, fontWeight: 500 }}>비밀번호</span>}
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="비밀번호를 입력하세요"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* 로그인 정보 저장 체크박스 */}
          <Form.Item style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <Form.Item name="rememberPhone" valuePropName="checked" noStyle>
                <Checkbox>전화번호 저장</Checkbox>
              </Form.Item>
              <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
                <Checkbox>비밀번호 저장</Checkbox>
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loginMutation.isPending}
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            © 2025 다함. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
