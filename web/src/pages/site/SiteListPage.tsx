/**
 * Site List Page
 * @description 사업장 목록 페이지
 */

import { Table, Button, Space, Input, Select, message, Popconfirm, Modal, Upload, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSites, deleteSite, downloadExcelTemplate, uploadExcelFile } from '@/api/site.api';
import { getSiteGroups } from '@/api/site-group.api';
import { SiteTypeLabels, DivisionLabels } from '@/types/index';
import { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

const { Search } = Input;

export default function SiteListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [divisionFilter, setDivisionFilter] = useState<string | undefined>();
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (filterType: 'type' | 'division' | 'group', value: any) => {
    if (filterType === 'type') setTypeFilter(value);
    else if (filterType === 'division') setDivisionFilter(value);
    else if (filterType === 'group') setGroupFilter(value);
    setPage(1);
  };

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', { search, type: typeFilter, division: divisionFilter, groupId: groupFilter, page, limit: pageSize }],
    queryFn: () => getSites({ search, type: typeFilter, division: divisionFilter, groupId: groupFilter, page, limit: pageSize }),
    retry: false,
  });

  // 사업장 그룹 목록 조회 (필터용)
  const { data: siteGroupsData } = useQuery({
    queryKey: ['site-groups'],
    queryFn: () => getSiteGroups(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      message.success('사업장이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: any) => {
      message.error(error.message || '삭제 실패');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadExcelFile,
    onSuccess: (response: any) => {
      const result = response.data;
      message.success(response.message || '업로드 완료');

      // Show detailed results
      if (result.failed && result.failed.length > 0) {
        Modal.info({
          title: '업로드 결과',
          width: 600,
          content: (
            <div>
              <p>성공: {result.success}개</p>
              <p>실패: {result.failed.length}개</p>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {result.failed.map((fail: any, index: number) => (
                  <div key={index} style={{ marginTop: 8, padding: 8, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 4 }}>
                    <strong>행 {fail.row}:</strong> {fail.error}
                  </div>
                ))}
              </div>
            </div>
          ),
        });
      }

      setUploadModalVisible(false);
      setSelectedFile(null);
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: any) => {
      message.error(error.message || '업로드 실패');
    },
  });

  // Handle Excel template download
  const handleDownloadTemplate = async () => {
    try {
      await downloadExcelTemplate();
      message.success('템플릿 다운로드 완료');
    } catch (error: any) {
      message.error(error.message || '다운로드 실패');
    }
  };

  // Handle Excel upload
  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('엑셀 파일을 선택해주세요');
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: '사업장명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: any) => SiteTypeLabels[type as keyof typeof SiteTypeLabels] || type,
    },
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
      render: (division: any) => DivisionLabels[division as keyof typeof DivisionLabels] || division,
    },
    {
      title: '그룹',
      dataIndex: 'group',
      key: 'group',
      render: (group: any) => group?.name || '(미지정)',
    },
    {
      title: '거래상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '거래중' : '거래중단'}
        </Tag>
      ),
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/sites/${record.id}/edit`)}
          >
            수정
          </Button>
          <Popconfirm
            title="삭제하시겠습니까?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 제목과 주요 액션 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>사업장 관리</h1>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
          >
            템플릿 다운로드
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            엑셀 업로드
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sites/new')}
          >
            사업장 등록
          </Button>
        </Space>
      </div>

      {/* 검색 및 필터 */}
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Search
          placeholder="사업장명 검색"
          onSearch={handleSearchChange}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="부문 선택"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => handleFilterChange('division', value)}
          value={divisionFilter}
        >
          <Select.Option value="HQ">본사</Select.Option>
          <Select.Option value="YEONGNAM">영남지사</Select.Option>
        </Select>
        <Select
          placeholder="그룹 선택"
          style={{ width: 180 }}
          allowClear
          onChange={(value) => handleFilterChange('group', value)}
          value={groupFilter}
        >
          <Select.Option value="UNASSIGNED">(미지정)</Select.Option>
          {siteGroupsData?.groups?.map((group: any) => (
            <Select.Option key={group.id} value={group.id}>
              {group.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="유형 선택"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => handleFilterChange('type', value)}
          value={typeFilter}
        >
          <Select.Option value="위탁">위탁</Select.Option>
          <Select.Option value="운반급식">운반급식</Select.Option>
          <Select.Option value="도시락">도시락</Select.Option>
          <Select.Option value="행사">행사</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={sites?.data?.sites || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: sites?.meta?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `총 ${total}개 사업장`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1); // 페이지 크기 변경 시 첫 페이지로
            }
          },
        }}
      />

      {/* Excel Upload Modal */}
      <Modal
        title="사업장 일괄 등록"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedFile(null);
          setFileList([]);
        }}
        confirmLoading={uploading}
        okText="업로드"
        cancelText="취소"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}>1. 상단의 "템플릿 다운로드" 버튼을 클릭하여 엑셀 템플릿을 다운로드하세요.</p>
          <p style={{ marginBottom: 8 }}>2. 템플릿에 사업장 정보를 입력하세요. (최대 500개)</p>
          <p style={{ marginBottom: 8 }}>3. 작성한 엑셀 파일을 아래에 업로드하세요.</p>
        </div>

        <Upload
          accept=".xlsx,.xls"
          fileList={fileList}
          beforeUpload={(file) => {
            const isExcel =
              file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
              file.type === 'application/vnd.ms-excel';

            if (!isExcel) {
              message.error('엑셀 파일만 업로드 가능합니다');
              return false;
            }

            setSelectedFile(file);
            setFileList([file as any]);
            return false;
          }}
          onRemove={() => {
            setSelectedFile(null);
            setFileList([]);
          }}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} disabled={fileList.length >= 1}>
            파일 선택
          </Button>
        </Upload>

        {fileList.length > 0 && (
          <div style={{ marginTop: 16, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
            <strong>선택된 파일:</strong> {fileList[0].name}
          </div>
        )}
      </Modal>
    </div>
  );
}
