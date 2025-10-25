/**
 * Login Page
 * @description 로그인 페이지
 */

import { Form, Input, Button, Card, message, Typography } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import logoImage from '@/assets/logo.png';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setAuth(response.data.token, response.data.user);
      message.success('로그인 성공');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      message.error(error.message || '로그인 실패');
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate(values);
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

        <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
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

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
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
