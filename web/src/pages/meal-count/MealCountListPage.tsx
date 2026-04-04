/**
 * Meal Count List Page
 * @description 식수 인원 조회 및 수정 페이지
 */

import { useState } from 'react';
import { Card, Select, DatePicker, Table, Button, Space, Modal, Form, InputNumber, Input, message } from 'antd';

const { RangePicker } = DatePicker;
import { EditOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getMealCountsByRange, getAllMealCountsByRange, getMealCountSetting, createMealCount, updateMealCount, deleteMealCount } from '@/api/meal-count.api';
import { getSiteMealMenus, getMealMenus } from '@/api/meal-menu.api';
import type { MealMenu } from '@/api/meal-menu.api';
import { useAuthStore } from '@/store/authStore';
import type { MealCount, MealType } from '@/api/meal-count.api';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const DIVISION_LABELS: Record<string, string> = {
  HQ: '본사',
  YEONGNAM: '영남지사',
  CONSIGNMENT: '위탁',
};

const getDivisionLabel = (div: string) => DIVISION_LABELS[div] || div;

const MEAL_TYPES = [
  { label: '조식', value: 'BREAKFAST' },
  { label: '중식', value: 'LUNCH' },
  { label: '석식', value: 'DINNER' },
  { label: '야식', value: 'SUPPER' },
];

