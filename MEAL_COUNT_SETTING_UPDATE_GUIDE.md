# 식수 마감시간 설정 페이지 업데이트 가이드

## 개요
사용자 요청사항:
1. 메뉴명을 추가/삭제할 수 있는 기능 추가
2. 사업장 타입(도시락/운반/위탁/이벤트) 표시

## 데이터베이스 확인

✅ 데이터베이스 스키마는 이미 준비되어 있습니다:
- `MealCountSetting` 모델에 `breakfastMenu1Name` ~ `breakfastMenu5Name` 등 메뉴명 필드 존재
- `Site` 모델에 `type` 필드 존재 (LUNCHBOX, DELIVERY, CONSIGNMENT, EVENT)
- API 타입 정의도 완료됨 (`meal-count.api.ts`)

## 구현해야 할 변경사항

### 1. 인터페이스 수정 (src/pages/meal-count/MealCountSettingPage.tsx)

**위치:** 16-21줄

**기존 코드:**
```typescript
interface SiteWithSetting {
  siteId: string;
  siteName: string;
  division: string;
  setting?: MealCountSetting;
}
```

**변경 후:**
```typescript
interface SiteWithSetting {
  siteId: string;
  siteName: string;
  siteType: string;  // 추가
  division: string;
  setting?: MealCountSetting;
}

// 상수 추가
const SITE_TYPE_LABELS: Record<string, string> = {
  LUNCHBOX: '도시락',
  DELIVERY: '운반',
  CONSIGNMENT: '위탁',
  EVENT: '이벤트',
};

const SITE_TYPE_COLORS: Record<string, string> = {
  LUNCHBOX: 'blue',
  DELIVERY: 'green',
  CONSIGNMENT: 'orange',
  EVENT: 'purple',
};
```

### 2. State 추가

**위치:** 23-29줄 (export default function 내부)

**추가할 코드:**
```typescript
// 메뉴 개수 상태 관리
const [breakfastCount, setBreakfastCount] = useState(1);
const [lunchCount, setLunchCount] = useState(1);
const [dinnerCount, setDinnerCount] = useState(1);
const [supperCount, setSupperCount] = useState(1);
```

### 3. allSitesList 수정

**위치:** 57-66줄

**기존 코드:**
```typescript
const allSitesList = useMemo<SiteWithSetting[]>(() => {
  if (!sites?.data?.sites) return [];
  return sites.data.sites.map((site: any) => ({
    siteId: site.id,
    siteName: site.name,
    division: site.division,
    setting: allSettings?.[site.id] || undefined,
  }));
}, [sites, allSettings]);
```

**변경 후:**
```typescript
const allSitesList = useMemo<SiteWithSetting[]>(() => {
  if (!sites?.data?.sites) return [];
  return sites.data.sites.map((site: any) => ({
    siteId: site.id,
    siteName: site.name,
    siteType: site.type,  // 추가
    division: site.division,
    setting: allSettings?.[site.id] || undefined,
  }));
}, [sites, allSettings]);
```

### 4. 테이블 컬럼에 타입 추가

**위치:** 198-293줄 (columns 배열)

**추가할 컬럼 (사업장 컬럼 다음에):**
```typescript
{
  title: '타입',
  key: 'type',
  width: 100,
  render: (_: any, record: SiteWithSetting) => (
    <Tag color={SITE_TYPE_COLORS[record.siteType]}>
      {SITE_TYPE_LABELS[record.siteType] || record.siteType}
    </Tag>
  ),
},
```

### 5. handleOpenModal 함수 수정

**위치:** 101-141줄

기존 코드에서 setting을 로드할 때 메뉴명도 같이 로드하도록 수정:

```typescript
if (setting) {
  // 메뉴 개수 상태 업데이트
  setBreakfastCount(setting.breakfastMenuCount || 1);
  setLunchCount(setting.lunchMenuCount || 1);
  setDinnerCount(setting.dinnerMenuCount || 1);
  setSupperCount(setting.supperMenuCount || 1);

  setTimeout(() => {
    const formValues: any = {
      breakfastDeadline: setting.breakfastDeadline ? dayjs(setting.breakfastDeadline, 'HH:mm') : undefined,
      lunchDeadline: setting.lunchDeadline ? dayjs(setting.lunchDeadline, 'HH:mm') : undefined,
      dinnerDeadline: setting.dinnerDeadline ? dayjs(setting.dinnerDeadline, 'HH:mm') : undefined,
      breakfastMenuCount: setting.breakfastMenuCount || 1,
      lunchMenuCount: setting.lunchMenuCount || 1,
      dinnerMenuCount: setting.dinnerMenuCount || 1,
      supperMenuCount: setting.supperMenuCount || 1,
      allowLateSubmission: setting.allowLateSubmission ?? false,
      isActive: setting.isActive ?? true,
    };

    // 메뉴명 필드 설정 (새로 추가)
    for (let i = 1; i <= 5; i++) {
      formValues[`breakfastMenu${i}Name`] = (setting as any)[`breakfastMenu${i}Name`] || '';
      formValues[`lunchMenu${i}Name`] = (setting as any)[`lunchMenu${i}Name`] || '';
      formValues[`dinnerMenu${i}Name`] = (setting as any)[`dinnerMenu${i}Name`] || '';
      formValues[`supperMenu${i}Name`] = (setting as any)[`supperMenu${i}Name`] || '';
    }

    form.setFieldsValue(formValues);
  }, 0);
}
```

### 6. handleSave 함수 수정

**위치:** 143-186줄

settingData 생성 후 메뉴명 추가:

```typescript
const settingData: Partial<MealCountSetting> = {
  // ... 기존 코드 ...
};

// 메뉴명 필드 추가 (새로 추가)
for (let i = 1; i <= 5; i++) {
  (settingData as any)[`breakfastMenu${i}Name`] = values[`breakfastMenu${i}Name`] || undefined;
  (settingData as any)[`lunchMenu${i}Name`] = values[`lunchMenu${i}Name`] || undefined;
  (settingData as any)[`dinnerMenu${i}Name`] = values[`dinnerMenu${i}Name`] || undefined;
  (settingData as any)[`supperMenu${i}Name`] = values[`supperMenu${i}Name`] || undefined;
}
```

### 7. 메뉴명 입력 필드 렌더링 함수 추가

**위치:** columns 정의 전 (295줄 전)

```typescript
// 메뉴명 입력 필드 렌더링
const renderMenuNameFields = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'supper', count: number) => {
  const fields = [];
  for (let i = 1; i <= count; i++) {
    fields.push(
      <Col span={12} key={i}>
        <Form.Item
          label={`메뉴 ${i}`}
          name={`${mealType}Menu${i}Name`}
        >
          <Input placeholder={`메뉴 ${i} 이름 (예: 백반, 돈까스 등)`} />
        </Form.Item>
      </Col>
    );
  }
  return fields;
};
```

### 8. Modal Form 내용 수정

**위치:** 448-472줄 (메뉴 개수 설정 Card)

**기존 "메뉴 개수" Card를 각 끼니별 Card로 분리:**

