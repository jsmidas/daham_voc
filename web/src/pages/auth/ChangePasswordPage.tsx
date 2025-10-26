/**
 * Change Password Page
 * @description 비밀번호 변경 페이지
 */

import { Form, Input, Button, Card, message, Alert, Space } from 'antd';
import { LockOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '@/api/auth.api';
import { useState } from 'react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [newPassword, setNewPassword] = useState('');

  // 비밀번호 강도 체크
  const checkPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
    };
    return checks;
  };

  const passwordChecks = checkPasswordStrength(newPassword);

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      message.success('비밀번호가 성공적으로 변경되었습니다', 3);
      form.resetFields();
      navigate('/dashboard');
    },
    onError: (error: any) => {
      // 상세한 에러 메시지 표시
      let errorMessage = '비밀번호 변경에 실패했습니다';

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          errorMessage = '현재 비밀번호가 일치하지 않습니다. 다시 확인해주세요';
        } else if (status === 422) {
          // 검증 에러
          if (data.error?.details && Array.isArray(data.error.details)) {
            const details = data.error.details;
            const messages: string[] = [];

            details.forEach((detail: any) => {
              if (detail.field === 'newPassword') {
                if (detail.message.includes('6자')) {
                  messages.push('새 비밀번호는 최소 6자 이상이어야 합니다');
                } else if (detail.message.includes('영문')) {
                  messages.push('새 비밀번호에는 영문과 숫자를 포함해야 합니다');
                } else {
                  messages.push(detail.message);
                }
              } else if (detail.field === 'oldPassword') {
                messages.push('현재 비밀번호를 입력해주세요');
              } else {
                messages.push(detail.message);
              }
            });

            if (messages.length > 0) {
              errorMessage = messages.join('\n');
            }
          } else if (data.error?.message) {
            errorMessage = data.error.message;
          }
        } else if (status === 400) {
          errorMessage = '잘못된 요청입니다. 입력 내용을 확인해주세요';
        } else if (status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
        } else if (data.error?.message) {
          errorMessage = data.error.message;
        }
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요';
      }

      message.error(errorMessage, 5);
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
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' },
            ]}
            extra={
              newPassword && (
                <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12 }}>
                    {passwordChecks.length ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                    )}
                    최소 6자 이상
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {passwordChecks.hasNumber ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                    )}
                    숫자 포함
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {passwordChecks.hasLetter ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                    )}
                    영문 포함
                  </div>
                </Space>
              )
            }
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="새 비밀번호 (최소 6자, 영문+숫자)"
              size="large"
              onChange={(e) => setNewPassword(e.target.value)}
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

        <Alert
          message="비밀번호 보안 가이드"
          description={
            <Space direction="vertical" size="small">
              <div>• 최소 6자 이상의 비밀번호를 사용하세요</div>
              <div>• 영문자와 숫자를 조합하여 사용하세요</div>
              <div>• 생일, 전화번호 등 추측하기 쉬운 비밀번호는 피하세요</div>
              <div>• 정기적으로 비밀번호를 변경하세요</div>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}
