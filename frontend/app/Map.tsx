"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// CSS 스타일 추가 (타일 렌더링 최적화)
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .leaflet-tile-container {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: pixelated;
    }
    .leaflet-tile {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .map-tiles {
      filter: contrast(1.1) brightness(1.05);
    }
    .leaflet-fade-anim .leaflet-tile {
      will-change: opacity;
    }
    .leaflet-zoom-anim .leaflet-zoom-animated {
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
}

// 마커 아이콘 설정 (필수)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// 색상 팔레트 - 시도별 색상
const regionColors: Record<string, string> = {
  서울특별시: "#e41a1c",
  부산광역시: "#377eb8",
  대구광역시: "#4daf4a",
  인천광역시: "#984ea3",
  광주광역시: "#ff7f00",
  대전광역시: "#ffff33",
  울산광역시: "#a65628",
  세종특별자치시: "#f781bf",
  경기도: "#999999",
  강원특별자치도: "#66c2a5",
  충청북도: "#fc8d62",
  충청남도: "#8da0cb",
  전북특별자치도: "#e78ac3",
  전라남도: "#a6d854",
  경상북도: "#ffd92f",
  경상남도: "#e5c494",
  제주특별자치도: "#b3b3b3",
};

const getColorBySido = (sidonm: string): string => {
  return regionColors[sidonm] || "#cccccc";
};

// 지도 범위 자동 조정 컴포넌트
function FitBounds({ geoJson }: { geoJson: any }) {
  const map = useMap();

  useEffect(() => {
    if (geoJson) {
      const geoJsonLayer = L.geoJSON(geoJson);
      const bounds = geoJsonLayer.getBounds();
      map.fitBounds(bounds);
    }
  }, [geoJson, map]);

  return null;
}

interface MapProps {
  geoJson: any;
}

export default function Map({ geoJson }: MapProps) {
  const center: [number, number] = [36.5, 127.5]; // 한국 중심

  // GeoJSON 스타일 설정
  const style = (feature: any) => {
    const sidonm = feature?.properties?.sidonm || "";
    return {
      fillColor: getColorBySido(sidonm),
      weight: 1,
      opacity: 1,
      color: "#666",
      fillOpacity: 0.6,
    };
  };

  // 각 feature에 이벤트 추가
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const popupContent = `
      <div style="font-family: sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
          ${props.adm_nm || "정보 없음"}
        </h3>
        <div style="font-size: 12px;">
          <p style="margin: 4px 0;"><strong>시도:</strong> ${
            props.sidonm || "-"
          }</p>
          <p style="margin: 4px 0;"><strong>시군구:</strong> ${
            props.sggnm || "-"
          }</p>
          <p style="margin: 4px 0;"><strong>행정동코드:</strong> ${
            props.adm_cd || "-"
          }</p>
        </div>
      </div>
    `;

    layer.bindPopup(popupContent);

    // 마우스 오버 효과 및 클릭 이벤트
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "#333",
          fillOpacity: 0.8,
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1,
          color: "#666",
          fillOpacity: 0.6,
        });
      },
      click: (e: any) => {
        const clickedLayer = e.target;
        const map = clickedLayer._map;

        // 클릭한 영역의 경계로 부드럽게 줌인
        const bounds = clickedLayer.getBounds();

        // 애니메이션 시작 전 타일 미리 로드
        map.once("movestart", () => {
          map.eachLayer((layer: any) => {
            if (layer._url) {
              layer.redraw();
            }
          });
        });

        map.flyToBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13, // 줌 레벨을 더 낮춰서 타일 로딩 부담 감소
          duration: 0.8, // 더 빠른 애니메이션
          easeLinearity: 0.15, // 더욱 부드러운 곡선
        });

        // 애니메이션 완료 후 팝업 열기
        setTimeout(() => {
          clickedLayer.openPopup();
        }, 800);
      },
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      preferCanvas={true}
      zoomControl={true}
      doubleClickZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
        maxZoom={22}
        minZoom={6}
        keepBuffer={8}
        maxNativeZoom={22}
        updateWhenZooming={false}
        updateWhenIdle={true}
        tileSize={512}
        zoomOffset={-1}
        detectRetina={true}
        crossOrigin={true}
        errorTileUrl=""
        className="map-tiles"
      />
      {geoJson && (
        <>
          <GeoJSON data={geoJson} style={style} onEachFeature={onEachFeature} />
          <FitBounds geoJson={geoJson} />
        </>
      )}
    </MapContainer>
  );
}
