/**
 * Meal Photo Management Page
 * @description 배식사진 관리 페이지 (탭 방식)
 */

import { useState } from 'react';
import { DatePicker, Select, Tabs, Upload, Button, message, Card, Image, Badge, Tag, Modal } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { bulkUploadMealPhotos, getDailyMealPhotos, deleteMealPhoto } from '@/api/meal-photo.api';
import dayjs, { Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SUPPER';
type PhotoType = 'SERVING' | 'LEFTOVER';

interface PhotoState {
  serving: UploadFile[];
  leftover: UploadFile[];
}

export default function MealPhotoManagementPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MealType>('BREAKFAST');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // 각 끼니별 사진 상태 관리
  const [photos, setPhotos] = useState<Record<MealType, PhotoState>>({
    BREAKFAST: { serving: [], leftover: [] },
    LUNCH: { serving: [], leftover: [] },
    DINNER: { serving: [], leftover: [] },
    SUPPER: { serving: [], leftover: [] },
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

  // 도시락 사업장 제외한 사업장 목록
  const filteredSites = sites?.data?.sites?.filter((site: any) => site.type !== 'LUNCHBOX') || [];

  // 업로드 핸들러
  const handleUploadChange = (
    { fileList }: any,
    mealType: MealType,
    photoType: PhotoType
  ) => {
    if (fileList.length > 6) {
      message.warning('최대 6개까지 업로드할 수 있습니다');
      return;
    }

    setPhotos((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [photoType]: fileList,
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
      capturedAt: selectedDate.toISOString(),
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

  // 업로드 버튼
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>사진 추가</div>
    </div>
  );

  // 끼니별 업로드 상태 계산
  const getUploadStatus = (mealType: MealType) => {
    const mealPhotos = dailyPhotos?.data?.filter((p: any) => p.mealType === mealType) || [];
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
    const uploadedPhotos = dailyPhotos?.data?.filter(
      (p: any) => p.mealType === mealType && p.photoType === photoType
    ) || [];

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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {uploadedPhotos.map((photo: any) => (
                  <div key={photo.id} style={{ position: 'relative' }}>
                    <Image
                      src={photo.thumbnailUrl}
                      alt={`${photoType} photo`}
                      width={100}
                      height={100}
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
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={filteredSites.map((site: any) => ({
                value: site.id,
                label: `${site.name} (${site.type})`,
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
      <Modal
        open={previewOpen}
        title="사진 미리보기"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
}