```tsx
{/* 조식 메뉴 설정 */}
<Card title="조식 메뉴 설정" size="small" style={{ marginBottom: 16 }}>
  <Row gutter={16}>
    <Col span={24}>
      <Form.Item label="메뉴 개수" name="breakfastMenuCount" rules={[{ required: true }]}>
        <Input
          type="number"
          min={1}
          max={5}
          suffix="개"
          onChange={(e) => setBreakfastCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
        />
      </Form.Item>
    </Col>
    {renderMenuNameFields('breakfast', breakfastCount)}
  </Row>
</Card>

{/* 중식 메뉴 설정 */}
<Card title="중식 메뉴 설정" size="small" style={{ marginBottom: 16 }}>
  <Row gutter={16}>
    <Col span={24}>
      <Form.Item label="메뉴 개수" name="lunchMenuCount" rules={[{ required: true }]}>
        <Input
          type="number"
          min={1}
          max={5}
          suffix="개"
          onChange={(e) => setLunchCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
        />
      </Form.Item>
    </Col>
    {renderMenuNameFields('lunch', lunchCount)}
  </Row>
</Card>

{/* 석식 메뉴 설정 */}
<Card title="석식 메뉴 설정" size="small" style={{ marginBottom: 16 }}>
  <Row gutter={16}>
    <Col span={24}>
      <Form.Item label="메뉴 개수" name="dinnerMenuCount" rules={[{ required: true }]}>
        <Input
          type="number"
          min={1}
          max={5}
          suffix="개"
          onChange={(e) => setDinnerCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
        />
      </Form.Item>
    </Col>
    {renderMenuNameFields('dinner', dinnerCount)}
  </Row>
</Card>

{/* 야식 메뉴 설정 */}
<Card title="야식 메뉴 설정" size="small" style={{ marginBottom: 16 }}>
  <Row gutter={16}>
    <Col span={24}>
      <Form.Item label="메뉴 개수" name="supperMenuCount" rules={[{ required: true }]}>
        <Input
          type="number"
          min={1}
          max={5}
          suffix="개"
          onChange={(e) => setSupperCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
        />
      </Form.Item>
    </Col>
    {renderMenuNameFields('supper', supperCount)}
  </Row>
</Card>
```

### 9. import 수정

**위치:** 6-7줄

useEffect는 필요없으니 제거하고, Divider 등 사용하지 않는 import도 제거:

```typescript
import { Button, Space, message, Modal, Form, Switch, TimePicker, Card, Tag, Input, Row, Col, Table, Alert } from 'antd';
import { CopyOutlined, EditOutlined } from '@ant-design/icons';
```

### 10. Modal width 수정

**위치:** 377줄

```typescript
width={900}  // 800에서 900으로 변경 (메뉴명 입력 필드가 추가되므로)
```

### 11. Table scroll 수정

**위치:** 357줄

```typescript
scroll={{ x: 1200 }}  // 1000에서 1200으로 변경 (타입 컬럼 추가)
```

### 12. Alert 안내 메시지 수정

**위치:** 305-317줄

```tsx
<Alert
  message="마감시간 설정 안내"
  description={
    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
      <li><strong>조식:</strong> 전날 저녁에 마감 (예: 전날 20:00)</li>
      <li><strong>중식/석식:</strong> 당일 마감 (예: 당일 10:00, 15:00)</li>
      <li><strong>메뉴명:</strong> 메뉴 개수를 설정하면 각 메뉴의 이름을 입력할 수 있습니다</li>  {/* 추가 */}
      <li><strong>일괄 적용:</strong> 사업장을 선택하고 "선택한 사업장에 설정 복제" 버튼을 클릭하세요</li>
    </ul>
  }
  type="info"
  showIcon
  style={{ marginBottom: 16 }}
/>
```

## 테스트 방법

1. 페이지 새로고침
2. 사업장 목록에 "타입" 컬럼이 표시되는지 확인
3. 사업장 편집 시 메뉴명 입력 필드가 메뉴 개수에 따라 동적으로 생성되는지 확인
4. 메뉴명 입력 후 저장이 정상적으로 되는지 확인
5. 설정 복제 기능이 정상 작동하는지 확인

## 참고사항

- 데이터베이스는 이미 준비되어 있음 (수정 불필요)
- API도 준비되어 있음 (수정 불필요)
- 프론트엔드 타입 정의도 준비되어 있음 (수정 불필요)
- **오직 MealCountSettingPage.tsx 파일만 수정하면 됨**
