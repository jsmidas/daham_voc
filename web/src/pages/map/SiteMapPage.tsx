/**
 * Site Map Page
 * @description 사업장 지도 페이지 (카카오맵)
 */

import { useState, useEffect } from 'react';
import { Select, Card, Spin, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { createMarkerImage, type MarkerShape } from '@/utils/markerShapes';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function SiteMapPage() {
  const [division, setDivision] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();

  // 사업장 유형 한국어 변환
  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'CONSIGNMENT': '위탁',
      'DELIVERY': '운반급식',
      'LUNCHBOX': '도시락',
      'EVENT': '행사',
    };
    return typeLabels[type] || type;
  };

  // 사업장 목록 조회 (limit을 1000으로 설정하여 모든 사업장 표시)
  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['sites', { division, type }],
    queryFn: () => getSites({ division, type, limit: 1000 }),
    retry: false,
  });


  // 카카오맵 초기화 및 마커 표시
  useEffect(() => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) {
      return;
    }

    // 이미 스크립트가 로드되어 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');

    if (existingScript && window.kakao?.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    script.onerror = (error) => {
      console.error('Failed to load Kakao script:', error);
      console.error('Please check:');
      console.error('1. Kakao Developers Console (https://developers.kakao.com)');
      console.error('2. Your app has a JavaScript API key (not REST API)');
      console.error('3. Web platform domain is registered (http://localhost:5173)');
    };

    document.head.appendChild(script);
  }, [sites]);

  const initializeMap = () => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) return;

    try {
      const container = document.getElementById('map');

      if (!container) {
        console.error('Map container not found!');
        return;
      }

      // 대구 중심 좌표 (35.8714, 128.6014)
      // level 8 = 2km 척도
      const options = {
        center: new window.kakao.maps.LatLng(35.8714, 128.6014),
        level: 8, // 확대 레벨 (8 = 2km 척도)
      };

      const map = new window.kakao.maps.Map(container, options);

        // 현재 열려있는 InfoWindow와 타이머를 추적
        let currentInfoWindow: any = null;
        let closeTimer: ReturnType<typeof setTimeout> | null = null;

        // 모든 사업장에 마커 표시
        sites.data.sites.forEach((site: any) => {

          const markerPosition = new window.kakao.maps.LatLng(
            site.latitude,
            site.longitude
          );

          // 그룹이 있으면 그룹의 마커 모양/색상 사용, 없으면 사업장 유형별 기본값 사용
          const markerShape: MarkerShape = site.group?.markerShape || 'CIRCLE';
          const markerColor = site.group?.markerColor || getDefaultColorBySiteType(site.type);
          const markerImage = createMarkerImage(markerShape, markerColor, window.kakao.maps);

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            title: site.name,
            image: markerImage,
          });

          marker.setMap(map);

          // 사업장 이름 라벨 추가 (CustomOverlay)
          const labelContent = `
            <div style="
              font-size: 11px;
              font-weight: 600;
              color: #333;
              white-space: nowrap;
              font-family: sans-serif;
              text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;
            ">
              ${site.name}
            </div>
          `;

          const labelOverlay = new window.kakao.maps.CustomOverlay({
            position: markerPosition,
            content: labelContent,
            yAnchor: 1.1, // 마커 바로 아래에 라벨 표시
            xAnchor: 0.5, // 중앙 정렬
          });

          labelOverlay.setMap(map);

          // 마커 클릭 시 정보 팝업
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:15px;min-width:250px;font-family:sans-serif;">
                <h4 style="margin:0 0 8px 0;font-size:16px;font-weight:bold;">
                  ${site.name}
                </h4>
                <div style="margin-bottom:8px;">
                  <span style="display:inline-block;padding:2px 8px;background:#1890ff;color:white;border-radius:4px;font-size:12px;margin-right:4px;">
                    ${getTypeLabel(site.type)}
                  </span>
                  <span style="display:inline-block;padding:2px 8px;background:#52c41a;color:white;border-radius:4px;font-size:12px;">
                    ${site.division === 'HQ' ? '본사' : '영남지사'}
                  </span>
                </div>
                <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">
                  📍 ${site.address}
                </p>
              </div>
            `,
          });

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            // 이전 타이머가 있으면 취소
            if (closeTimer) {
              clearTimeout(closeTimer);
            }

            // 이전에 열린 InfoWindow가 있으면 닫기
            if (currentInfoWindow) {
              currentInfoWindow.close();
            }

            // 새 InfoWindow 열기
            infowindow.open(map, marker);
            currentInfoWindow = infowindow;

            // 2초 후 자동으로 닫기
            closeTimer = setTimeout(() => {
              infowindow.close();
              currentInfoWindow = null;
            }, 2000);
          });

          // 마커에 호버 효과
          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            marker.setOpacity(0.7);
          });

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            marker.setOpacity(1);
          });
        });

      // 지도 확대/축소 제한 설정
      map.setMaxLevel(10);
      map.setMinLevel(1);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // 사업장 유형별 기본 색상 (그룹이 없는 경우)
  const getDefaultColorBySiteType = (type: string) => {
    const colors: Record<string, string> = {
      'CONSIGNMENT': '#ff4d4f',
      'DELIVERY': '#1890ff',
      'LUNCHBOX': '#52c41a',
      'EVENT': '#faad14',
    };
    return colors[type] || '#1890ff';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large">
          <div style={{ padding: '50px' }}>사업장 정보를 불러오는 중...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ margin: '24px' }}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: '#ff4d4f' }}>데이터를 불러오는 중 오류가 발생했습니다</h2>
          <p>{(error as any).message || '알 수 없는 오류'}</p>
        </div>
      </Card>
    );
  }

  if (!sites?.data?.sites || sites.data.sites.length === 0) {
    return (
      <div>
        <h1>사업장 지도</h1>
        <Card style={{ margin: '24px', textAlign: 'center', padding: '50px' }}>
          <h2>등록된 사업장이 없습니다</h2>
          <p>사업장을 먼저 등록해주세요.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* 제목 */}
      <h1>사업장 지도</h1>

      {/* 필터 및 통계 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="large">
            <div>
              <label style={{ marginRight: 8, fontWeight: 'bold' }}>부문:</label>
              <Select
                placeholder="전체"
                style={{ width: 150 }}
                allowClear
                onChange={setDivision}
                value={division}
              >
                <Select.Option value="HQ">본사</Select.Option>
                <Select.Option value="YEONGNAM">영남지사</Select.Option>
              </Select>
            </div>

            <div>
              <label style={{ marginRight: 8, fontWeight: 'bold' }}>유형:</label>
              <Select
                placeholder="전체"
                style={{ width: 150 }}
                allowClear
                onChange={setType}
                value={type}
              >
                <Select.Option value="CONSIGNMENT">위탁</Select.Option>
                <Select.Option value="DELIVERY">운반급식</Select.Option>
                <Select.Option value="LUNCHBOX">도시락</Select.Option>
                <Select.Option value="EVENT">행사</Select.Option>
              </Select>
            </div>
          </Space>

          <div>
            <span style={{ fontWeight: 'bold' }}>총 사업장: </span>
            <span style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
              {sites?.data?.sites?.length || 0}개
            </span>
          </div>
        </div>

        {/* 범례 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ marginRight: 16, fontWeight: 'bold' }}>마커 색상:</span>
          <Space>
            <Tag color="red">위탁</Tag>
            <Tag color="blue">운반급식</Tag>
            <Tag color="green">도시락</Tag>
            <Tag color="orange">행사</Tag>
          </Space>
        </div>
      </Card>

      {/* 지도 */}
      <Card>
        <div
          id="map"
          style={{
            width: '100%',
            height: '700px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </Card>

      {/* 안내 메시지 */}
      <Card style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <p style={{ margin: 0, color: '#52c41a' }}>
          💡 <strong>사용 팁:</strong> 마커를 클릭하면 사업장 상세 정보를 확인할 수 있습니다 (2초 후 자동으로 닫힘).
          지도를 드래그하거나 마우스 휠로 확대/축소할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
