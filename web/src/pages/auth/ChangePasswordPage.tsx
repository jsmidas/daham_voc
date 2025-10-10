/**
 * Change Password Page
 * @description 비밀번호 변경 페이지
 */

import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '@/api/auth.api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      message.success('비밀번호가 성공적으로 변경되었습니다');
      form.resetFields();
      navigate('/dashboard');
    },
    onError: (error: any) => {
      message.error(error.message || '비밀번호 변경에 실패했습니다');
    },
  });

  const onFinish = (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('새 비밀번호가 일치하지 않습니다');
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>비밀번호 변경</h1>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="현재 비밀번호"
            name="oldPassword"
            rules={[{ required: true, message: '현재 비밀번호를 입력하세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="현재 비밀번호"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="새 비밀번호"
            name="newPassword"
            rules={[
              { required: true, message: '새 비밀번호를 입력하세요' },
              { min: 4, message: '비밀번호는 최소 4자 이상이어야 합니다' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="새 비밀번호 (최소 4자)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="새 비밀번호 확인"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '새 비밀번호를 다시 입력하세요' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="새 비밀번호 확인"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isPending}
              style={{ marginRight: 8 }}
            >
              비밀번호 변경
            </Button>
            <Button onClick={() => navigate(-1)}>취소</Button>
          </Form.Item>
        </Form>

        <Card
          style={{ marginTop: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}
          size="small"
        >
          <p style={{ margin: 0, color: '#096dd9' }}>
            💡 <strong>알림:</strong> 기본 비밀번호는 1234입니다. 보안을 위해 비밀번호를 변경하시기 바랍니다.
          </p>
        </Card>
      </Card>
    </div>
  );
}
