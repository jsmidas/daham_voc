/**
 * Site Map Page
 * @description 사업장 지도 페이지 (카카오맵)
 */

import { useState, useEffect, useRef } from 'react';
import { Select, Card, Spin, Space, Tag, Input, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const searchOverlayRef = useRef<any>(null);
  const nearestSitesOverlaysRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    queryKey: ['sites', { division, type, limit: 1000 }],
    queryFn: () => getSites({ division, type, limit: 1000 }),
    retry: false,
  });

  // 디버깅: 사업장 데이터 확인
  useEffect(() => {
    if (sites?.data?.sites) {
      console.log('🔍 [SiteMapPage] Sites loaded:', sites.data.sites.length);
      console.log('🔍 [SiteMapPage] Total from API:', (sites as any).meta?.total);
      console.log('🔍 [SiteMapPage] First site:', sites.data.sites[0]);
    }
  }, [sites]);

  // 두 좌표 사이의 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

  // 주소 검색 함수
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      message.warning('검색할 주소를 입력해주세요.');
      return;
    }

    if (!window.kakao?.maps || !mapRef.current) {
      message.error('지도가 아직 로드되지 않았습니다.');
      return;
    }

    if (!sites?.data?.sites || sites.data.sites.length === 0) {
      message.error('사업장 데이터가 없습니다.');
      return;
    }

    setIsSearching(true);

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(searchAddress, (result: any, status: any) => {
        setIsSearching(false);

        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 기존 검색 마커 및 가까운 사업장 표시 제거
          if (searchMarkerRef.current) {
            searchMarkerRef.current.setMap(null);
          }
          if (searchOverlayRef.current) {
            searchOverlayRef.current.setMap(null);
          }
          nearestSitesOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
          nearestSitesOverlaysRef.current = [];

          // 모든 사업장과의 거리 계산
          const sitesWithDistance = sites.data.sites.map((site: any) => {
            const distance = Math.round(
              calculateDistance(result[0].y, result[0].x, site.latitude, site.longitude)
            );
            return { ...site, distance };
          });

          // 거리순 정렬 후 가장 가까운 3곳 선택
          const nearestSites = sitesWithDistance
            .sort((a: any, b: any) => a.distance - b.distance)
            .slice(0, 3);

          // 특별한 별 모양 마커 생성 (애니메이션 포함)
          const markerContent = `
            <div style="position: relative;">
              <div style="
                font-size: 40px;
                animation: pulse 1.5s ease-in-out infinite;
                transform-origin: center;
                filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
              ">⭐</div>
              <style>
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: scale(1.3);
                    opacity: 0.8;
                  }
                }
              </style>
            </div>
          `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: coords,
            content: markerContent,
            yAnchor: 1,
            zIndex: 999,
          });

          customOverlay.setMap(mapRef.current);
          searchOverlayRef.current = customOverlay;

          // 지도 중심을 검색 위치로 이동
          mapRef.current.setCenter(coords);
          mapRef.current.setLevel(5); // 적절한 줌 레벨

          // 가까운 사업장 정보 생성
          const nearestSitesInfo = nearestSites.map((site: any, index: number) => {
            const distanceKm = (site.distance / 1000).toFixed(2);
            const routeInfo = site.routeStops && site.routeStops.length > 0
              ? site.routeStops.map((stop: any) => stop.route.code).join(', ')
              : '미등록';

            return `
              <div style="
                margin-top: ${index === 0 ? '12px' : '8px'};
                padding: 8px;
                background: rgba(255,255,255,0.15);
                border-radius: 6px;
                border-left: 3px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'};
              ">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 16px; margin-right: 6px;">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span style="font-weight: bold; font-size: 13px;">
                    ${site.name}
                  </span>
                </div>
                <div style="font-size: 11px; opacity: 0.9; line-height: 1.4;">
                  📏 직선거리: <strong>${distanceKm}km</strong><br/>
                  🚚 배송코스: ${routeInfo}
                </div>
              </div>
            `;
          }).join('');

          // 정보창 표시
          const infoContent = `
            <div style="
              padding: 15px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              min-width: 280px;
              max-width: 350px;
              font-family: sans-serif;
            ">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                🔍 검색된 위치
              </div>
              <div style="font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
                ${result[0].address_name || result[0].road_address?.address_name || searchAddress}
              </div>
              <div style="
                border-top: 1px solid rgba(255,255,255,0.3);
                padding-top: 8px;
                margin-top: 8px;
              ">
                <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px;">
                  📍 가까운 사업장 TOP 3
                </div>
                ${nearestSitesInfo}
              </div>
            </div>
          `;

          const infoOverlay = new window.kakao.maps.CustomOverlay({
            position: coords,
            content: infoContent,
            yAnchor: 2.3,
            zIndex: 998,
          });

          infoOverlay.setMap(mapRef.current);
          searchMarkerRef.current = infoOverlay;

          // 가까운 사업장에 번호 표시
          nearestSites.forEach((site: any, index: number) => {
            const siteCoords = new window.kakao.maps.LatLng(site.latitude, site.longitude);
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            const color = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';

            const nearestMarkerContent = `
              <div style="
                position: relative;
                width: 36px;
                height: 36px;
                background: ${color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
                animation: bounce 2s ease-in-out infinite;
              ">
                ${medal}
              </div>
              <style>
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-5px); }
                }
              </style>
            `;

            const nearestOverlay = new window.kakao.maps.CustomOverlay({
              position: siteCoords,
              content: nearestMarkerContent,
              yAnchor: 1.5,
              zIndex: 997,
            });

            nearestOverlay.setMap(mapRef.current);
            nearestSitesOverlaysRef.current.push(nearestOverlay);
          });

          message.success(`주소를 찾았습니다! 가장 가까운 사업장: ${nearestSites[0].name} (${(nearestSites[0].distance / 1000).toFixed(2)}km)`);
        } else {
          message.error('주소를 찾을 수 없습니다. 다시 시도해주세요.');
        }
      });
    } catch (error) {
      console.error('Address search error:', error);
      setIsSearching(false);
      message.error('주소 검색 중 오류가 발생했습니다.');
    }
  };


  // 카카오맵 스크립트 로드 (한 번만 실행)
  useEffect(() => {
    // 이미 스크립트가 로드되어 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');

    if (existingScript || window.kakao?.maps) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false&libraries=services,drawing`;
    script.async = true;

    script.onload = () => {
      console.log('✅ Kakao Maps SDK loaded successfully');
    };

    script.onerror = (error) => {
      console.error('Failed to load Kakao script:', error);
      console.error('Please check:');
      console.error('1. Kakao Developers Console (https://developers.kakao.com)');
      console.error('2. Your app has a JavaScript API key (not REST API)');
      console.error('3. Web platform domain is registered (http://localhost:5173)');
    };

    document.head.appendChild(script);
  }, []); // 한 번만 실행

  // 카카오맵 초기화 및 마커 표시 (sites나 routeId가 변경될 때)
  useEffect(() => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) {
      return;
    }

    if (!window.kakao?.maps) {
      // 스크립트가 아직 로드되지 않았으면 대기
      const checkKakao = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(checkKakao);
          window.kakao.maps.load(() => {
            initializeMap();
          });
        }
      }, 100);

      return () => clearInterval(checkKakao);
    }

    window.kakao.maps.load(() => {
      initializeMap();
    });

    // Cleanup: 컴포넌트 언마운트 시 마커/오버레이 제거
    return () => {
      // 타이머 정리
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      // 모든 마커 제거
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // 모든 오버레이 제거
      overlaysRef.current.forEach((overlay) => {
        if (overlay && overlay.setMap) {
          overlay.setMap(null);
        }
      });
      overlaysRef.current = [];

      // 검색 관련 오버레이 제거
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null);
        searchMarkerRef.current = null;
      }
      if (searchOverlayRef.current) {
        searchOverlayRef.current.setMap(null);
        searchOverlayRef.current = null;
      }
      nearestSitesOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      nearestSitesOverlaysRef.current = [];
    };
  }, [sites, routeId]);

  const initializeMap = () => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) return;

    console.log('🗺️ Total sites loaded:', sites.data.sites.length);
    console.log('📊 Sites data:', sites.data);

    // 기존 마커와 오버레이 정리
    markersRef.current.forEach((marker) => marker?.setMap(null));
    overlaysRef.current.forEach((overlay) => overlay?.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    try {
      const container = document.getElementById('map');

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
      mapRef.current = map;

        // 현재 열려있는 InfoWindow를 추적
        let currentInfoWindow: any = null;

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

          // 부문에 따라 마커 모양 결정 (본사: 원형, 영남지사: 사각형)
          markerShape = site.division === 'YEONGNAM' ? 'SQUARE' : 'CIRCLE';

          if (site.routeStops && site.routeStops.length > 0) {
            // 첫 번째 배송코스의 색상 사용
            markerColor = site.routeStops[0].route.color || '#1890ff';
          } else if (site.group) {
            // 그룹의 마커 색상 사용 (모양은 부문으로 결정되므로 제외)
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
          markersRef.current.push(marker); // 마커 ref에 저장

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
          overlaysRef.current.push(labelOverlay); // 오버레이 ref에 저장

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
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
            }

            // 이전에 열린 InfoWindow가 있으면 닫기
            if (currentInfoWindow) {
              currentInfoWindow.close();
            }

            // 새 InfoWindow 열기
            infowindow.open(map, marker);
            currentInfoWindow = infowindow;

            // 2초 후 자동으로 닫기
            closeTimerRef.current = setTimeout(() => {
              infowindow.close();
              currentInfoWindow = null;
              closeTimerRef.current = null;
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
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // 사업장 유형별 기본 색상 (그룹이 없는 경우)
  // const getDefaultColorBySiteType = (type: string) => {
  //   const colors: Record<string, string> = {
  //     'CONSIGNMENT': '#ff4d4f',
  //     'DELIVERY': '#1890ff',
  //     'LUNCHBOX': '#52c41a',
  //     'EVENT': '#faad14',
  //   };
  //   return colors[type] || '#1890ff';
  // };

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
          <div style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 16, fontWeight: 'bold' }}>부문별 마커 모양:</span>
            <Space wrap>
              <Tag color="blue">● 본사 (원형)</Tag>
              <Tag color="green">■ 영남지사 (사각형)</Tag>
            </Space>
          </div>
          <div>
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
        </div>

        {/* 주소 검색 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%', maxWidth: '600px' }}>
            <Input
              placeholder="신규 거래처 주소를 검색하세요 (예: 대구 중구 동성로2가 119)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onPressEnter={handleAddressSearch}
              prefix={<SearchOutlined />}
              size="large"
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={handleAddressSearch}
              loading={isSearching}
              icon={<SearchOutlined />}
            >
              검색
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            💡 신규 거래처의 주소를 검색하면 지도에 ⭐ 별 모양으로 표시되어 어느 배송코스에 넣을지 판단할 수 있습니다.
          </div>
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
