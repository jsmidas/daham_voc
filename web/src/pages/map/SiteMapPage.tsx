/**
 * Site Map Page
 * @description 사업장 지도 페이지 (카카오맵)
 */

import { useState, useEffect } from 'react';
import { Select, Card, Spin, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function SiteMapPage() {
  const [division, setDivision] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();

  // 사업장 목록 조회
  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', { division, type }],
    queryFn: () => getSites({ division, type }),
    retry: false,
  });

  // 카카오맵 초기화 및 마커 표시
  useEffect(() => {
    if (!sites?.data?.sites || sites.data.sites.length === 0) return;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');

        // 첫 번째 사업장 좌표를 중심으로 설정
        const firstSite = sites.data.sites[0];
        const options = {
          center: new window.kakao.maps.LatLng(firstSite.latitude, firstSite.longitude),
          level: 8, // 확대 레벨 (높을수록 넓은 지역)
        };

        const map = new window.kakao.maps.Map(container, options);

        // 모든 사업장에 마커 표시
        sites.data.sites.forEach((site: any) => {
          const markerPosition = new window.kakao.maps.LatLng(
            site.latitude,
            site.longitude
          );

          // 사업장 유형별 마커 이미지
          const markerImage = getMarkerImageBySiteType(site.type);

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            title: site.name,
            image: markerImage,
          });

          marker.setMap(map);

          // 마커 클릭 시 정보 팝업
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:15px;min-width:250px;font-family:sans-serif;">
                <h4 style="margin:0 0 8px 0;font-size:16px;font-weight:bold;">
                  ${site.name}
                </h4>
                <div style="margin-bottom:8px;">
                  <span style="display:inline-block;padding:2px 8px;background:#1890ff;color:white;border-radius:4px;font-size:12px;margin-right:4px;">
                    ${site.type}
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
            infowindow.open(map, marker);
          });

          // 마커에 호버 효과
          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            marker.setOpacity(0.7);
          });

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            marker.setOpacity(1);
          });
        });

        // 모든 마커가 보이도록 지도 범위 조정
        const bounds = new window.kakao.maps.LatLngBounds();
        sites.data.sites.forEach((site: any) => {
          bounds.extend(
            new window.kakao.maps.LatLng(site.latitude, site.longitude)
          );
        });
        map.setBounds(bounds);

        // 지도 확대/축소 제한 설정
        map.setMaxLevel(10);
        map.setMinLevel(1);
      });
    };

    document.head.appendChild(script);

    return () => {
      // 스크립트 중복 방지를 위한 정리
      const existingScript = document.querySelector(
        `script[src*="dapi.kakao.com"]`
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [sites]);

  // 사업장 유형별 마커 이미지 생성
  const getMarkerImageBySiteType = (type: string) => {
    const colors: Record<string, string> = {
      '위탁': '#ff4d4f',
      '운반급식': '#1890ff',
      '도시락': '#52c41a',
      '행사': '#faad14',
    };

    const color = colors[type] || '#000000';

    // 커스텀 마커 이미지 (SVG를 사용한 원형 마커)
    const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path fill="${color}" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
        <circle fill="white" cx="16" cy="16" r="6"/>
      </svg>
    `)}`;

    const imageSize = new window.kakao.maps.Size(32, 40);
    const imageOption = { offset: new window.kakao.maps.Point(16, 40) };

    return new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
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
                <Select.Option value="위탁">위탁</Select.Option>
                <Select.Option value="운반급식">운반급식</Select.Option>
                <Select.Option value="도시락">도시락</Select.Option>
                <Select.Option value="행사">행사</Select.Option>
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
          💡 <strong>사용 팁:</strong> 마커를 클릭하면 사업장 상세 정보를 확인할 수 있습니다.
          지도를 드래그하거나 마우스 휠로 확대/축소할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
