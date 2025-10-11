/**
 * Marker Shape Utilities
 * @description 지도 마커의 다양한 모양을 SVG로 생성
 */

export type MarkerShape =
  | 'CIRCLE'
  | 'SQUARE'
  | 'DIAMOND'
  | 'HEART'
  | 'SPADE'
  | 'CLUB'
  | 'STAR'
  | 'TRIANGLE';

/**
 * 마커 모양별 SVG path 생성
 */
const getShapePath = (shape: MarkerShape, color: string): string => {
  const strokeColor = '#ffffff';
  const strokeWidth = 2;

  switch (shape) {
    case 'CIRCLE':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <circle fill="${color}" cx="8" cy="8" r="7" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'SQUARE':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <rect fill="${color}" x="1" y="1" width="14" height="14" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'DIAMOND':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill="${color}" d="M8 1 L15 8 L8 15 L1 8 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'HEART':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill="${color}" d="M8 14.5 C8 14.5 2 10.5 2 6.5 C2 4.5 3.5 3 5.5 3 C6.5 3 7.5 3.5 8 4.5 C8.5 3.5 9.5 3 10.5 3 C12.5 3 14 4.5 14 6.5 C14 10.5 8 14.5 8 14.5 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'SPADE':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill="${color}" d="M8 2 C8 2 3 7 3 9.5 C3 11.5 4.5 13 6.5 13 C7.5 13 8 12.5 8 12.5 L8 14 L8 14 L8 12.5 C8 12.5 8.5 13 9.5 13 C11.5 13 13 11.5 13 9.5 C13 7 8 2 8 2 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'CLUB':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <circle fill="${color}" cx="8" cy="5" r="3" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle fill="${color}" cx="5" cy="9" r="3" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle fill="${color}" cx="11" cy="9" r="3" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <path fill="${color}" d="M8 11 L7 14 L9 14 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'STAR':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill="${color}" d="M8 2 L9.5 6.5 L14 7 L11 10.5 L12 15 L8 12.5 L4 15 L5 10.5 L2 7 L6.5 6.5 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    case 'TRIANGLE':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill="${color}" d="M8 2 L14 14 L2 14 Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;

    default:
      // Default to circle
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <circle fill="${color}" cx="8" cy="8" r="7" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </svg>
      `;
  }
};

/**
 * 카카오맵 마커 이미지 생성
 */
export const createMarkerImage = (
  shape: MarkerShape,
  color: string,
  kakaoMaps: any
) => {
  const svgString = getShapePath(shape, color);
  const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svgString
  )}`;

  const imageSize = new kakaoMaps.Size(16, 16);
  const imageOption = { offset: new kakaoMaps.Point(8, 8) };

  return new kakaoMaps.MarkerImage(imageSrc, imageSize, imageOption);
};

/**
 * 마커 모양 한글 라벨
 */
export const getMarkerShapeLabel = (shape: MarkerShape): string => {
  const labels: Record<MarkerShape, string> = {
    CIRCLE: '동그라미',
    SQUARE: '네모',
    DIAMOND: '다이아몬드',
    HEART: '하트',
    SPADE: '스페이드',
    CLUB: '클로버',
    STAR: '별',
    TRIANGLE: '삼각형',
  };
  return labels[shape] || '동그라미';
};
