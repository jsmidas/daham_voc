/**
 * Site Group Page
 * @description 사업장 그룹 계층 구조 관리 페이지
 */
import { useState, useEffect } from 'react';
import {
  Card,
  Tree,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  ColorPicker,
  message,
  Space,
  Tag,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ShopOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useNavigate } from 'react-router-dom';
import {
  getSiteHierarchy,
  createSiteGroup,
  updateSiteGroup,
  deleteSiteGroup,
  type SiteHierarchy,
  type MarkerShape,
  type GroupInHierarchy,
} from '@/api/site-group.api';
import { updateSite } from '@/api/site.api';
import { getMarkerShapeLabel } from '@/utils/markerShapes';

const { Option } = Select;

// 마커 모양 옵션
const markerShapes: MarkerShape[] = [
  'CIRCLE',
  'SQUARE',
  'DIAMOND',
  'HEART',
  'SPADE',
  'CLUB',
  'STAR',
  'TRIANGLE',
];

export default function SiteGroupPage() {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState<SiteHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<'HQ' | 'YEONGNAM'>('HQ');
  const [editingGroup, setEditingGroup] = useState<GroupInHierarchy | null>(null);
  const [form] = Form.useForm();

  // 데이터 로드
  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const data = await getSiteHierarchy();
      setHierarchy(data);
    } catch (error: any) {
      message.error('계층 구조를 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  // Tree 데이터 변환
  const convertToTreeData = (): DataNode[] => {
    if (!hierarchy) return [];

    return [
      {
        title: (
          <Space>
            <BankOutlined />
            <strong>{hierarchy.company}</strong>
          </Space>
        ),
        key: 'root',
        selectable: false,
        children: hierarchy.divisions.map((division) => ({
          title: (
            <Space>
              <BankOutlined />
              <strong>{division.name}</strong>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddGroup(division.code as 'HQ' | 'YEONGNAM')}
              >
                그룹 추가
              </Button>
            </Space>
          ),
          key: `division-${division.code}`,
          selectable: false,
          children: [
                // 그룹들 (본사/영남지사)
                ...(division.groups?.map((group) => ({
              title: (
                <Space>
                  <Tag color={group.markerColor}>
                    {getMarkerShapeLabel(group.markerShape)}
                  </Tag>
                  <span>{group.name}</span>
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    ({group.sites.length}개 사업장)
                  </span>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/sites/new', {
                      state: {
                        groupId: group.id,
                        division: division.code
                      }
                    })}
                  >
                    사업장 추가
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditGroup(group, division.code as 'HQ' | 'YEONGNAM')}
                  >
                    수정
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                  >
                    삭제
                  </Button>
                </Space>
              ),
              key: `group-${group.id}`,
              selectable: false,
              children: group.sites.map((site) => ({
                title: (
                  <Space>
                    <ShopOutlined />
                    <span>{site.name}</span>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      ({site.address})
                    </span>
                  </Space>
                ),
                key: `site-${site.id}`,
                isLeaf: true,
              })),
            })) || []),
              ],
        })),
      },
    ];
  };

  // 그룹 추가
  const handleAddGroup = (division: 'HQ' | 'YEONGNAM') => {
    setSelectedDivision(division);
    setEditingGroup(null);
    setModalVisible(true);
    form.resetFields();
  };

  // 그룹 수정
  const handleEditGroup = (group: GroupInHierarchy, division: 'HQ' | 'YEONGNAM') => {
    setSelectedDivision(division);
    setEditingGroup(group);
    setModalVisible(true);
    form.setFieldsValue({
      name: group.name,
      description: group.description,
      markerShape: group.markerShape,
      markerColor: group.markerColor,
      sortOrder: group.sortOrder,
    });
  };

  // 그룹 삭제
  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Modal.confirm({
      title: '그룹 삭제',
      content: `"${groupName}" 그룹을 삭제하시겠습니까? 사업장이 있는 그룹은 삭제할 수 없습니다.`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await deleteSiteGroup(groupId);
          message.success('그룹이 삭제되었습니다');
          loadHierarchy();
        } catch (error: any) {
          message.error('그룹 삭제 실패: ' + error.message);
        }
      },
    });
  };

  // 그룹 생성/수정
  const handleSubmitGroup = async (values: any) => {
    try {
      console.log('=== 그룹 생성/수정 시작 ===');
      console.log('Form values:', values);
      console.log('Selected division:', selectedDivision);

      const payload = editingGroup ? values : {
        ...values,
        division: selectedDivision,
      };

      console.log('Sending payload:', payload);

      if (editingGroup) {
        // 수정 모드
        await updateSiteGroup(editingGroup.id, payload);
        message.success('그룹이 수정되었습니다');
      } else {
        // 생성 모드
        await createSiteGroup(payload);
        message.success('그룹이 생성되었습니다');
      }
      setModalVisible(false);
      setEditingGroup(null);
      form.resetFields();
      loadHierarchy();
    } catch (error: any) {
      console.error('=== 그룹 생성/수정 에러 ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      // 중복 이름 에러 처리
      if (error.message?.includes('Unique constraint failed') || error.message?.includes('division') && error.message?.includes('name')) {
        message.error(`같은 부문에 "${values.name}" 이름의 그룹이 이미 존재합니다. 다른 이름을 사용해주세요.`);
      } else {
        const action = editingGroup ? '수정' : '생성';
        message.error(`그룹 ${action} 실패: ` + error.message);
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <BankOutlined />
            사업장 그룹 계층 구조
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadHierarchy} loading={loading}>
              새로고침
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>계층 구조를 불러오는 중...</div>
          </div>
        ) : (
          <Tree
            showLine
            defaultExpandAll
            draggable
            treeData={convertToTreeData()}
            style={{ fontSize: '14px' }}
            onDrop={async (info) => {
              const dragKey = info.dragNode.key as string;
              const dropKey = info.node.key as string;

              // 사업장(site)을 드래그한 경우만 처리
              if (!dragKey.startsWith('site-')) {
                message.warning('사업장만 다른 그룹으로 이동할 수 있습니다');
                return;
              }

              // 그룹(group)에 드롭한 경우만 처리
              if (!dropKey.startsWith('group-')) {
                message.warning('그룹으로만 이동할 수 있습니다');
                return;
              }

              const siteId = dragKey.replace('site-', '');
              const newGroupId = dropKey.replace('group-', '');

              // 사업장의 그룹 업데이트
              Modal.confirm({
                title: '사업장 이동',
                content: '선택한 사업장을 이 그룹으로 이동하시겠습니까?',
                okText: '이동',
                cancelText: '취소',
                onOk: async () => {
                  try {
                    await updateSite(siteId, { groupId: newGroupId });
                    message.success('사업장이 이동되었습니다');
                    loadHierarchy();
                  } catch (error: any) {
                    message.error('사업장 이동 실패: ' + error.message);
                  }
                },
              });
            }}
          />
        )}
      </Card>

      {/* 그룹 추가/수정 Modal */}
      <Modal
        title={editingGroup ? `그룹 수정: ${editingGroup.name}` : `${selectedDivision === 'HQ' ? '본사' : '영남지사'} 그룹 추가`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingGroup ? '수정' : '생성'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitGroup}>
          <Form.Item
            name="name"
            label="그룹 이름"
            rules={[{ required: true, message: '그룹 이름을 입력해주세요' }]}
          >
            <Input placeholder="예: 도시락, 운반급식, 행사" />
          </Form.Item>

          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} placeholder="그룹에 대한 설명을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="markerShape"
            label="마커 모양"
            initialValue="CIRCLE"
            rules={[{ required: true, message: '마커 모양을 선택해주세요' }]}
          >
            <Select placeholder="마커 모양 선택">
              {markerShapes.map((shape) => (
                <Option key={shape} value={shape}>
                  {getMarkerShapeLabel(shape)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="markerColor"
            label="마커 배경 색상"
            initialValue="#1890ff"
            rules={[{ required: true, message: '마커 색상을 선택해주세요' }]}
            getValueFromEvent={(color) => color?.toHexString?.() || '#1890ff'}
          >
            <ColorPicker
              showText
              format="hex"
              presets={[
                {
                  label: '추천 색상',
                  colors: [
                    '#1890ff', // 파랑
                    '#52c41a', // 초록
                    '#faad14', // 노랑
                    '#f5222d', // 빨강
                    '#722ed1', // 보라
                    '#fa8c16', // 주황
                    '#13c2c2', // 청록
                    '#eb2f96', // 분홍
                    '#2f54eb', // 남색
                    '#a0d911', // 연두
                  ],
                },
              ]}
            />
          </Form.Item>

          <Form.Item name="sortOrder" label="정렬 순서" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
