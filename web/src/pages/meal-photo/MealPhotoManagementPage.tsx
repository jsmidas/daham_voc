/**
 * Meal Photo Management Page
 * @description 배식사진 관리 페이지 (탭 방식)
 */

import React, { useState } from 'react';
import { DatePicker, Select, Tabs, Upload, Button, message, Card, Image, Badge, Tag, Modal, Table, Checkbox } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import {
  bulkUploadMealPhotos,
  getDailyMealPhotos,
  deleteMealPhoto,
  bulkDeleteMealPhotos,
  bulkCheckMealPhotos,
} from '@/api/meal-photo.api';
import dayjs, { Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import * as XLSX from 'xlsx';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SUPPER';
type PhotoType = 'SERVING' | 'LEFTOVER';

interface PhotoState {
  SERVING: UploadFile[];
  LEFTOVER: UploadFile[];
}

export default function MealPhotoManagementPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MealType>('BREAKFAST');
  const [previewOpen, setPreviewOpen] = useState(false);

  // 필터 상태
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'PARTIAL' | 'PENDING'>('ALL');
  const [checkedFilter, setCheckedFilter] = useState<'ALL' | 'CHECKED' | 'UNCHECKED'>('ALL');

  // 일괄 선택 상태
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // 각 끼니별 사진 상태 관리
  const [photos, setPhotos] = useState<Record<MealType, PhotoState>>({
    BREAKFAST: { SERVING: [], LEFTOVER: [] },
    LUNCH: { SERVING: [], LEFTOVER: [] },
    DINNER: { SERVING: [], LEFTOVER: [] },
    SUPPER: { SERVING: [], LEFTOVER: [] },
  });

  // 사업장 목록 조회 (도시락 제외)
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
    retry: false,
  });

  // 선택된 사업장의 일간 사진 조회
  const { data: dailyPhotos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['daily-meal-photos', selectedSiteId, selectedDate.format('YYYY-MM-DD')],
    queryFn: () =>
      selectedSiteId
        ? getDailyMealPhotos(selectedSiteId, selectedDate.format('YYYY-MM-DD'))
        : Promise.resolve({ data: [] }),
    enabled: !!selectedSiteId,
    retry: false,
  });

  // 사진 업로드 mutation
  const uploadMutation = useMutation({
    mutationFn: bulkUploadMealPhotos,
    onSuccess: () => {
      message.success('사진이 업로드되었습니다');
      queryClient.invalidateQueries({ queryKey: ['daily-meal-photos'] });
    },
    onError: (error: any) => {
      message.error(error.message || '사진 업로드 실패');
    },
  });

  // 사진 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealPhoto,
    onSuccess: () => {
      message.success('사진이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['daily-meal-photos'] });
    },
    onError: (error: any) => {
      message.error(error.message || '사진 삭제 실패');
    },
  });

  // 일괄 삭제 mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteMealPhotos,
    onSuccess: (data: any) => {
      message.success(data.message || '사진이 일괄 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['daily-meal-photos'] });
    },
    onError: (error: any) => {
      message.error(error.message || '일괄 삭제 실패');
    },
  });

  // 일괄 확인 완료 mutation
  const bulkCheckMutation = useMutation({
    mutationFn: bulkCheckMealPhotos,
    onSuccess: () => {
      message.success('선택한 사진이 확인 완료되었습니다');
      setSelectedPhotoIds([]);
      queryClient.invalidateQueries({ queryKey: ['daily-meal-photos'] });
    },
    onError: (error: any) => {
      message.error(error.message || '확인 완료 실패');
    },
  });

  // 전체 사업장 목록
  const filteredSites = sites?.data?.sites || [];

  // 업로드 핸들러
  const handleUploadChange = (
    { fileList }: any,
    mealType: MealType,
    photoType: PhotoType
  ) => {
    // 6개 초과 시 6개로 제한
    let limitedFileList = fileList;
    if (fileList.length > 6) {
      message.warning('최대 6개까지 업로드할 수 있습니다');
      limitedFileList = fileList.slice(0, 6);
    }

    setPhotos((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [photoType]: limitedFileList,
      },
    }));
  };

  // 사진 업로드 실행
  const handleUpload = async (mealType: MealType, photoType: PhotoType) => {
    if (!selectedSiteId) {
      message.error('사업장을 선택해주세요');
      return;
    }

    const fileList = photos[mealType][photoType];
    if (fileList.length === 0) {
      message.error('업로드할 사진을 선택해주세요');
      return;
    }

    const photoFiles = fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj as File);

    await uploadMutation.mutateAsync({
      siteId: selectedSiteId,
      mealType,
      photoType,
      capturedAt: selectedDate.format('YYYY-MM-DD'),
      photos: photoFiles,
    });

    // 업로드 후 해당 타입의 파일 목록 초기화
    setPhotos((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [photoType]: [],
      },
    }));
  };

  // 업로드된 사진 삭제
  const handleDelete = (photoId: string) => {
    Modal.confirm({
      title: '사진 삭제',
      content: '정말 이 사진을 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(photoId),
    });
  };

  // 일괄 삭제 핸들러
  const handleBulkDelete = (
    date: string,
    siteId: string,
    mealType: MealType,
    photoType?: PhotoType
  ) => {
    const typeText = photoType === 'SERVING' ? '배식준비' : photoType === 'LEFTOVER' ? '잔반' : '모든';

    Modal.confirm({
      title: '일괄 삭제',
      content: `${typeText} 사진을 모두 삭제하시겠습니까?`,
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: () => {
        bulkDeleteMutation.mutate({
          siteId,
          date,
          mealType,
          photoType,
        });
      },
    });
  };

  // 일괄 확인 완료 핸들러
  const handleBulkCheck = () => {
    if (selectedPhotoIds.length === 0) {
      message.warning('확인 완료할 사진을 선택해주세요');
      return;
    }

    Modal.confirm({
      title: '일괄 확인 완료',
      content: `선택한 ${selectedPhotoIds.length}개의 사진을 확인 완료하시겠습니까?`,
      okText: '확인 완료',
      cancelText: '취소',
      onOk: () => {
        bulkCheckMutation.mutate(selectedPhotoIds);
      },
    });
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (photoId: string, checked: boolean) => {
    if (checked) {
      setSelectedPhotoIds([...selectedPhotoIds, photoId]);
    } else {
      setSelectedPhotoIds(selectedPhotoIds.filter((id) => id !== photoId));
    }
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPhotoIds = filteredData.flatMap((item: any) => [
        ...item.servingPhotos.map((p: any) => p.id),
        ...item.leftoverPhotos.map((p: any) => p.id),
      ]);
      setSelectedPhotoIds(allPhotoIds);
    } else {
      setSelectedPhotoIds([]);
    }
  };

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    if (!dailyPhotos?.data || dailyPhotos.data.length === 0) {
      message.warning('다운로드할 데이터가 없습니다');
      return;
    }

    const excelData = dailyPhotos.data.map((photo: any) => ({
      '사업장': photo.site?.name || '-',
      '날짜': dayjs(photo.capturedAt).format('YYYY-MM-DD'),
      '끼니': getMealTypeLabel(photo.mealType),
      '사진 타입': photo.photoType === 'SERVING' ? '배식준비' : photo.photoType === 'LEFTOVER' ? '잔반' : '시설',
      '업로더': photo.uploader?.name || '-',
      '업로드 시간': dayjs(photo.createdAt).format('YYYY-MM-DD HH:mm'),
      '확인 상태': photo.isChecked ? '확인 완료' : '미확인',
      '확인자': photo.checkedBy || '-',
      '확인 시간': photo.checkedAt ? dayjs(photo.checkedAt).format('YYYY-MM-DD HH:mm') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '배식사진');
    XLSX.writeFile(wb, `배식사진_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    message.success('엑셀 파일이 다운로드되었습니다');
  };

  // 확인 상태 텍스트 반환
  const getCheckStatusText = (isChecked: boolean) => {
    return isChecked ? '확인 완료' : '미확인';
  };

  // 끼니 타입 레이블 반환
  const getMealTypeLabel = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST':
        return '조식';
      case 'LUNCH':
        return '중식';
      case 'DINNER':
        return '석식';
      case 'SUPPER':
        return '야식';
      default:
        return '-';
    }
  };

  // 업로드 버튼
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>사진 추가</div>
    </div>
  );

  // 끼니별 업로드 상태 계산
  const getUploadStatus = (mealType: MealType) => {
    const uploadedPhotosData = Array.isArray(dailyPhotos?.data) ? dailyPhotos.data : [];
    const mealPhotos = uploadedPhotosData.filter((p: any) => p.mealType === mealType);
    const servingCount = mealPhotos.filter((p: any) => p.photoType === 'SERVING').length;
    const leftoverCount = mealPhotos.filter((p: any) => p.photoType === 'LEFTOVER').length;

    if (servingCount > 0 && leftoverCount > 0) {
      return { status: 'complete', color: 'success', text: '완료' };
    } else if (servingCount > 0 || leftoverCount > 0) {
      return { status: 'partial', color: 'warning', text: '일부' };
    } else {
      return { status: 'pending', color: 'default', text: '대기' };
    }
  };

  // 탭 렌더링
  const renderMealTab = (mealType: MealType, photoType: PhotoType) => {
    const uploadedPhotosData = Array.isArray(dailyPhotos?.data) ? dailyPhotos.data : [];
    const uploadedPhotos = uploadedPhotosData.filter(
      (p: any) => p.mealType === mealType && p.photoType === photoType
    );

    return (
      <div>
        <h3>{photoType === 'SERVING' ? '배식준비 사진' : '잔반 사진'}</h3>

        {/* 업로드된 사진 표시 */}
        {uploadedPhotos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Tag color="green">업로드 완료 ({uploadedPhotos.length}개)</Tag>
            </div>
            <Image.PreviewGroup>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {uploadedPhotos.map((photo: any) => (
                  <div
                    key={photo.id}
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: 8,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div style={{ position: 'relative', marginBottom: 4 }}>
                      <Image
                        src={photo.thumbnailUrl}
                        alt={`${photoType} photo`}
                        width={120}
                        height={120}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={{
                          src: photo.imageUrl,
                        }}
                      />
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          opacity: 0.9,
                        }}
                        onClick={() => handleDelete(photo.id)}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      <div style={{ fontWeight: 'bold' }}>{photo.site?.name}</div>
                      <div>
                        {photo.capturedAt
                          ? new Date(photo.capturedAt).toLocaleDateString('ko-KR')
                          : '날짜 정보 없음'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
        )}

        {/* 새 사진 업로드 */}
        <div>
          <Upload
            listType="picture-card"
            fileList={photos[mealType][photoType]}
            onChange={(info) => handleUploadChange(info, mealType, photoType)}
            beforeUpload={() => false}
            maxCount={6}
            multiple
            accept="image/*"
          >
            {photos[mealType][photoType].length >= 6 ? null : uploadButton}
          </Upload>
          <div style={{ marginTop: 8, color: '#999', fontSize: '12px' }}>
            * 최대 6개까지 업로드 가능 (각 10MB 이하)
          </div>

          {photos[mealType][photoType].length > 0 && (
            <Button
              type="primary"
              onClick={() => handleUpload(mealType, photoType)}
              loading={uploadMutation.isPending}
              style={{ marginTop: 16 }}
            >
              업로드 ({photos[mealType][photoType].length}개)
            </Button>
          )}
        </div>
      </div>
    );
  };

  const mealTabs = [
    { key: 'BREAKFAST', label: '조식' },
    { key: 'LUNCH', label: '중식' },
    { key: 'DINNER', label: '석식' },
    { key: 'SUPPER', label: '야식' },
  ];

  // 데이터 그룹화: 날짜 + 사업장 + 끼니 기준
  const groupedData = React.useMemo(() => {
    const uploadedPhotosData = Array.isArray(dailyPhotos?.data) ? dailyPhotos.data : [];
    const groups: any = {};

    uploadedPhotosData.forEach((photo: any) => {
      const key = `${photo.capturedAt}_${photo.siteId}_${photo.mealType}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          capturedAt: photo.capturedAt,
          site: photo.site,
          mealType: photo.mealType,
          servingPhotos: [],
          leftoverPhotos: [],
        };
      }

      if (photo.photoType === 'SERVING') {
        groups[key].servingPhotos.push(photo);
      } else if (photo.photoType === 'LEFTOVER') {
        groups[key].leftoverPhotos.push(photo);
      }
    });

    return Object.values(groups);
  }, [dailyPhotos]);

  // 필터링된 데이터
  const filteredData = React.useMemo(() => {
    return groupedData.filter((item: any) => {
      // 끼니 필터
      if (mealTypeFilter !== 'ALL' && item.mealType !== mealTypeFilter) {
        return false;
      }

      // 상태 필터
      if (statusFilter !== 'ALL') {
        const hasServing = item.servingPhotos.length > 0;
        const hasLeftover = item.leftoverPhotos.length > 0;

        if (statusFilter === 'COMPLETE' && !(hasServing && hasLeftover)) {
          return false;
        }
        if (statusFilter === 'PARTIAL' && !(hasServing !== hasLeftover)) {
          return false;
        }
        if (statusFilter === 'PENDING' && (hasServing || hasLeftover)) {
          return false;
        }
      }

      // 확인 상태 필터
      if (checkedFilter !== 'ALL') {
        const allPhotos = [...item.servingPhotos, ...item.leftoverPhotos];
        const hasMatchingStatus = allPhotos.some((photo: any) =>
          checkedFilter === 'CHECKED' ? photo.isChecked : !photo.isChecked
        );
        if (!hasMatchingStatus) {
          return false;
        }
      }

      return true;
    });
  }, [groupedData, mealTypeFilter, statusFilter, checkedFilter]);

  // 테이블 컬럼 정의
  const columns = [
    {
      title: <Checkbox onChange={(e) => handleSelectAll(e.target.checked)} />,
      key: 'checkbox',
      width: 50,
      render: (_: any, record: any) => {
        const photoIds = [
          ...record.servingPhotos.map((p: any) => p.id),
          ...record.leftoverPhotos.map((p: any) => p.id),
        ];
        const allSelected = photoIds.every((id: string) => selectedPhotoIds.includes(id));
        const someSelected = photoIds.some((id: string) => selectedPhotoIds.includes(id));

        return (
          <Checkbox
            indeterminate={someSelected && !allSelected}
            checked={allSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPhotoIds([...new Set([...selectedPhotoIds, ...photoIds])]);
              } else {
                setSelectedPhotoIds(selectedPhotoIds.filter((id) => !photoIds.includes(id)));
              }
            }}
          />
        );
      },
    },
    {
      title: '날짜',
      dataIndex: 'capturedAt',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '부문',
      key: 'division',
      width: 80,
      render: (_: any, record: any) => (
        <Tag color={record.site?.division === 'HQ' ? 'blue' : 'green'}>
          {record.site?.division === 'HQ' ? '본사' : '영남'}
        </Tag>
      ),
    },
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'site',
      width: 150,
    },
    {
      title: '끼니',
      dataIndex: 'mealType',
      key: 'mealType',
      width: 80,
      render: (type: string) => {
        const labels: any = {
          BREAKFAST: '조식',
          LUNCH: '중식',
          DINNER: '석식',
          SUPPER: '야식',
        };
        return <Tag color="blue">{labels[type] || type}</Tag>;
      },
    },
    {
      title: '배식준비 사진',
      dataIndex: 'servingPhotos',
      key: 'serving',
      render: (photos: any[]) => (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {photos.length > 0 ? (
              photos.map((photo: any) => (
                <div key={photo.id} style={{ position: 'relative' }}>
                  <Checkbox
                    checked={selectedPhotoIds.includes(photo.id)}
                    onChange={(e) => handleCheckboxChange(photo.id, e.target.checked)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      zIndex: 10,
                    }}
                  />
                  <Tag
                    color={photo.isChecked ? 'green' : 'default'}
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      fontSize: 10,
                      padding: '0 4px',
                      zIndex: 10,
                    }}
                  >
                    {getCheckStatusText(photo.isChecked)}
                  </Tag>
                  <Image
                    src={photo.thumbnailUrl}
                    alt="배식준비"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    preview={{ src: photo.imageUrl }}
                  />
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      padding: '0 4px',
                      height: 20,
                      fontSize: 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                  />
                </div>
              ))
            ) : (
              <span style={{ color: '#999' }}>없음</span>
            )}
          </div>
        </Image.PreviewGroup>
      ),
    },
    {
      title: '잔반 사진',
      dataIndex: 'leftoverPhotos',
      key: 'leftover',
      render: (photos: any[]) => (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {photos.length > 0 ? (
              photos.map((photo: any) => (
                <div key={photo.id} style={{ position: 'relative' }}>
                  <Checkbox
                    checked={selectedPhotoIds.includes(photo.id)}
                    onChange={(e) => handleCheckboxChange(photo.id, e.target.checked)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      zIndex: 10,
                    }}
                  />
                  <Tag
                    color={photo.isChecked ? 'green' : 'default'}
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      fontSize: 10,
                      padding: '0 4px',
                      zIndex: 10,
                    }}
                  >
                    {getCheckStatusText(photo.isChecked)}
                  </Tag>
                  <Image
                    src={photo.thumbnailUrl}
                    alt="잔반"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    preview={{ src: photo.imageUrl }}
                  />
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      padding: '0 4px',
                      height: 20,
                      fontSize: 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                  />
                </div>
              ))
            ) : (
              <span style={{ color: '#999' }}>없음</span>
            )}
          </div>
        </Image.PreviewGroup>
      ),
    },
    {
      title: '액션',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {record.servingPhotos.length > 0 && (
            <Button
              size="small"
              danger
              onClick={() =>
                handleBulkDelete(
                  dayjs(record.capturedAt).format('YYYY-MM-DD'),
                  record.site.id,
                  record.mealType,
                  'SERVING'
                )
              }
            >
              배식 삭제
            </Button>
          )}
          {record.leftoverPhotos.length > 0 && (
            <Button
              size="small"
              danger
              onClick={() =>
                handleBulkDelete(
                  dayjs(record.capturedAt).format('YYYY-MM-DD'),
                  record.site.id,
                  record.mealType,
                  'LEFTOVER'
                )
              }
            >
              잔반 삭제
            </Button>
          )}
          {(record.servingPhotos.length > 0 || record.leftoverPhotos.length > 0) && (
            <Button
              size="small"
              danger
              type="primary"
              onClick={() =>
                handleBulkDelete(
                  dayjs(record.capturedAt).format('YYYY-MM-DD'),
                  record.site.id,
                  record.mealType
                )
              }
            >
              모두 삭제
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>배식사진 관리</h1>

      {/* 사업장 및 날짜 선택 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              사업장 선택
            </label>
            <Select
              placeholder="사업장을 선택하세요"
              style={{ width: '100%' }}
              value={selectedSiteId}
              onChange={setSelectedSiteId}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={filteredSites.map((site: any) => ({
                value: site.id,
                label: `[${site.division === 'HQ' ? '본사' : '영남'}] ${site.name}`,
              }))}
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              날짜 선택
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* 업로드 상태 표시 */}
        {selectedSiteId && (
          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 'bold' }}>업로드 상태:</div>
            {mealTabs.map(({ key, label }) => {
              const status = getUploadStatus(key as MealType);
              return (
                <Badge
                  key={key}
                  status={status.color as any}
                  text={`${label}: ${status.text}`}
                />
              );
            })}
          </div>
        )}
      </Card>

      {/* 업로드 내역 테이블 */}
      {selectedSiteId && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>업로드 내역</span>
              {selectedPhotoIds.length > 0 && (
                <Tag color="blue">{selectedPhotoIds.length}개 선택됨</Tag>
              )}
            </div>
          }
          extra={
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Select
                style={{ width: 120 }}
                value={mealTypeFilter}
                onChange={setMealTypeFilter}
                options={[
                  { value: 'ALL', label: '전체 끼니' },
                  { value: 'BREAKFAST', label: '조식' },
                  { value: 'LUNCH', label: '중식' },
                  { value: 'DINNER', label: '석식' },
                  { value: 'SUPPER', label: '야식' },
                ]}
              />
              <Select
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'ALL', label: '전체 상태' },
                  { value: 'COMPLETE', label: '완료' },
                  { value: 'PARTIAL', label: '일부' },
                  { value: 'PENDING', label: '대기' },
                ]}
              />
              <Select
                style={{ width: 120 }}
                value={checkedFilter}
                onChange={setCheckedFilter}
                options={[
                  { value: 'ALL', label: '전체' },
                  { value: 'CHECKED', label: '확인 완료' },
                  { value: 'UNCHECKED', label: '미확인' },
                ]}
              />
              {selectedPhotoIds.length > 0 && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleBulkCheck}
                  loading={bulkCheckMutation.isPending}
                >
                  일괄 확인 완료
                </Button>
              )}
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExcelDownload}
              >
                엑셀 다운로드
              </Button>
            </div>
          }
          style={{ marginBottom: 24 }}
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            loading={isLoadingPhotos}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: '업로드된 사진이 없습니다.',
            }}
          />
        </Card>
      )}

      {/* 끼니별 탭 */}
      {!selectedSiteId ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            사업장을 선택해주세요
          </div>
        </Card>
      ) : (
        <Card loading={isLoadingPhotos}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as MealType)}
            items={mealTabs.map(({ key, label }) => ({
              key,
              label: (
                <span>
                  {label}
                  {getUploadStatus(key as MealType).status === 'complete' && (
                    <CheckCircleOutlined style={{ marginLeft: 8, color: '#52c41a' }} />
                  )}
                  {getUploadStatus(key as MealType).status === 'partial' && (
                    <ClockCircleOutlined style={{ marginLeft: 8, color: '#faad14' }} />
                  )}
                </span>
              ),
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>{renderMealTab(key as MealType, 'SERVING')}</div>
                  <div>{renderMealTab(key as MealType, 'LEFTOVER')}</div>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewOpen && (
        <Modal
          open={previewOpen}
          title="사진 미리보기"
          footer={null}
          onCancel={() => setPreviewOpen(false)}
        >
          <div>미리보기</div>
        </Modal>
      )}
    </div>
  );
}
