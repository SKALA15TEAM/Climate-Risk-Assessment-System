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

## 3. 환경변수 설정

`.env` 파일에 다음 API 키들을 설정해주세요:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_api_key
```

### API 키 발급 방법

#### Mapbox Token (필수)
1. [Mapbox 회원가입](https://account.mapbox.com/auth/signup/)
2. Dashboard에서 Access Token 복사
3. `.env` 파일의 `NEXT_PUBLIC_MAPBOX_TOKEN`에 입력

#### Vworld API Key (도로명 주소 검색 기능 사용 시 필수)
1. [브이월드 포털](https://www.vworld.kr) 회원가입
2. 오픈API > API 신청 > 지오코딩 API 신청
3. 발급받은 키를 `.env` 파일의 `NEXT_PUBLIC_VWORLD_API_KEY`에 입력

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

---

## 주요 기능

### 1. 위도/경도 직접 입력
- 정확한 위도와 경도 좌표를 입력하여 해당 지역 검색
- 자동으로 광역시/도, 시군구, 읍면동 매칭
- 지도에서 해당 지역 하이라이트 및 줌인

### 2. 도로명 주소 검색
- 도로명 주소를 입력하면 자동으로 위도/경도 변환 (Vworld Geocoding API 사용)
- 변환된 좌표로 지역 자동 검색
- 엔터키로 빠른 검색 가능

### 3. 인터랙티브 지도
- **Mapbox GL** 기반 3D 지도
- 한국 행정구역 GeoJSON 시각화
- 지역 클릭 시 줌인 및 상세정보 팝업
- 데이터센터 위치 마커 표시

### 4. Point-in-Polygon 역지오코딩
- Ray Casting 알고리즘으로 좌표가 속한 행정구역 자동 탐색
- Polygon 및 MultiPolygon 지원

---

## 사용 예시

### 좌표 검색 예시
| 위치 | 위도 | 경도 |
|------|------|------|
| 서울 시청 | 37.5665 | 126.9780 |
| 부산 해운대 | 35.1585 | 129.1603 |
| 제주 한라산 | 33.3617 | 126.5292 |

### 주소 검색 예시
- `서울특별시 중구 세종대로 110` (서울시청)
- `부산광역시 해운대구 중동` (해운대)
- `제주특별자치도 제주시 1100로` (한라산)

---

#### 환경변수 설정

`.env` 파일에 다음 토큰들이 설정되어 있어야 합니다:
