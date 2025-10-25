/**
 * Meal Count List Page
 * @description 식수 인원 조회 및 수정 페이지
 */

import { useState } from 'react';
import { Card, Select, DatePicker, Table, Button, Space, Modal, Form, InputNumber, Input, message } from 'antd';

const { RangePicker } = DatePicker;
import { EditOutlined, DeleteOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getMealCountsByRange, getMealCountSetting, createMealCount, updateMealCount, deleteMealCount } from '@/api/meal-count.api';
import type { MealCount, MealType } from '@/api/meal-count.api';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const MEAL_TYPES = [
  { label: '조식', value: 'BREAKFAST' },
  { label: '중식', value: 'LUNCH' },
  { label: '석식', value: 'DINNER' },
  { label: '야식', value: 'SUPPER' },
];

export default function MealCountListPage() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
  const [isAllSites, setIsAllSites] = useState(false); // 전체 사업장 조회 여부
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MealCount | null>(null);
  const [form] = Form.useForm();

  // 필터 상태
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterInputStatus, setFilterInputStatus] = useState<string>('ALL'); // ALL, COMPLETED, PENDING

  // 사업장 목록 조회 (전체)
  const { data: sites } = useQuery({
    queryKey: ['sites', { limit: 1000 }],
    queryFn: () => getSites({ isActive: true, limit: 1000 }),
  });

  // 필터링된 사업장 목록
  const filteredSites = sites?.data?.sites?.filter((site: any) => {
    // 지사 필터
    if (filterDivision !== 'ALL' && site.division !== filterDivision) {
      return false;
    }

    // 유형 필터
    if (filterType !== 'ALL' && site.type !== filterType) {
      return false;
    }

    // 입력 상태 필터
    if (filterInputStatus !== 'ALL' && todayAllMealCounts) {
      const hasInput = todayAllMealCounts[site.id] || false;
      if (filterInputStatus === 'COMPLETED' && !hasInput) {
        return false;
      }
      if (filterInputStatus === 'PENDING' && hasInput) {
        return false;
      }
    }

    return true;
  }) || [];

  // 사업장 식수 설정 조회
  const { data: settingData } = useQuery({
    queryKey: ['meal-count-setting', selectedSiteId],
    queryFn: () => getMealCountSetting(selectedSiteId!),
    enabled: !!selectedSiteId,
  });

  // 식수 데이터 조회 (단일 사업장)
  const { data: mealCounts, isLoading } = useQuery({
    queryKey: ['meal-counts', selectedSiteId, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: () => getMealCountsByRange(
      selectedSiteId!,
      dateRange[0].format('YYYY-MM-DD'),
      dateRange[1].format('YYYY-MM-DD')
    ),
    enabled: !!selectedSiteId && !isAllSites,
  });

  // 전체 사업장 식수 데이터 조회
  const { data: allSitesMealCounts, isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-sites-meal-counts', filteredSites.map((s: any) => s.id).join(','), dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: async () => {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // 필터링된 사업장들의 데이터를 병렬로 가져옴
      const promises = filteredSites.map((site: any) =>
        getMealCountsByRange(site.id, startDate, endDate).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);

      // 사업장별로 데이터 매핑
      const dataMap: { [siteId: string]: MealCount[] } = {};
      filteredSites.forEach((site: any, index: number) => {
        dataMap[site.id] = results[index]?.data || [];
      });

      return dataMap;
    },
    enabled: isAllSites && filteredSites.length > 0,
  });

  // 오늘 날짜의 전체 사업장 식수 입력 데이터 (입력 상태 필터용)
  const today = dayjs().format('YYYY-MM-DD');
  const { data: todayAllMealCounts } = useQuery({
    queryKey: ['today-all-meal-counts', today],
    queryFn: async () => {
      // 모든 사업장의 오늘 날짜 데이터를 가져옴
      const allSites = sites?.data?.sites || [];
      const promises = allSites.map((site: any) =>
        getMealCountsByRange(site.id, today, today).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);

      // 사업장별로 입력 여부 매핑
      const inputStatusMap: { [siteId: string]: boolean } = {};
      allSites.forEach((site: any, index: number) => {
        inputStatusMap[site.id] = results[index]?.data?.length > 0;
      });
      return inputStatusMap;
    },
    enabled: !!sites?.data?.sites,
  });

  // 등록 Mutation
  const createMutation = useMutation({
    mutationFn: createMealCount,
    onSuccess: () => {
      message.success('등록되었습니다');
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['meal-counts', selectedSiteId, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] });
    },
    onError: (error: any) => {
      message.error(error.message || '등록에 실패했습니다');
    },
  });

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { count?: number; note?: string } }) =>
      updateMealCount(id, data),
    onSuccess: () => {
      message.success('수정되었습니다');
      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['meal-counts', selectedSiteId, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] });
    },
    onError: (error: any) => {
      message.error(error.message || '수정에 실패했습니다');
    },
  });

  // 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealCount,
    onSuccess: () => {
      message.success('삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['meal-counts', selectedSiteId, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] });
    },
    onError: (error: any) => {
      message.error(error.message || '삭제에 실패했습니다');
    },
  });

  const handleAdd = () => {
    if (!selectedSiteId) {
      message.warning('사업장을 선택하세요');
      return;
    }
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(), // 기본값을 오늘로 설정
    });
    setModalVisible(true);
  };

  const handleEdit = (record: MealCount) => {
    setEditingRecord(record);
    form.setFieldsValue({
      mealType: record.mealType,
      count: record.count,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '삭제하시겠습니까?',
      content: '삭제된 데이터는 복구할 수 없습니다.',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 전체 취소 방지: count가 0이면 경고
      if (values.count === 0 || values.count === null || values.count === undefined) {
        Modal.confirm({
          title: '전체 취소 확인',
          content: '식수 인원이 0명입니다. 이 주문을 완전히 삭제하시겠습니까?',
          okText: '삭제',
          cancelText: '취소',
          okType: 'danger',
          onOk: () => {
            if (editingRecord) {
              // 기존 데이터가 있으면 삭제
              deleteMutation.mutate(editingRecord.id);
            } else {
              // 신규 등록인데 0명이면 저장하지 않음
              setModalVisible(false);
              form.resetFields();
              message.info('취소되었습니다');
            }
          },
        });
        return;
      }

      if (editingRecord) {
        // 수정
        updateMutation.mutate({
          id: editingRecord.id,
          data: {
            count: values.count,
            note: values.note,
          },
        });
      } else {
        // 등록
        createMutation.mutate({
          siteId: selectedSiteId!,
          date: values.date.format('YYYY-MM-DD'),
          mealType: values.mealType,
          count: values.count,
          note: values.note,
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getMealTypeLabel = (type: MealType) => {
    return MEAL_TYPES.find((m) => m.value === type)?.label || type;
  };

  // 메뉴명 가져오기
  const getMenuName = (mealType: MealType, menuNumber: number) => {
    if (!settingData?.data) {
      return menuNumber > 1 ? `메뉴${menuNumber}` : undefined;
    }

    const setting = settingData.data;
    let menuNames: (string | undefined)[] = [];

    switch (mealType) {
      case 'BREAKFAST':
        menuNames = [
          setting.breakfastMenu1Name,
          setting.breakfastMenu2Name,
          setting.breakfastMenu3Name,
          setting.breakfastMenu4Name,
          setting.breakfastMenu5Name,
        ];
        break;
      case 'LUNCH':
        menuNames = [
          setting.lunchMenu1Name,
          setting.lunchMenu2Name,
          setting.lunchMenu3Name,
          setting.lunchMenu4Name,
          setting.lunchMenu5Name,
        ];
        break;
      case 'DINNER':
        menuNames = [
          setting.dinnerMenu1Name,
          setting.dinnerMenu2Name,
          setting.dinnerMenu3Name,
          setting.dinnerMenu4Name,
          setting.dinnerMenu5Name,
        ];
        break;
      case 'SUPPER':
        menuNames = [
          setting.supperMenu1Name,
          setting.supperMenu2Name,
          setting.supperMenu3Name,
          setting.supperMenu4Name,
          setting.supperMenu5Name,
        ];
        break;
      default:
        return menuNumber > 1 ? `메뉴${menuNumber}` : undefined;
    }

    const menuName = menuNames[menuNumber - 1];
    return menuName || (menuNumber > 1 ? `메뉴${menuNumber}` : undefined);
  };

  // 날짜별로 데이터 그룹화 (메뉴별로 배열로 저장)
  const groupByDate = (data: MealCount[]) => {
    const grouped: { [date: string]: { [mealType: string]: MealCount[] } } = {};

    data.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = {};
      }
      if (!grouped[item.date][item.mealType]) {
        grouped[item.date][item.mealType] = [];
      }
      grouped[item.date][item.mealType].push(item);
    });

    return grouped;
  };

  // 날짜 범위 내 모든 날짜 생성
  const getAllDatesInRange = (startDate: Dayjs, endDate: Dayjs) => {
    const dates = [];
    let current = startDate.clone();

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    return dates;
  };

  const allDates = getAllDatesInRange(dateRange[0], dateRange[1]);
  const groupedData = mealCounts?.data ? groupByDate(mealCounts.data) : {};

  // 날짜별 합계 계산
  const getTotalForDate = (date: string) => {
    const dateData = groupedData[date];
    if (!dateData) return 0;

    return Object.values(dateData).reduce((sum, items) => {
      return sum + items.reduce((itemSum, item) => itemSum + item.count, 0);
    }, 0);
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const dateStr = `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`;

    if (isAllSites) {
      // 전체 사업장 엑셀 다운로드
      if (!allSitesMealCounts) {
        message.warning('다운로드할 데이터가 없습니다');
        return;
      }

      const excelData = allSitesTableData.map((row: any) => {
        const rowData: any = {
          '사업장': row.siteName,
          '지사': row.division,
          '유형': row.type,
        };

        // 각 식사 유형별 인원 추가
        MEAL_TYPES.forEach((mealType) => {
          const mealData = row.mealData[mealType.value];
          const total = mealData ? mealData.reduce((sum: number, item: MealCount) => sum + item.count, 0) : 0;
          rowData[mealType.label] = total || '-';
        });

        // 합계
        const total = Object.values(row.mealData).reduce((sum: number, mealArray: any) => {
          return sum + mealArray.reduce((mealSum: number, item: MealCount) => mealSum + item.count, 0);
        }, 0);
        rowData['합계'] = total;

        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '전체사업장');

      worksheet['!cols'] = [
        { wch: 25 }, // 사업장
        { wch: 10 }, // 지사
        { wch: 10 }, // 유형
        { wch: 12 }, // 조식
        { wch: 12 }, // 중식
        { wch: 12 }, // 석식
        { wch: 12 }, // 야식
        { wch: 12 }, // 합계
      ];

      XLSX.writeFile(workbook, `전체사업장_식수현황_${dateStr}.xlsx`);
      message.success('엑셀 파일이 다운로드되었습니다');
    } else {
      // 개별 사업장 엑셀 다운로드
      if (!mealCounts?.data || mealCounts.data.length === 0) {
        message.warning('다운로드할 데이터가 없습니다');
        return;
      }

      const siteName = sites?.data?.sites?.find((s: any) => s.id === selectedSiteId)?.name || '사업장';

      const excelData = mealCounts.data.map((record: MealCount) => ({
        '날짜': dayjs(record.date).format('YYYY-MM-DD'),
        '식사 유형': getMealTypeLabel(record.mealType),
        '메뉴명': getMenuName(record.mealType, record.menuNumber) || '-',
        '인원': record.count,
        '등록자': record.submitter?.name || '-',
        '등록시간': dayjs(record.submittedAt).format('YYYY-MM-DD HH:mm'),
        '상태': record.isLate ? '늦은 제출' : '정상',
        '비고': record.note || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '식수현황');

      worksheet['!cols'] = [
        { wch: 12 }, // 날짜
        { wch: 12 }, // 식사 유형
        { wch: 15 }, // 메뉴명
        { wch: 10 }, // 인원
        { wch: 12 }, // 등록자
        { wch: 18 }, // 등록시간
        { wch: 12 }, // 상태
        { wch: 30 }, // 비고
      ];

      XLSX.writeFile(workbook, `식수현황_${siteName}_${dateStr}.xlsx`);
      message.success('엑셀 파일이 다운로드되었습니다');
    }
  };

  // 요일 변환 함수
  const getDayOfWeek = (date: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayjs(date).day()];
  };

  // 날짜별 가로 테이블 컬럼
  const columns = [
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left' as const,
      render: (date: string) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(date).format('MM/DD')}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {getDayOfWeek(date)}
          </div>
        </div>
      ),
    },
    ...MEAL_TYPES.map((mealType) => ({
      title: mealType.label,
      key: mealType.value,
      width: 150,
      render: (_: any, record: any) => {
        const mealDataArray = record.mealData[mealType.value];
        if (!mealDataArray || mealDataArray.length === 0) {
          return <div style={{ color: '#999' }}>-</div>;
        }

        // 메뉴 번호 순으로 정렬
        const sortedData = [...mealDataArray].sort((a, b) => a.menuNumber - b.menuNumber);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedData.map((mealData) => {
              const menuName = getMenuName(mealType.value as MealType, mealData.menuNumber);
              return (
                <div
                  key={mealData.id}
                  style={{
                    padding: 8,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 4,
                    borderLeft: '3px solid #1890ff',
                  }}
                >
                  {menuName && (
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 2, fontWeight: 600 }}>
                      {menuName}
                    </div>
                  )}
                  <div style={{ fontWeight: 600, color: '#1890ff', marginBottom: 4 }}>
                    {mealData.count}명
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {mealData.submitter?.name || '-'}
                  </div>
                  <Space size={4} style={{ marginTop: 4 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(mealData)}
                      style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    />
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(mealData.id)}
                      style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    />
                  </Space>
                </div>
              );
            })}
          </div>
        );
      },
    })),
    {
      title: '합계',
      key: 'total',
      width: 80,
      render: (_: any, record: any) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 16 }}>
          {record.total}명
        </div>
      ),
    },
  ];

  // 테이블 데이터 구성
  const tableData = allDates.map((date) => ({
    key: date,
    date,
    mealData: groupedData[date] || {},
    total: getTotalForDate(date),
  }));

  // 전체 사업장용 테이블 컬럼
  const allSitesColumns = [
    {
      title: '사업장',
      dataIndex: 'siteName',
      key: 'siteName',
      width: 200,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#999' }}>
            {record.division} | {record.type}
          </div>
        </div>
      ),
    },
    ...MEAL_TYPES.map((mealType) => ({
      title: mealType.label,
      key: mealType.value,
      width: 120,
      render: (_: any, record: any) => {
        const mealData = record.mealData[mealType.value];
        if (!mealData || mealData.length === 0) {
          return <div style={{ color: '#ccc', textAlign: 'center' }}>-</div>;
        }

        const total = mealData.reduce((sum: number, item: MealCount) => sum + item.count, 0);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#1890ff', fontSize: 16 }}>
              {total}명
            </div>
            {mealData.length > 1 && (
              <div style={{ fontSize: 11, color: '#999' }}>
                ({mealData.length}개 메뉴)
              </div>
            )}
          </div>
        );
      },
    })),
    {
      title: '합계',
      key: 'total',
      width: 100,
      render: (_: any, record: any) => {
        const total = Object.values(record.mealData).reduce((sum: number, mealArray: any) => {
          return sum + mealArray.reduce((mealSum: number, item: MealCount) => mealSum + item.count, 0);
        }, 0);
        return (
          <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 16, textAlign: 'center' }}>
            {total}명
          </div>
        );
      },
    },
  ];

  // 전체 사업장용 테이블 데이터
  const allSitesTableData = filteredSites.map((site: any) => {
    const siteData = allSitesMealCounts?.[site.id] || [];

    // 조회 기간 내 데이터만 필터링
    const filteredData = siteData.filter((item: MealCount) => {
      const itemDate = dayjs(item.date);
      return itemDate.isSameOrAfter(dateRange[0], 'day') && itemDate.isSameOrBefore(dateRange[1], 'day');
    });

    // 식사 유형별로 그룹화
    const mealData: { [key: string]: MealCount[] } = {};
    MEAL_TYPES.forEach((type) => {
      mealData[type.value] = filteredData.filter((item: MealCount) => item.mealType === type.value);
    });

    return {
      key: site.id,
      siteId: site.id,
      siteName: site.name,
      division: site.division,
      type: site.type === 'CONSIGNMENT' ? '위탁' : site.type === 'DELIVERY' ? '운반' : site.type === 'LUNCHBOX' ? '도시락' : '행사',
      mealData,
    };
  });

  // 등록된 식사 유형 필터링
  const registeredTypes = mealCounts?.data?.map((mc: MealCount) => mc.mealType) || [];
  const availableMealTypes = MEAL_TYPES.filter(
    (type) => editingRecord || !registeredTypes.includes(type.value)
  );

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>식수 인원 관리</h1>

      {/* 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', flexWrap: 'wrap' }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>지사</div>
            <Select
              placeholder="전체"
              style={{ width: 120 }}
              value={filterDivision}
              onChange={setFilterDivision}
              options={[
                { label: '전체', value: 'ALL' },
                { label: 'HQ', value: 'HQ' },
                { label: '영남', value: '영남' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>유형</div>
            <Select
              placeholder="전체"
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
              options={[
                { label: '전체', value: 'ALL' },
                { label: '위탁', value: 'CONSIGNMENT' },
                { label: '운반', value: 'DELIVERY' },
                { label: '도시락', value: 'LUNCHBOX' },
                { label: '행사', value: 'EVENT' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>오늘 식수 통보</div>
            <Select
              placeholder="전체"
              style={{ width: 160 }}
              value={filterInputStatus}
              onChange={setFilterInputStatus}
              options={[
                { label: '전체', value: 'ALL' },
                { label: '✅ 통보 완료', value: 'COMPLETED' },
                { label: '⏳ 통보 대기', value: 'PENDING' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>사업장 ({filteredSites.length}개)</div>
            <Select
              placeholder="사업장을 선택하세요"
              style={{ width: 250 }}
              onChange={(value) => {
                if (value === 'ALL') {
                  setIsAllSites(true);
                  setSelectedSiteId(undefined);
                } else {
                  setIsAllSites(false);
                  setSelectedSiteId(value);
                }
              }}
              value={isAllSites ? 'ALL' : selectedSiteId}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { label: '📋 전체 사업장', value: 'ALL' },
                ...filteredSites.map((site: any) => {
                  const hasInput = todayAllMealCounts?.[site.id] || false;
                  return {
                    label: `${hasInput ? '✅' : '⏳'} ${site.name} (${site.division})`,
                    value: site.id,
                  };
                }),
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>조회 기간</div>
            <Space.Compact>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                format="YYYY-MM-DD"
                style={{ width: 280 }}
              />
              <Button
                onClick={() => setDateRange([dayjs(), dayjs()])}
              >
                오늘
              </Button>
            </Space.Compact>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!selectedSiteId || isAllSites}
            >
              식수 등록
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExcelDownload}
              disabled={isAllSites ? !allSitesMealCounts : (!selectedSiteId || !mealCounts?.data || mealCounts.data.length === 0)}
            >
              엑셀 다운로드
            </Button>
          </div>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card>
        {isAllSites ? (
          <Table
            columns={allSitesColumns}
            dataSource={allSitesTableData}
            rowKey="siteId"
            loading={isLoadingAll}
            locale={{ emptyText: '등록된 식수 정보가 없습니다' }}
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `총 ${total}개 사업장` }}
            scroll={{ x: 800 }}
            size="small"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="date"
            loading={isLoading}
            locale={{ emptyText: '등록된 식수 정보가 없습니다' }}
            pagination={{ pageSize: 31, showSizeChanger: false }}
            scroll={{ x: 800 }}
            size="small"
          />
        )}
      </Card>

      {/* 등록/수정 모달 */}
      <Modal
        title={editingRecord ? '식수 수정' : '식수 등록'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          {!editingRecord && (
            <>
              <Form.Item
                label="날짜"
                name="date"
                rules={[{ required: true, message: '날짜를 선택하세요' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="식사 유형"
                name="mealType"
                rules={[{ required: true, message: '식사 유형을 선택하세요' }]}
              >
                <Select
                  placeholder="선택하세요"
                  options={availableMealTypes}
                />
              </Form.Item>
            </>
          )}
          <Form.Item
            label="인원"
            name="count"
            rules={[
              { required: true, message: '인원을 입력하세요' },
              { type: 'number', min: 0, message: '0 이상의 값을 입력하세요' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              addonAfter="명"
              placeholder="예: 50"
            />
          </Form.Item>
          <Form.Item label="비고" name="note">
            <Input.TextArea rows={3} placeholder="특이사항을 입력하세요 (선택)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
