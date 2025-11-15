"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MapboxMap from "./components/MapboxMap";

// Map 컴포넌트를 동적으로 로드 (SSR 방지)
const Map = dynamic(() => import("./Map"), { ssr: false });

interface GeoJsonFeature {
  type: string;
  properties: {
    sidonm?: string;
    sggnm?: string;
    adm_nm?: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

export default function Page() {
  const [geoJson, setGeoJson] = useState<GeoJsonData | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    // GeoJSON 데이터 로드
    fetch("/HangJeongDong_ver20250401.geojson")
      .then((res) => res.json())
      .then((data) => setGeoJson(data))
      .catch((err) => console.error("GeoJSON 로드 실패:", err));
  }, []);

  // Point-in-Polygon 역지오코딩 함수
  const findRegionByCoordinates = (lng: number, lat: number) => {
    if (!geoJson || !geoJson.features) {
      alert("GeoJSON 데이터가 아직 로드되지 않았습니다.");
      return null;
    }

    // GeoJSON의 모든 feature를 순회하며 좌표가 포함되는 지역 찾기
    for (const feature of geoJson.features) {
      if (isPointInFeature([lng, lat], feature)) {
        return {
          sidonm: feature.properties.sidonm || "정보 없음",
          sggnm: feature.properties.sggnm || "정보 없음",
          adm_nm: feature.properties.adm_nm || "정보 없음",
          feature: feature,
        };
      }
    }

    return null;
  };

  // Point-in-Polygon 알고리즘 (Ray Casting)
  const isPointInPolygon = (point: [number, number], polygon: any) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Feature(Polygon 또는 MultiPolygon)에 점이 포함되는지 확인
  const isPointInFeature = (point: [number, number], feature: any) => {
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
      // Polygon의 첫 번째 링(외곽선)에서 확인
      return isPointInPolygon(point, geometry.coordinates[0]);
    } else if (geometry.type === "MultiPolygon") {
      // MultiPolygon의 각 Polygon을 확인
      for (const polygon of geometry.coordinates) {
        if (isPointInPolygon(point, polygon[0])) {
          return true;
        }
      }
    }

