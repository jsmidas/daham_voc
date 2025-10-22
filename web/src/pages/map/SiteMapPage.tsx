/**
 * Site Map Page
 * @description 사업장 지도 페이지 (카카오맵)
 */

import { useState, useEffect } from 'react';
import { Select, Card, Spin, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';
import { getDeliveryRoutes } from '@/api/delivery-route.api';
import { createMarkerImage, type MarkerShape } from '@/utils/markerShapes';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function SiteMapPage() {
  const [division, setDivision] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [routeId, setRouteId] = useState<string | undefined>();

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

  // 배송 코스 목록 조회
  const { data: routesData } = useQuery({
    queryKey: ['delivery-routes', { division }],
    queryFn: () => getDeliveryRoutes({ division, isActive: true }),
    retry: false,
  });

  const routes = routesData?.data || [];

  // 사업장 목록 조회
  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['sites', { division, type }],
    queryFn: () => getSites({ division, type, limit: 1000 }),
    retry: false,
  });

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('=== SiteMapPage Debug ===');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('sites:', sites);
    console.log('sites?.data?.sites:', sites?.data?.sites);
  }, [isLoading, error, sites]);

  // 카카오맵 초기화 및 마커 표시
  useEffect(() => {
    console.log('=== Kakao Map Init Start ===');
    console.log('sites?.data?.sites:', sites?.data?.sites);

    if (!sites?.data?.sites || sites.data.sites.length === 0) {
      console.log('No sites data, skipping map init');
      return;
    }

    console.log('Sites count:', sites.data.sites.length);

    // 이미 스크립트가 로드되어 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');

    if (existingScript && window.kakao?.maps) {
      console.log('Kakao script already loaded, initializing map directly');
      initializeMap();
      return;
    }

    console.log('Loading Kakao script...');
    console.log('Kakao API Key:', import.meta.env.VITE_KAKAO_MAP_APP_KEY);

    const script = document.createElement('script');
    const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false`;

    console.log('Script URL:', scriptUrl);
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      console.log('Kakao script loaded successfully');
      window.kakao.maps.load(() => {
        console.log('Kakao maps API loaded, initializing map');
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
  }, [sites, routeId]);

  const initializeMap = () => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) return;

    try {
      console.log('initializeMap called');
      const container = document.getElementById('map');
      console.log('Map container:', container);

      if (!container) {
        console.error('Map container not found!');
        return;
      }

      // 대구시청을 중심으로 설정 (위도: 35.8714, 경도: 128.6014)
      console.log('Setting map center to Daegu City Hall');

      const options = {
        center: new window.kakao.maps.LatLng(35.8714, 128.6014),
        level: 8, // 확대 레벨 (약 2km 척도)
      };

      const map = new window.kakao.maps.Map(container, options);
      console.log('Map created:', map);

        // 현재 열려있는 InfoWindow와 타이머를 추적
        let currentInfoWindow: any = null;
        let closeTimer: ReturnType<typeof setTimeout> | null = null;

        // 필터링된 사업장 목록
        let filteredSites = sites.data.sites;
        if (routeId) {
          filteredSites = sites.data.sites.filter((site: any) =>
            site.routeStops?.some((stop: any) => stop.route.id === routeId)
          );
        }

        // 모든 사업장에 마커 표시
        filteredSites.forEach((site: any) => {
          const markerPosition = new window.kakao.maps.LatLng(
            site.latitude,
            site.longitude
          );

          // 마커 색상 우선순위: 배송코스 > 그룹 > 사업장 유형
          let markerColor: string;
          let markerShape: MarkerShape = 'CIRCLE';

          if (site.routeStops && site.routeStops.length > 0) {
            // 첫 번째 배송코스의 색상 사용
            markerColor = site.routeStops[0].route.color || '#1890ff';
          } else if (site.group) {
            // 그룹의 마커 색상/모양 사용
            markerShape = site.group.markerShape || 'CIRCLE';
            markerColor = site.group.markerColor || '#999999';
          } else {
            // 코스에 미등록된 사업장은 회색으로 표시
            markerColor = '#999999';
          }

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
          const routeInfo = site.routeStops && site.routeStops.length > 0
            ? site.routeStops.map((stop: any) => `
                <span style="display:inline-block;padding:2px 8px;background:${stop.route.color};color:white;border-radius:4px;font-size:12px;margin-right:4px;margin-bottom:4px;">
                  ${stop.route.code}
                </span>
              `).join('')
            : '<span style="font-size:12px;color:#999;">미등록</span>';

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
                <div style="margin-bottom:8px;">
                  <strong style="font-size:12px;color:#666;">배송코스:</strong><br/>
                  ${routeInfo}
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

        // 모든 마커가 보이도록 지도 범위 조정 (주석 처리 - 대구시청 중심 고정)
        // const bounds = new window.kakao.maps.LatLngBounds();
        // sites.data.sites.forEach((site: any) => {
        //   bounds.extend(
        //     new window.kakao.maps.LatLng(site.latitude, site.longitude)
        //   );
        // });
        // map.setBounds(bounds);

      // 지도 확대/축소 제한 설정
      map.setMaxLevel(10);
      map.setMinLevel(1);

      console.log('Map initialization complete!');
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
          <Space size="large" wrap>
            <div>
              <label style={{ marginRight: 8, fontWeight: 'bold' }}>부문:</label>
              <Select
                placeholder="전체"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => {
                  setDivision(value);
                  setRouteId(undefined); // 부문 변경 시 코스 필터 초기화
                }}
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

            <div>
              <label style={{ marginRight: 8, fontWeight: 'bold' }}>배송코스:</label>
              <Select
                placeholder="전체"
                style={{ width: 200 }}
                allowClear
                onChange={setRouteId}
                value={routeId}
              >
                {routes.map((route: any) => (
                  <Select.Option key={route.id} value={route.id}>
                    <Space>
                      <div style={{ width: 12, height: 12, backgroundColor: route.color, borderRadius: '50%' }} />
                      {route.code} - {route.name}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Space>

          <div>
            <span style={{ fontWeight: 'bold' }}>총 사업장: </span>
            <span style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
              {routeId
                ? sites?.data?.sites?.filter((site: any) =>
                    site.routeStops?.some((stop: any) => stop.route.id === routeId)
                  ).length || 0
                : sites?.data?.sites?.length || 0}개
            </span>
          </div>
        </div>

        {/* 범례 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ marginRight: 16, fontWeight: 'bold' }}>배송코스별 마커 색상:</span>
          <Space wrap>
            {routes.map((route: any) => (
              <Tag key={route.id} color={route.color}>
                {route.code} - {route.name}
              </Tag>
            ))}
            <Tag color="#999999">미등록</Tag>
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
          💡 <strong>사용 팁:</strong> 마커 색상은 배송코스별로 구분됩니다.
          특정 코스만 보려면 위의 배송코스 필터를 사용하세요.
          마커를 클릭하면 사업장 상세 정보를 확인할 수 있습니다 (2초 후 자동으로 닫힘).
        </p>
      </Card>
    </div>
  );
}
