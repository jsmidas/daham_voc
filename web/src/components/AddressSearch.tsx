/**
 * Address Search Component
 * @description Kakao 우편번호 서비스를 사용한 주소 검색 컴포넌트
 */

import { Button, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface AddressSearchProps {
  value?: string;
  onChange?: (address: string, coordinates?: { lat: number; lng: number }) => void;
}

// Kakao Postcode 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          roadAddress: string;
          jibunAddress: string;
          zonecode: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export default function AddressSearch({ value, onChange }: AddressSearchProps) {
  const handleSearch = () => {
    new window.daum.Postcode({
      oncomplete: async (data) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress;

        // 주소를 좌표로 변환 (Kakao REST API 사용)
        try {
          const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(fullAddress)}`,
            {
              headers: {
                Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_MAP_APP_KEY}`,
              },
            }
          );

          const result = await response.json();

          if (result.documents && result.documents.length > 0) {
            const { x, y } = result.documents[0];
            onChange?.(fullAddress, {
              lat: parseFloat(y),
              lng: parseFloat(x),
            });
          } else {
            // 좌표 변환 실패 시 주소만 설정
            onChange?.(fullAddress);
          }
        } catch (error) {
          console.error('주소 좌표 변환 실패:', error);
          // 에러 발생 시에도 주소는 설정
          onChange?.(fullAddress);
        }
      },
    }).open();
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={value}
        placeholder="주소 검색 버튼을 클릭하세요"
        readOnly
      />
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={handleSearch}
      >
        주소 검색
      </Button>
    </Space.Compact>
  );
}
