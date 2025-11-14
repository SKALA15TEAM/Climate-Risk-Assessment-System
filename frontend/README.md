# 프로젝트 실행 가이드

## 1. 클론

```
git clone <repository-url>
cd <project-name>
```

## 2. 패키지 설치

```
npm install
```

## 3. 환경변수 설정 (필요시)

.env.example을 복사하여 .env.local 생성
cp .env.example .env.local

## 4. 개발 서버 실행

npm run dev

## 5. 브라우저 접속

http://localhost:3000

### 📍 Map 컴포넌트 구성

#### 사용 라이브러리

- **react-leaflet**: React용 Leaflet 지도 라이브러리
- **leaflet**: 오픈소스 인터랙티브 지도 라이브러리

#### 주요 기능

1. **한국 행정구역 시각화**: GeoJSON 데이터를 활용한 시도/시군구/행정동 표시
2. **시도별 색상 구분**: 17개 시도를 각각 다른 색상으로 표시
3. **인터랙티브 기능**:
   - 마우스 오버 시 영역 하이라이트
   - 클릭 시 해당 영역으로 줌인 및 상세정보 팝업
   - 스크롤 줌, 드래그 이동 지원

#### 데이터 구조

- **입력 데이터**: GeoJSON 형식
- **필수 속성**:
  - `sidonm`: 시도명 (예: "서울특별시")
  - `sggnm`: 시군구명
  - `adm_nm`: 행정동명
  - `adm_cd`: 행정동코드

#### 주요 컴포넌트

- `MapContainer`: 지도 컨테이너 (중심: 36.5°N, 127.5°E, 초기 줌: 7)
- `TileLayer`: Mapbox 타일 레이어 (streets-v12 스타일)
- `GeoJSON`: 행정구역 경계 렌더링
- `FitBounds`: 지도 범위 자동 조정

#### 환경변수 설정

`.env.local` 파일에 Mapbox 토큰 추가 필요:
