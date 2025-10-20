import { Modal, Form, Input, Select, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { createDeliveryRoute } from '../../api/delivery-route.api';
import type { CreateDeliveryRouteDto } from '../../types/delivery-route';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeliveryRouteModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<CreateDeliveryRouteDto>();

  const createMutation = useMutation({
    mutationFn: createDeliveryRoute,
    onSuccess: () => {
      message.success('배송 코스가 생성되었습니다');
      form.resetFields();
      onSuccess();
    },
    onError: (error: any) => {
      message.error(error.message || '생성에 실패했습니다');
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // ColorPicker value를 hex string으로 변환
      if (values.color && typeof values.color === 'object') {
        values.color = (values.color as any).toHexString();
      }
      createMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="배송 코스 생성"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={createMutation.isPending}
      okText="생성"
      cancelText="취소"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          color: '#1890ff',
        }}
      >
        <Form.Item
          label="코스명"
          name="name"
          rules={[
            { required: true, message: '코스명을 입력해주세요' },
            { min: 2, message: '최소 2자 이상 입력해주세요' },
          ]}
        >
          <Input placeholder="예: A코스, 본사 오전 배송" maxLength={50} />
        </Form.Item>

        <Form.Item
          label="코스 코드"
          name="code"
          rules={[
            { required: true, message: '코스 코드를 입력해주세요' },
            { pattern: /^[A-Z0-9]+$/, message: '영문 대문자와 숫자만 입력 가능합니다' },
          ]}
        >
          <Input placeholder="예: A, B, C" maxLength={10} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item
          label="부문"
          name="division"
          rules={[{ required: true, message: '부문을 선택해주세요' }]}
        >
          <Select placeholder="부문 선택">
            <Select.Option value="HQ">본사</Select.Option>
            <Select.Option value="YEONGNAM">영남지사</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="코스 색상" name="color">
          <Input type="color" />
        </Form.Item>

        <Form.Item label="설명" name="description">
          <Input.TextArea
            placeholder="코스에 대한 설명을 입력해주세요 (선택사항)"
            rows={3}
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
