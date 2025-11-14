"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Mapbox 액세스 토큰 설정
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// 데이터센터 위치 정보 (여러 개 가능)
const DATA_CENTERS = [
  {
    id: 1,
    name: "대전 데이터센터",
    address: "대전광역시 유성구 엑스포로 325 (34124)",
    coordinates: [127.3845, 36.3736] as [number, number], // [lng, lat]
    region: "대전광역시",
  },
  {
    id: 2,
    name: "수내 오피스",
    address: "경기도 성남시 분당구 수내로 39 지웰 푸르지오 5층 SK AX (13594)",
    coordinates: [127.1054, 37.386] as [number, number], // [lng, lat]
    region: "경기도",
  },
];

interface MapboxMapProps {
  geoJson: any;
}

export default function MapboxMap({ geoJson }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 지도 초기화 (자연 친화적 디자인)
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12", // 자연 친화적 아웃도어 스타일
      center: [127.2, 36.8], // 대전과 수내 중간 지점
      zoom: 10, // 줌 레벨을 높여서 데이터센터가 보이도록
      pitch: 0, // 초기에는 2D
      bearing: 0,
      antialias: true, // 3D 건물을 위한 안티앨리어싱
    });

    const mapInstance = map.current;

    // 지도 로드 완료 후
    mapInstance.on("load", () => {
      setIsLoaded(true);

      // GeoJSON 레이어 추가 (한국 행정구역)
      if (geoJson) {
        mapInstance.addSource("korea-regions", {
          type: "geojson",
          data: geoJson,
        });

        // 행정구역 채우기 (투명하게, 호버 시에만 보이도록)
        mapInstance.addLayer({
          id: "korea-regions-fill",
          type: "fill",
          source: "korea-regions",
          paint: {
            "fill-color": "#10b981", // 녹색
            "fill-opacity": 0, // 기본적으로 투명
          },
        });

        // 행정구역 경계선 (자연 친화적 녹색)
        mapInstance.addLayer({
          id: "korea-regions-line",
          type: "line",
          source: "korea-regions",
          paint: {
            "line-color": "#059669", // 에메랄드 그린 경계선
            "line-width": 2,
            "line-opacity": 0.7,
          },
        });

        // 호버 효과 - 마우스 올리면 해당 지역 하이라이트
        mapInstance.on("mousemove", "korea-regions-fill", (e) => {
          if (e.features && e.features.length > 0) {
            mapInstance.getCanvas().style.cursor = "pointer";
            mapInstance.setPaintProperty(
              "korea-regions-fill",
              "fill-opacity",
              0.3
            );
          }
        });

        mapInstance.on("mouseleave", "korea-regions-fill", () => {
          mapInstance.getCanvas().style.cursor = "";
          mapInstance.setPaintProperty("korea-regions-fill", "fill-opacity", 0);
        });

        // 클릭 이벤트 - 해당 지역으로 줌인
        mapInstance.on("click", "korea-regions-fill", (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;

            // 해당 지역의 데이터센터 개수 확인
            const regionDataCenters = DATA_CENTERS.filter(
              (dc) => dc.region === props?.sidonm
            );

            // 클릭한 영역의 중심으로 줌인
            const bounds = new mapboxgl.LngLatBounds();
            if (feature.geometry.type === "Polygon") {
              feature.geometry.coordinates[0].forEach((coord: any) => {
                bounds.extend(coord as [number, number]);
              });
            } else if (feature.geometry.type === "MultiPolygon") {
              feature.geometry.coordinates.forEach((polygon: any) => {
                polygon[0].forEach((coord: any) => {
                  bounds.extend(coord as [number, number]);
                });
              });
            }

            mapInstance.fitBounds(bounds, {
              padding: 50,
              maxZoom: 12,
              duration: 1500,
            });

            // 팝업 표시
            if (regionDataCenters.length > 0) {
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div style="font-family: sans-serif; padding: 12px; background: white; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #059669;">🌿 ${
                      props?.sidonm || "정보 없음"
                    }</h3>
                    <div style="font-size: 12px; color: #334155;">
                      <p style="margin: 4px 0;">📡 <strong>데이터센터:</strong> ${
                        regionDataCenters.length
                      }개</p>
                      <p style="margin: 8px 0 4px 0; font-size: 11px; color: #64748b;">줌인하여 데이터센터를 확인하세요</p>
                    </div>
                  </div>`
                )
                .addTo(mapInstance);
            }
          }
        });
      }

      // 3D 건물 레이어 추가
      const layers = mapInstance.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
      )?.id;

      mapInstance.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );

      // 데이터센터 마커 생성 (한 번만 실행)
      DATA_CENTERS.forEach((dataCenter) => {
        // 기본 Mapbox 마커 사용 (녹색)
        const marker = new mapboxgl.Marker({
          color: "#10b981", // 녹색
        })
          .setLngLat(dataCenter.coordinates)
          .addTo(mapInstance);

        // 팝업 생성 (마커에 직접 연결하지 않음)
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false, // 클릭해도 자동으로 닫히지 않도록
        }).setHTML(
          `<div style="font-family: sans-serif; padding: 12px; min-width: 220px; background: white; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #059669;">🌿 ${dataCenter.name}</h3>
            <div style="font-size: 13px; line-height: 1.6; color: #334155;">
              <p style="margin: 4px 0;"><strong>주소:</strong><br/>${dataCenter.address}</p>
              <div style="margin-top: 12px; padding: 10px; background-color: #d1fae5; border-radius: 6px; border-left: 3px solid #10b981;">
                <p style="margin: 0; font-size: 12px; color: #065f46;">💡 <strong>마커를 더블클릭하면 3D 건물 뷰로 전환됩니다!</strong></p>
              </div>
            </div>
          </div>`
        );

        // 마커 클릭 이벤트 - 팝업 토글
        marker.getElement().addEventListener("click", (e) => {
          e.stopPropagation();

          if (popup.isOpen()) {
            popup.remove();
          } else {
            popup.setLngLat(dataCenter.coordinates).addTo(mapInstance);
          }
        });

        // 마커 더블클릭 이벤트 - 3D 뷰로 전환
        marker.getElement().addEventListener("dblclick", (e) => {
          e.stopPropagation();
          console.log(`${dataCenter.name} 마커 더블클릭됨!`);

          // 팝업 닫기
          popup.remove();

          // 3D 뷰로 전환
          mapInstance.flyTo({
            center: dataCenter.coordinates,
            zoom: 18,
            pitch: 60,
            bearing: -20,
            duration: 3000,
            essential: true,
          });

          // 건물 색상 강조
          setTimeout(() => {
            mapInstance.setPaintProperty(
              "3d-buildings",
              "fill-extrusion-color",
              "#10b981"
            );
          }, 3000);
        });

        markersRef.current.push(marker);
      });

      // 사이드바에서 데이터센터 클릭 시 이동하는 이벤트 리스너
      const handleFlyToDataCenter = (event: any) => {
        const { coordinates } = event.detail;
        mapInstance.flyTo({
          center: coordinates,
          zoom: 16, // 줌 레벨을 높여서 핀과 건물이 명확하게 보이도록
          pitch: 0,
          bearing: 0,
          duration: 2000,
        });
      };

      // 좌표로 지역 검색 시 하이라이트 이벤트 리스너
      const handleHighlightRegion = (event: any) => {
        const { coordinates, region } = event.detail;

        // 기존 하이라이트 제거
        if (mapInstance.getLayer("highlighted-region-fill")) {
          mapInstance.removeLayer("highlighted-region-fill");
        }
        if (mapInstance.getLayer("highlighted-region-line")) {
          mapInstance.removeLayer("highlighted-region-line");
        }
        if (mapInstance.getSource("highlighted-region")) {
          mapInstance.removeSource("highlighted-region");
        }

        // 새 하이라이트 레이어 추가
        if (region && region.feature) {
          mapInstance.addSource("highlighted-region", {
            type: "geojson",
            data: region.feature,
          });

          // 채우기 레이어
          mapInstance.addLayer({
            id: "highlighted-region-fill",
            type: "fill",
            source: "highlighted-region",
            paint: {
              "fill-color": "#3b82f6", // 파란색
              "fill-opacity": 0.3,
            },
          });

          // 경계선 레이어
          mapInstance.addLayer({
            id: "highlighted-region-line",
            type: "line",
            source: "highlighted-region",
            paint: {
              "line-color": "#2563eb", // 진한 파란색
              "line-width": 3,
            },
          });

          // 해당 지역으로 줌인
          const bounds = new mapboxgl.LngLatBounds();
          const geometry = region.feature.geometry;

          if (geometry.type === "Polygon") {
            geometry.coordinates[0].forEach((coord: any) => {
              bounds.extend(coord as [number, number]);
            });
          } else if (geometry.type === "MultiPolygon") {
            geometry.coordinates.forEach((polygon: any) => {
              polygon[0].forEach((coord: any) => {
                bounds.extend(coord as [number, number]);
              });
            });
          }

          mapInstance.fitBounds(bounds, {
            padding: 100,
            maxZoom: 14,
            duration: 2000,
          });

          // 마커 추가
          new mapboxgl.Marker({ color: "#ef4444" }) // 빨간색 마커
            .setLngLat(coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div style="font-family: sans-serif; padding: 12px; background: white; border-radius: 8px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #2563eb;">📍 검색 위치</h3>
                  <div style="font-size: 12px; color: #334155;">
                    <p style="margin: 4px 0;"><strong>광역시/도:</strong> ${region.sidonm}</p>
                    <p style="margin: 4px 0;"><strong>시군구:</strong> ${region.sggnm}</p>
                    <p style="margin: 4px 0;"><strong>읍면동:</strong> ${region.adm_nm}</p>
                    <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">
                      좌표: ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
                    </p>
                  </div>
                </div>`
              )
            )
            .addTo(mapInstance)
            .togglePopup(); // 자동으로 팝업 열기
        }
      };

      window.addEventListener("flyToDataCenter", handleFlyToDataCenter);
      window.addEventListener("highlightRegion", handleHighlightRegion);

      // 클린업 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener("flyToDataCenter", handleFlyToDataCenter);
        window.removeEventListener("highlightRegion", handleHighlightRegion);
      };
    });

    // 네비게이션 컨트롤 추가
    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

    // 클린업
    return () => {
      // 마커 제거
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // 지도 제거
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [geoJson]);

  return (
    <>
      <style jsx global>{`
        .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          background: white;
          color: #1e293b;
          padding: 0;
        }

        .mapboxgl-popup-close-button {
          color: #64748b;
          font-size: 20px;
          padding: 8px;
        }

        .mapboxgl-popup-close-button:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .mapboxgl-popup-tip {
          border-top-color: white !important;
          border-bottom-color: white !important;
        }
      `}</style>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
