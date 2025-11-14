"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MapboxMap from "./components/MapboxMap";

// Map 컴포넌트를 동적으로 로드 (SSR 방지)
const Map = dynamic(() => import("./Map"), { ssr: false });

export default function Page() {
  const [geoJson, setGeoJson] = useState(null);

  useEffect(() => {
    // GeoJSON 데이터 로드
    fetch("/HangJeongDong_ver20250401.geojson")
      .then((res) => res.json())
      .then((data) => setGeoJson(data))
      .catch((err) => console.error("GeoJSON 로드 실패:", err));
  }, []);

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
            {/* 지역 선택 필터 */}
            <div className="bg-[#0f172a] rounded-lg p-3 border border-gray-700">
              <div className="flex gap-4 items-center text-sm">
                <select className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5">
                  <option>전국</option>
                  <option>서울특별시</option>
                  <option>경기도</option>
                </select>
                <select className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5">
                  <option>시군구</option>
                </select>
                <select className="bg-[#1e293b] border border-gray-600 rounded px-3 py-1.5">
                  <option>읍면동</option>
                </select>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded">
                  조회
                </button>
              </div>
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