export default function MealCountListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
  const [isAllSites, setIsAllSites] = useState(true); // 전체 사업장 조회 여부 (기본값: true)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // 전체 사업장 조회용 단일 날짜
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MealCount | null>(null);
  const [form] = Form.useForm();

  // 전체 수정 모달 관련 상태
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [bulkEditDate, setBulkEditDate] = useState<string>('');
  const [bulkEditMealType, setBulkEditMealType] = useState<MealType | null>(null);
  const [bulkEditSiteId, setBulkEditSiteId] = useState<string>('');
  const [menuInputs, setMenuInputs] = useState<{ [menuId: string]: { count: number | null; existingId?: string } }>({});

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

  // 전체 수정 모달용 사업장 메뉴 목록 조회
  const { data: bulkEditSiteMenusData } = useQuery({
    queryKey: ['site-meal-menus', bulkEditSiteId],
    queryFn: () => getSiteMealMenus(bulkEditSiteId),
    enabled: !!bulkEditSiteId && bulkEditModalVisible,
  });

  // 전체 메뉴 목록 조회 (사업장 메뉴가 없을 때 폴백)
  const { data: allMenusData } = useQuery({
    queryKey: ['all-meal-menus'],
    queryFn: () => getMealMenus(false),
    enabled: bulkEditModalVisible,
  });

  // 사용 가능한 메뉴 목록 계산
  const bulkEditMenus: MealMenu[] = (() => {
    const siteMenus = bulkEditSiteMenusData?.data || [];
    const allMenus = allMenusData?.data || [];
    return Array.isArray(siteMenus) && siteMenus.length > 0 ? siteMenus : (Array.isArray(allMenus) ? allMenus : []);
  })();

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

  // 전체 사업장 식수 데이터 조회 (단일 날짜)
  const { data: allSitesMealCounts, isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-sites-meal-counts', selectedDate.format('YYYY-MM-DD')],
    queryFn: async () => {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await getAllMealCountsByRange(dateStr, dateStr);
      return response.data || [];
    },
    enabled: isAllSites,
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
      queryClient.invalidateQueries({ queryKey: ['meal-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites-meal-counts'] });
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
      queryClient.invalidateQueries({ queryKey: ['meal-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites-meal-counts'] });
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

  // 전체 수정 모달 열기 (날짜/식사유형 기준으로 모든 메뉴 수정)
  const handleBulkEdit = (date: string, mealType: MealType, siteId: string, existingData: MealCount[]) => {
    setBulkEditDate(date);
    setBulkEditMealType(mealType);
    setBulkEditSiteId(siteId);

    // 기존 데이터를 menuInputs에 매핑
    const inputs: { [menuId: string]: { count: number | null; existingId?: string } } = {};
    existingData.forEach((item) => {
      if (item.mealMenuId) {
        inputs[item.mealMenuId] = { count: item.count, existingId: item.id };
      }
    });
    setMenuInputs(inputs);
    setBulkEditModalVisible(true);
  };

  // 전체 수정 저장
  const handleBulkSave = async () => {
    if (!bulkEditSiteId || !bulkEditMealType || !bulkEditDate) return;

    const promises: Promise<any>[] = [];

    for (const menu of bulkEditMenus) {
      const input = menuInputs[menu.id];
      const count = input?.count;
      const existingId = input?.existingId;

      if (existingId) {
        // 기존 데이터가 있는 경우
        if (count === null || count === undefined || count === 0) {
          // 0명이면 삭제
          promises.push(deleteMealCount(existingId));
        } else {
          // 수정
          promises.push(updateMealCount(existingId, { count }));
        }
      } else if (count !== null && count !== undefined && count > 0) {
        // 새로운 데이터 추가
        promises.push(createMealCount({
          siteId: bulkEditSiteId,
          date: bulkEditDate,
          mealType: bulkEditMealType,
          menuNumber: 1,
          mealMenuId: menu.id,
          count,
        }));
      }
    }

    try {
      await Promise.all(promises);
      message.success('저장되었습니다');
      setBulkEditModalVisible(false);
      setMenuInputs({});
      queryClient.invalidateQueries({ queryKey: ['meal-counts'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites-meal-counts'] });
    } catch (error: any) {
      message.error(error.message || '저장에 실패했습니다');
    }
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

  // 메뉴명 가져오기 (mealMenu가 있으면 우선 사용, 없으면 기존 setting 방식 사용)
  const getMenuName = (mealData: MealCount) => {
    // 새 방식: mealMenuId가 있으면 mealMenu 이름 사용
    if (mealData.mealMenu?.name) {
      return mealData.mealMenu.name;
    }

    // 기존 방식: menuNumber와 setting 사용
    const mealType = mealData.mealType;
    const menuNumber = mealData.menuNumber;

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
          '부문': getDivisionLabel(row.division),
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
        '메뉴명': getMenuName(record) || '-',
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
      render: (date: string) => {
        const dateObj = dayjs(date);
        const today = dayjs();
        const isFuture = dateObj.isAfter(today, 'day');
        const isToday = dateObj.isSame(today, 'day');

        return (
          <div>
            <div style={{
              fontWeight: 600,
              color: isFuture ? '#52c41a' : isToday ? '#1890ff' : '#000'
            }}>
              {dateObj.format('MM/DD')}
            </div>
            <div style={{
              fontSize: 12,
              color: isFuture ? '#52c41a' : '#999'
            }}>
              {getDayOfWeek(date)}
              {isFuture && ' (예정)'}
            </div>
          </div>
        );
      },
    },
    ...MEAL_TYPES.map((mealType) => ({
      title: mealType.label,
      key: mealType.value,
      width: 180,
      render: (_: any, record: any) => {
        const mealDataArray = record.mealData[mealType.value] || [];
        const dateObj = dayjs(record.date);
        const today = dayjs();
        const isFuture = dateObj.isAfter(today, 'day');
        const isPast = dateObj.isBefore(today, 'day');

        // 메뉴 번호 순으로 정렬
        const sortedData = [...mealDataArray].sort((a: MealCount, b: MealCount) => a.menuNumber - b.menuNumber);
        const total = sortedData.reduce((sum: number, item: MealCount) => sum + item.count, 0);

        return (
          <div
            style={{
              padding: 8,
              backgroundColor: mealDataArray.length > 0 ? (isFuture ? '#f6ffed' : '#f9f9f9') : '#fff',
              borderRadius: 4,
              borderLeft: mealDataArray.length > 0 ? `3px solid ${isFuture ? '#52c41a' : '#1890ff'}` : '3px solid #d9d9d9',
              minHeight: 60,
            }}
          >
            {sortedData.length > 0 ? (
              <>
                {sortedData.map((mealData: MealCount) => {
                  const menuName = getMenuName(mealData);
                  return (
                    <div key={mealData.id} style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>
                        {menuName || '기본'}:
                      </span>
                      <span style={{ fontWeight: 600, color: isFuture ? '#52c41a' : '#1890ff', marginLeft: 4 }}>
                        {mealData.count}명
                      </span>
                    </div>
                  );
                })}
                {sortedData.length > 1 && (
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333', borderTop: '1px solid #eee', paddingTop: 4, marginTop: 4 }}>
                    합계: {total}명
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#bbb', fontSize: 12, textAlign: 'center' }}>미등록</div>
            )}
            {/* 전체 수정 버튼 (슈퍼어드민이거나 과거가 아닌 경우) */}
            {(isSuperAdmin || !isPast) && selectedSiteId && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleBulkEdit(record.date, mealType.value as MealType, selectedSiteId, mealDataArray)}
                style={{ padding: 0, height: 'auto', fontSize: 11, marginTop: 4 }}
              >
                {mealDataArray.length > 0 ? '전체수정' : '등록'}
              </Button>
            )}
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

  // 테이블 데이터 구성 (최근 날짜가 위로)
  const tableData = allDates
    .map((date) => ({
      key: date,
      date,
      mealData: groupedData[date] || {},
      total: getTotalForDate(date),
    }))
    .reverse();

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
            {getDivisionLabel(record.division)} | {record.type}
          </div>
        </div>
      ),
    },
    ...MEAL_TYPES.map((mealType) => ({
      title: mealType.label,
      key: mealType.value,
      width: 180,
      render: (_: any, record: any) => {
        const mealDataArray = record.mealData[mealType.value] || [];

        // 메뉴 번호 순으로 정렬
        const sortedData = [...mealDataArray].sort((a: MealCount, b: MealCount) => a.menuNumber - b.menuNumber);
        const total = sortedData.reduce((sum: number, item: MealCount) => sum + item.count, 0);

        return (
          <div
            style={{
              padding: 6,
              backgroundColor: mealDataArray.length > 0 ? '#f9f9f9' : '#fff',
              borderRadius: 4,
              borderLeft: mealDataArray.length > 0 ? '3px solid #1890ff' : '3px solid #d9d9d9',
              minHeight: 50,
            }}
          >
            {sortedData.length > 0 ? (
              <>
                {sortedData.map((mealData: MealCount) => (
                  <div key={mealData.id} style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>
                      {mealData.mealMenu?.name || '기본'}:
                    </span>
                    <span style={{ fontWeight: 600, color: '#1890ff', marginLeft: 4 }}>
                      {mealData.count}명
                    </span>
                  </div>
                ))}
                {sortedData.length > 1 && (
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: '#333', borderTop: '1px solid #eee', paddingTop: 2, marginTop: 2 }}>
                    합계: {total}명
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#bbb', fontSize: 11, textAlign: 'center' }}>미등록</div>
            )}
            {/* 슈퍼어드민 전체 수정 버튼 */}
            {isSuperAdmin && record.siteId && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleBulkEdit(selectedDate.format('YYYY-MM-DD'), mealType.value as MealType, record.siteId, mealDataArray)}
                style={{ padding: 0, height: 'auto', fontSize: 10, marginTop: 4 }}
              >
                {mealDataArray.length > 0 ? '수정' : '등록'}
              </Button>
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

  // 전체 사업장용 테이블 데이터 (사업장별)
  const allSitesTableData = (() => {
    if (!allSitesMealCounts || !Array.isArray(allSitesMealCounts)) return [];

    // 사업장별로 그룹화
    const groupedData: { [siteId: string]: { site: any; mealData: { [key: string]: MealCount[] } } } = {};

    allSitesMealCounts.forEach((item: MealCount & { site: any }) => {
      const siteId = item.site?.id || item.siteId;

      if (!groupedData[siteId]) {
        groupedData[siteId] = {
          site: item.site,
          mealData: { BREAKFAST: [], LUNCH: [], DINNER: [], SUPPER: [] },
        };
      }

      if (groupedData[siteId].mealData[item.mealType]) {
        groupedData[siteId].mealData[item.mealType].push(item);
      }
    });

    // 필터링 적용 및 사업장명 순 정렬
    return Object.values(groupedData)
      .filter((row) => {
        const site = row.site;
        if (!site) return false;

        // 지사 필터
        if (filterDivision !== 'ALL' && site.division !== filterDivision) return false;
        // 유형 필터
        if (filterType !== 'ALL' && site.type !== filterType) return false;

        return true;
      })
      .map((row) => ({
        key: row.site?.id,
        siteId: row.site?.id,
        siteName: row.site?.name || '-',
        division: row.site?.division || '-',
        type: row.site?.type === 'CONSIGNMENT' ? '위탁' : row.site?.type === 'DELIVERY' ? '운반' : row.site?.type === 'LUNCHBOX' ? '도시락' : '행사',
        mealData: row.mealData,
      }))
      .sort((a, b) => a.siteName.localeCompare(b.siteName));
  })();

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
            <div style={{ marginBottom: 8, fontWeight: 500 }}>부문</div>
            <Select
              placeholder="전체"
              style={{ width: 120 }}
              value={filterDivision}
              onChange={setFilterDivision}
              options={[
                { label: '전체', value: 'ALL' },
                { label: '본사', value: 'HQ' },
                { label: '영남지사', value: 'YEONGNAM' },
                { label: '위탁', value: 'CONSIGNMENT' },
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
                    label: `${hasInput ? '✅' : '⏳'} ${site.name} (${getDivisionLabel(site.division)})`,
                    value: site.id,
                  };
                }),
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{isAllSites ? '조회 날짜' : '조회 기간'}</div>
            {isAllSites ? (
              <Space.Compact>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    if (date) setSelectedDate(date);
                  }}
                  format="YYYY-MM-DD"
                  style={{ width: 150 }}
                />
                <Button onClick={() => setSelectedDate(dayjs())}>오늘</Button>
                <Button onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}>◀</Button>
                <Button onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}>▶</Button>
              </Space.Compact>
            ) : (
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
                <Button onClick={() => setDateRange([dayjs(), dayjs()])}>오늘</Button>
              </Space.Compact>
            )}
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
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    // 슈퍼 어드민은 모든 날짜 선택 가능
                    if (isSuperAdmin) {
                      return false;
                    }
                    // 과거 날짜 비활성화
                    if (current && current.isBefore(dayjs(), 'day')) {
                      return true;
                    }
                    // 오늘로부터 7일 이후 날짜 비활성화
                    if (current && current.isAfter(dayjs().add(7, 'day'), 'day')) {
                      return true;
                    }
                    return false;
                  }}
                />
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

      {/* 전체 수정 모달 */}
      <Modal
        title={`${getMealTypeLabel(bulkEditMealType!)} 전체 수정 - ${dayjs(bulkEditDate).format('YYYY-MM-DD')}`}
        open={bulkEditModalVisible}
        onOk={handleBulkSave}
        onCancel={() => {
          setBulkEditModalVisible(false);
          setMenuInputs({});
        }}
        okText="저장"
        cancelText="취소"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', fontSize: 13 }}>
            각 메뉴별 수량을 입력하세요. 0명 또는 빈칸은 해당 메뉴가 삭제됩니다.
          </p>
        </div>
        {bulkEditMenus.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bulkEditMenus.map((menu) => (
              <div
                key={menu.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: menuInputs[menu.id]?.count ? '#f6ffed' : '#fafafa',
                  borderRadius: 8,
                  border: menuInputs[menu.id]?.existingId ? '1px solid #52c41a' : '1px solid #d9d9d9',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{menu.name}</div>
                  {menu.description && (
                    <div style={{ fontSize: 12, color: '#888' }}>{menu.description}</div>
                  )}
                  {menuInputs[menu.id]?.existingId && (
                    <div style={{ fontSize: 11, color: '#52c41a' }}>기존 등록됨</div>
                  )}
                </div>
                <InputNumber
                  style={{ width: 100 }}
                  min={0}
                  placeholder="인원"
                  addonAfter="명"
                  value={menuInputs[menu.id]?.count}
                  onChange={(value) => {
                    setMenuInputs((prev) => ({
                      ...prev,
                      [menu.id]: { ...prev[menu.id], count: value },
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            등록된 메뉴가 없습니다. 사업장에 메뉴를 먼저 할당해주세요.
          </div>
        )}
      </Modal>
    </div>
  );
}
