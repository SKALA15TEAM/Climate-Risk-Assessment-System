"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Map 컴포넌트를 동적으로 import (SSR 비활성화)
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg">지도 로딩 중...</p>
    </div>
  ),
});

export default function Home() {
  const [geoJson, setGeoJson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GeoJSON 파일 로드
    fetch("/HangJeongDong_ver20250401.geojson")
      .then((response) => response.json())
      .then((data) => {
        setGeoJson(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("GeoJSON 로드 실패:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">지도 데이터 로딩 중...</p>
      </div>
    );
  }

  if (!geoJson) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-500">
          지도 데이터를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Map geoJson={geoJson} />
    </div>
  );
}