    return false;
  };

  // 도로명 주소를 위도/경도로 변환 (Vworld Geocoding API)
  const geocodeAddress = async (addressQuery: string) => {
    setIsLoadingAddress(true);
    try {
      console.log("🔍 주소 검색 요청:", addressQuery);

      // Next.js API Route를 통해 서버에서 Geocoding 수행 (CORS 문제 해결)
      const encodedAddress = encodeURIComponent(addressQuery);
      const url = `/api/geocode?address=${encodedAddress}`;

      console.log("🌐 API URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 API 응답 데이터:", data);

      // API 응답 구조 확인
      if (data.response?.status === "OK") {
        // 결과가 있는지 확인
        if (data.response.result && data.response.result.point) {
          const lng = parseFloat(data.response.result.point.x);
          const lat = parseFloat(data.response.result.point.y);

          console.log("✅ 좌표 변환 성공:", { lat, lng });

          // 위도/경도 필드에 자동 입력
          setLongitude(lng.toString());
          setLatitude(lat.toString());

          // 바로 지역 검색 실행
          searchByCoordinates(lng, lat);
        } else {
          console.error("❌ 결과 없음:", data.response);
          alert(
            `주소를 찾을 수 없습니다.\n입력: ${addressQuery}\n\n확인사항:\n1. 정확한 도로명 주소를 입력하셨나요?\n2. 예: 경기도 구리시 체육관로 124`
          );
        }
      } else if (data.response?.status === "NOT_FOUND") {
        alert(
          `주소를 찾을 수 없습니다.\n입력: ${addressQuery}\n\nVworld API에서 해당 주소를 찾지 못했습니다.\n도로명 주소 형식을 확인해주세요.`
        );
      } else if (data.response?.status === "ERROR") {
        const errorMsg = data.response?.error?.text || "알 수 없는 오류";
        alert(`API 오류: ${errorMsg}\n\nAPI 키가 올바른지 확인해주세요.`);
      } else {
        console.error("❌ 예상치 못한 응답:", data);
        alert(
          `예상치 못한 응답입니다.\nAPI 응답 상태: ${data.response?.status || "UNKNOWN"}`
        );
      }
    } catch (error) {
      console.error("❌ Geocoding 오류:", error);

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        alert(
          "네트워크 오류가 발생했습니다.\n\n원인:\n1. CORS 정책 위반\n2. 인터넷 연결 문제\n3. API 서버 문제\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요."
        );
      } else {
        alert(`주소 검색 중 오류가 발생했습니다.\n\n오류: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 좌표로 지역 검색하는 공통 함수
  const searchByCoordinates = (lng: number, lat: number) => {
    // 한국 영역 범위 확인 (대략)
    if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
      alert("입력한 좌표가 대한민국 영역을 벗어났습니다.");
      return;
    }

    const region = findRegionByCoordinates(lng, lat);

    if (region) {
      setSelectedRegion(region);
      alert(
        `찾은 지역:\n광역시/도: ${region.sidonm}\n시군구: ${region.sggnm}\n읍면동: ${region.adm_nm}`
      );

      // MapboxMap으로 이벤트 전달
      window.dispatchEvent(
        new CustomEvent("highlightRegion", {
          detail: {
            coordinates: [lng, lat],
            region: region,
          },
        })
      );
    } else {
      alert("해당 좌표에서 지역을 찾을 수 없습니다.");
      setSelectedRegion(null);
    }
  };

  // 좌표 조회 버튼 클릭 핸들러
  const handleSearchByCoords = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert("올바른 위도와 경도를 입력해주세요.");
      return;
    }

    searchByCoordinates(lng, lat);
  };

  // 주소 조회 버튼 클릭 핸들러
  const handleSearchByAddress = () => {
    if (!address.trim()) {
      alert("도로명 주소를 입력해주세요.");
      return;
    }

    geocodeAddress(address);
  };

  return (
    <div className="min-h-screen bg-[#1e293b] text-white">
      {/* 상단 네비게이션 바 */}
      <header className="bg-[#0f172a] border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">기상청</span>
              </div>
              <h1 className="text-xl font-bold">기후변화 상황지도</h1>
            </div>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="#" className="text-blue-400 hover:text-blue-300">
              기후변화 상황정보
            </a>
            <a href="#" className="hover:text-gray-300">
              기후변화 지도서비스
            </a>
            <a href="#" className="hover:text-gray-300">
              종합기후변화지수정보
            </a>
            <a href="#" className="hover:text-gray-300">
              분석지원
            </a>
            <a href="#" className="hover:text-gray-300">
              열린마당
            </a>
          </nav>
        </div>
      </header>

      {/* 메인 대시보드 그리드 */}
      <main className="p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* 좌측 패널 - 차트 영역 */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* 미래 평균기온 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>📈</span> 미래 평균기온
              </h3>
              <div className="bg-[#1e293b] rounded h-48 flex items-center justify-center text-gray-500 text-xs">
                시계열 차트 영역
              </div>
              <div className="bg-[#1e293b] rounded h-32 mt-2 flex items-center justify-center text-gray-500 text-xs">
                히트맵 영역
              </div>
            </div>

            {/* 미래 강수량 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>🌧️</span> 미래 강수량
              </h3>
              <div className="bg-[#1e293b] rounded h-48 flex items-center justify-center text-gray-500 text-xs">
                바 차트 영역
              </div>
              <div className="bg-[#1e293b] rounded h-32 mt-2 flex items-center justify-center text-gray-500 text-xs">
                히트맵 영역
              </div>
            </div>
          </div>

          {/* 중앙 지도 영역 */}
          <div className="col-span-6 flex flex-col gap-4">
            {/* 검색 필터 영역 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700 space-y-3">
              {/* 좌표 입력 */}
              <div className="flex gap-3 items-center text-sm">
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 font-medium min-w-[50px]">
                    위도:
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="예: 37.5665"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5 w-32 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 font-medium min-w-[50px]">
                    경도:
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="예: 126.9780"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5 w-32 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchByCoords}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-1.5 rounded font-medium transition-colors"
                >
                  좌표 조회
                </button>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>

              {/* 도로명 주소 입력 */}
              <div className="flex gap-3 items-center text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-gray-300 font-medium min-w-[50px]">
                    주소:
                  </label>
                  <input
                    type="text"
                    placeholder="예: 서울특별시 중구 세종대로 110"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearchByAddress();
                      }
                    }}
                    className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5 flex-1 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchByAddress}
                  disabled={isLoadingAddress}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-1.5 rounded font-medium transition-colors min-w-[90px]"
                >
                  {isLoadingAddress ? "검색 중..." : "주소 조회"}
                </button>
              </div>

              {/* 검색 결과 표시 */}
              {selectedRegion && (
                <div className="text-xs bg-[#1e293b] border border-green-500 rounded px-4 py-2">
                  <span className="text-gray-400">검색 결과: </span>
                  <span className="text-green-400 font-bold">
                    {selectedRegion.sidonm}
                  </span>
                  {" > "}
                  <span className="text-blue-400">
                    {selectedRegion.sggnm}
                  </span>
                  {" > "}
                  <span className="text-gray-300">{selectedRegion.adm_nm}</span>
                </div>
              )}
            </div>

            {/* 지도 */}
            <div className="bg-[#0f172a] rounded-lg border border-gray-700 flex-1 overflow-hidden">
              {geoJson ? (
                <MapboxMap geoJson={geoJson} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  지도 로딩 중...
                </div>
              )}
            </div>

            {/* 하단 정보 카드 */}
            <div className="grid grid-cols-4 gap-3">
              {/* 일 최고기온 연최댓값 */}
              <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">
                  일 최고기온 연최댓값 (21세기 후반기)
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">☀️</div>
                  <div>
                    <div className="text-xs text-gray-400">SSP1-2.6</div>
                    <div className="text-2xl font-bold">36.9°C</div>
                    <div className="text-xs text-red-400">
                      현재대비 +5.2°C ↑
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">SSP5-8.5</div>
                  <div className="text-xl font-bold">41.7°C</div>
                  <div className="text-xs text-red-400">현재대비 +9.7°C ↑</div>
                </div>
              </div>

              {/* 일 최저기온 연최솟값 */}
              <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">
                  일 최저기온 연최솟값 (21세기 후반기)
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">❄️</div>
                  <div>
                    <div className="text-xs text-gray-400">SSP1-2.6</div>
                    <div className="text-2xl font-bold">-11.9°C</div>
                    <div className="text-xs text-blue-400">
                      현재대비 +1.9°C ↑
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">SSP5-8.5</div>
                  <div className="text-xl font-bold">-6.9°C</div>
                  <div className="text-xs text-blue-400">현재대비 +5.7°C ↑</div>
                </div>
              </div>

              {/* 1일 최다강수량 */}
              <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">
                  1일 최다강수량 (21세기 후반기)
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🌧️</div>
                  <div>
                    <div className="text-xs text-gray-400">SSP1-2.6</div>
                    <div className="text-2xl font-bold">151.3mm</div>
                    <div className="text-xs text-blue-400">
                      현재대비 +45.9mm ↑
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">SSP5-8.5</div>
                  <div className="text-xl font-bold">171.3mm</div>
                  <div className="text-xs text-blue-400">
                    현재대비 +65.9mm ↑
                  </div>
                </div>
              </div>

              {/* 계절길이 미래변화 */}
              <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">
                  계절길이 미래변화
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">봄</span>
                    <div className="flex gap-1">
                      <span className="bg-green-600 px-2 py-0.5 rounded">
                        +7일
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">여름</span>
                    <div className="flex gap-1">
                      <span className="bg-red-600 px-2 py-0.5 rounded">
                        +30일
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">가을</span>
                    <div className="flex gap-1">
                      <span className="bg-orange-600 px-2 py-0.5 rounded">
                        -15일
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">겨울</span>
                    <div className="flex gap-1">
                      <span className="bg-blue-600 px-2 py-0.5 rounded">
                        -22일
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 패널 - 통계 영역 */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* 고온 극한기후지수 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">고온 극한기후지수</h3>
              <div className="flex gap-2 text-xs mb-2">
                <button className="bg-red-600 px-2 py-1 rounded">
                  폭염일수
                </button>
                <button className="bg-[#1e293b] px-2 py-1 rounded hover:bg-gray-700">
                  열대야일수
                </button>
              </div>
              <div className="bg-[#1e293b] rounded h-64 flex items-center justify-center text-gray-500 text-xs">
                바이올린 차트 영역
              </div>
            </div>

            {/* 저온 극한기후지수 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">저온 극한기후지수</h3>
              <div className="flex gap-2 text-xs mb-2">
                <button className="bg-blue-600 px-2 py-1 rounded">
                  한파일수
                </button>
                <button className="bg-[#1e293b] px-2 py-1 rounded hover:bg-gray-700">
                  결빙일수
                </button>
              </div>
              <div className="bg-[#1e293b] rounded h-64 flex items-center justify-center text-gray-500 text-xs">
                바이올린 차트 영역
              </div>
            </div>

            {/* 계절길이 변화 추이 */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">계절길이 변화 추이</h3>
              <div className="flex gap-2 text-xs mb-2">
                <button className="bg-green-600 px-2 py-1 rounded text-xs">
                  봄
                </button>
                <button className="bg-red-600 px-2 py-1 rounded text-xs">
                  여름
                </button>
                <button className="bg-orange-600 px-2 py-1 rounded text-xs">
                  가을
                </button>
                <button className="bg-blue-600 px-2 py-1 rounded text-xs">
                  겨울
                </button>
              </div>
              <div className="bg-[#1e293b] rounded h-48 flex items-center justify-center text-gray-500 text-xs">
                시계열 차트 영역
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
