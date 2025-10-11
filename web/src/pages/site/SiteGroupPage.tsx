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
  Select,
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
  deleteSiteGroup,
  type SiteHierarchy,
  type MarkerShape,
} from '@/api/site-group.api';
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
              {division.code !== 'CONSIGNMENT' && (
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddGroup(division.code as 'HQ' | 'YEONGNAM')}
                >
                  그룹 추가
                </Button>
              )}
            </Space>
          ),
          key: `division-${division.code}`,
          selectable: false,
          children: division.code === 'CONSIGNMENT'
            ? // 위탁사업장은 그룹 없이 바로 사업장 표시
              [
                {
                  title: (
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/sites/new', {
                        state: {
                          type: 'CONSIGNMENT',
                          groupId: null
                        }
                      })}
                      style={{ marginBottom: '8px' }}
                    >
                      사업장 추가
                    </Button>
                  ),
                  key: 'add-consignment-site',
                  selectable: false,
                  isLeaf: true,
                },
                ...(division.sites?.map((site) => ({
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
                })) || []),
              ]
            : [
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
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                  />
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
    setModalVisible(true);
    form.resetFields();
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

  // 그룹 생성
  const handleCreateGroup = async (values: any) => {
    try {
      await createSiteGroup({
        ...values,
        division: selectedDivision,
      });
      message.success('그룹이 생성되었습니다');
      setModalVisible(false);
      form.resetFields();
      loadHierarchy();
    } catch (error: any) {
      message.error('그룹 생성 실패: ' + error.message);
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
            onDrop={(info) => {
              console.log('Dropped:', info);
              message.info('드래그 앤 드롭 기능은 곧 지원됩니다');
            }}
          />
        )}
      </Card>

      {/* 그룹 추가 Modal */}
      <Modal
        title={`${selectedDivision === 'HQ' ? '본사' : '영남지사'} 그룹 추가`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="생성"
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateGroup}>
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
            label="마커 색상"
            initialValue="#1890ff"
            rules={[{ required: true, message: '마커 색상을 입력해주세요' }]}
          >
            <Input type="color" />
          </Form.Item>

          <Form.Item name="sortOrder" label="정렬 순서" initialValue={0}>
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
