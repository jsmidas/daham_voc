/**
 * 개인정보처리방침 페이지
 */

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", sans-serif',
      lineHeight: '1.6'
    }}>
      <h1 style={{
        fontSize: '28px',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: '3px solid #4CAF50'
      }}>
        개인정보처리방침
      </h1>
      <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '30px' }}>
        최종 수정일: 2025년 1월 25일
      </p>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderLeft: '4px solid #ffc107',
        marginBottom: '20px'
      }}>
        <strong>다함푸드 VOC</strong>(이하 "회사")는 이용자의 개인정보를 중요시하며,
        「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다.
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        1. 수집하는 개인정보 항목
      </h2>
      <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>수집 항목</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>수집 목적</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>이름, 연락처, 이메일</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>회원 식별, 서비스 이용 안내</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>회원 탈퇴 시 즉시 삭제</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>위치 정보 (GPS)</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>배송 경로 추적, 사업장 위치 확인</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>서비스 이용 기간</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>사진 및 파일</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>배송 증빙, VOC 접수</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>서비스 이용 기간</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>기기 정보</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>서비스 제공, 보안 유지</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>서비스 이용 기간</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        2. 개인정보의 수집 및 이용 목적
      </h2>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li><strong>서비스 제공:</strong> 배송 관리, 사업장 정보 제공, VOC 접수 및 처리</li>
        <li><strong>위치 기반 서비스:</strong> 배송 경로 추적, 실시간 위치 확인, 사업장 탐색</li>
        <li><strong>업무 지원:</strong> 출퇴근 관리, 업무 보고, 통계 분석</li>
        <li><strong>고객 지원:</strong> 문의 응대, 불만 처리, 서비스 개선</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        3. 위치정보 수집 및 이용
      </h2>
      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>
        3.1 수집 목적
      </h3>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li>배송 경로 실시간 추적</li>
        <li>사업장 위치 확인 및 탐색</li>
        <li>배송 완료 증빙</li>
      </ul>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>
        3.2 수집 방법
      </h3>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li>앱 사용 중 GPS를 통한 실시간 수집</li>
        <li>백그라운드에서 배송 중에만 수집 (배송 시작/종료 시 자동 제어)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        4. 앱 권한 사용 안내
      </h2>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>권한</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>사용 목적</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>필수 여부</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>위치 (GPS)</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>배송 경로 추적, 사업장 위치 확인</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>필수</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>백그라운드 위치</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>배송 중 경로 추적</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>필수</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>카메라</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>배송 증빙 사진 촬영</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>필수</td>
          </tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>저장공간</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>사진 및 보고서 파일 저장</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>필수</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        5. 개인정보의 보유 및 이용 기간
      </h2>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li><strong>회원 정보:</strong> 회원 탈퇴 시 즉시 삭제</li>
        <li><strong>위치 정보:</strong> 서비스 이용 종료 시 즉시 삭제</li>
        <li><strong>VOC 기록:</strong> 처리 완료 후 3년 보관 (분쟁 해결 목적)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        6. 이용자의 권리와 행사 방법
      </h2>
      <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li>개인정보 열람 요구</li>
        <li>개인정보 정정 요구</li>
        <li>개인정보 삭제 요구</li>
        <li>개인정보 처리 정지 요구</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        7. 개인정보 보호책임자
      </h2>
      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderLeft: '4px solid #ffc107',
        marginBottom: '20px'
      }}>
        <strong>개인정보 보호책임자</strong><br />
        담당자: 다함푸드 개인정보보호팀<br />
        이메일: privacy@dahamvoc.co.kr
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>
        8. 개인정보 침해 관련 상담 및 신고
      </h2>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li>개인정보 침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
        <li>대검찰청 사이버범죄수사단: (국번없이) 1301 (www.spo.go.kr)</li>
        <li>경찰청 사이버안전국: (국번없이) 182 (cyberbureau.police.go.kr)</li>
      </ul>

      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #eee',
        color: '#7f8c8d',
        fontSize: '14px'
      }}>
        <p><strong>다함푸드 VOC</strong></p>
        <p>이 개인정보처리방침은 2025년 1월 25일부터 적용됩니다.</p>
      </div>
    </div>
  );
}
