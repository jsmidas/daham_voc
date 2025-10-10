/**
 * Login Page
 * @description 로그인 페이지
 */

import { Form, Input, Button, Card, message } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

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
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card
        title="Daham VOC 관리자 로그인"
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
      >
        <Form name="login" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '전화번호를 입력하세요' },
              { pattern: /^010\d{8}$/, message: '010으로 시작하는 11자리 번호를 입력하세요 (예: 01012345678)' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="전화번호 (01012345678)"
              size="large"
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loginMutation.isPending}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
