/**
 * Geofencing 유틸리티
 * @description GPS 좌표 기반 거리 계산 및 지오펜싱 검증
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * 두 GPS 좌표 간의 거리 계산 (Haversine 공식)
 * @param coord1 첫 번째 좌표
 * @param coord2 두 번째 좌표
 * @returns 거리 (미터 단위)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // 미터 단위

  return distance;
}

/**
 * Geofencing 검증
 * @param userCoord 사용자 좌표
 * @param targetCoord 목표 좌표 (사업장 등)
 * @param radiusMeters 허용 반경 (미터)
 * @returns 반경 내에 있으면 true, 아니면 false
 */
export function checkGeofencing(
  userCoord: Coordinates,
  targetCoord: Coordinates,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistance(userCoord, targetCoord);
  return distance <= radiusMeters;
}

/**
 * GPS 좌표 유효성 검증
 * @param coord 검증할 좌표
 * @returns 유효하면 true, 아니면 false
 */
export function isValidCoordinates(coord: Coordinates): boolean {
  const { lat, lng } = coord;

  // 위도 범위: -90 ~ 90
  if (lat < -90 || lat > 90) {
    return false;
  }

  // 경도 범위: -180 ~ 180
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * GPS 좌표와 거리 정보 반환
 * @param userCoord 사용자 좌표
 * @param targetCoord 목표 좌표
 * @param radiusMeters 허용 반경
 * @returns 거리와 유효성 정보
 */
export function getGeofencingInfo(
  userCoord: Coordinates,
  targetCoord: Coordinates,
  radiusMeters: number = 100
): {
  distance: number;
  isValid: boolean;
  message: string;
} {
  const distance = calculateDistance(userCoord, targetCoord);
  const isValid = distance <= radiusMeters;

  let message: string;
  if (isValid) {
    message = `위치가 확인되었습니다 (거리: ${Math.round(distance)}m)`;
  } else {
    message = `사업장과 거리가 너무 멉니다 (거리: ${Math.round(distance)}m, 허용: ${radiusMeters}m)`;
  }

  return {
    distance: Math.round(distance),
    isValid,
    message,
  };
}
