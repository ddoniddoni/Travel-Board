"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaceCandidate, TripPlan } from "../types";

type TripMapPreviewProps = {
  selectedPlaceId?: string;
  onSelectPlace: (placeId: string) => void;
  tripPlan: TripPlan | null;
};

type MapStop = {
  day: number;
  place: PlaceCandidate;
  startTime: string;
};

type MapInstance = {
  fitBounds: (bounds: BoundsInstance, padding?: number) => void;
  setCenter: (position: MapPosition) => void;
  setZoom: (zoom: number) => void;
};

type MarkerInstance = {
  map: MapInstance | null;
  addEventListener: (event: "gmp-click", handler: () => void) => void;
};

type PolylineInstance = {
  setMap: (map: MapInstance | null) => void;
};

type BoundsInstance = {
  extend: (position: MapPosition) => void;
};

type MapPosition = { lat: number; lng: number };

type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
    LatLngBounds: new () => BoundsInstance;
    Polyline: new (options: {
      map: MapInstance;
      path: MapPosition[];
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
    }) => PolylineInstance;
    marker: {
      AdvancedMarkerElement: new (options: {
        map: MapInstance;
        position: MapPosition;
        title: string;
        content: HTMLElement;
        gmpClickable: boolean;
        zIndex: number;
      }) => MarkerInstance;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let googleMapsLoader: Promise<GoogleMapsApi> | null = null;

export function TripMapPreview({
  selectedPlaceId,
  onSelectPlace,
  tripPlan,
}: TripMapPreviewProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const routeLineRef = useRef<PolylineInstance | null>(null);
  const [mapError, setMapError] = useState("");
  const stops = useMemo(() => getMapStops(tripPlan), [tripPlan]);
  const selectedStop = stops.find((stop) => stop.place.id === selectedPlaceId) ?? stops[0];
  const hasSelectedPlace = selectedStop?.place.id === selectedPlaceId;

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement || stops.length === 0) return;

    let isCurrent = true;
    loadGoogleMaps()
      .then((google) => {
        if (!isCurrent) return;

        const initialPosition = selectedStop?.place.coordinates ?? stops[0].place.coordinates;
        if (!initialPosition) return;

        const map = new google.maps.Map(mapElement, {
          center: initialPosition,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
        });
        mapRef.current = map;
        renderMarkers(google, map, stops, selectedPlaceId, onSelectPlace, markersRef);
        routeLineRef.current = renderRouteLine(google, map, stops);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setMapError(error instanceof Error ? error.message : "지도를 불러오지 못했습니다.");
      });

    return () => {
      isCurrent = false;
      clearMarkers(markersRef);
      routeLineRef.current?.setMap(null);
      routeLineRef.current = null;
      mapRef.current = null;
    };
  }, [onSelectPlace, selectedPlaceId, selectedStop?.place.coordinates, stops]);

  return (
    <section className="panel p-5" id="trip-map-preview">
      <p className="text-sm font-bold text-[var(--accent)]">Google 지도</p>
      <h2 className="mt-1 text-2xl font-bold">일정 동선</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        마커 번호와 선은 방문 순서예요. 실제 도로 경로와 이동 시간은 아직 반영하지 않습니다.
      </p>

      {selectedStop ? (
        <>
          <div
            className="mt-4 h-80 overflow-hidden rounded-lg border border-[var(--line)] xl:h-[min(42vh,380px)]"
            ref={mapElementRef}
          />
          {mapError ? (
            <p className="mt-3 text-sm font-semibold text-[var(--rose)]">{mapError}</p>
          ) : null}
          <div className="mt-4 rounded-lg bg-[var(--panel-muted)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold" title={selectedStop.place.name}>
                  {selectedStop.place.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Day {selectedStop.day} · {selectedStop.startTime} · {selectedStop.place.area}
                </p>
              </div>
              <span className="badge active shrink-0 whitespace-nowrap">
                {hasSelectedPlace ? "선택한 장소" : "첫 번째 일정"}
              </span>
            </div>
            {selectedStop.place.address ? (
              <p className="mt-2 text-sm text-slate-600">{selectedStop.place.address}</p>
            ) : null}
            <a
              aria-label={`${selectedStop.place.name}을(를) Google Maps에서 새 창으로 열기`}
              className="mt-3 inline-flex text-sm font-bold text-[var(--accent)]"
              href={getGoogleMapsUrl(selectedStop.place)}
              rel="noreferrer"
              target="_blank"
            >
              Google Maps에서 열기
            </a>
          </div>
        </>
      ) : (
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel-muted)] p-4 text-center text-sm font-bold text-slate-600">
          일정을 생성하면 실제 지도에 장소가 표시됩니다.
        </div>
      )}
    </section>
  );
}

function getMapStops(tripPlan: TripPlan | null): MapStop[] {
  if (!tripPlan) return [];

  const placesById = new Map(tripPlan.places.map((place) => [place.id, place]));
  const seenPlaceIds = new Set<string>();
  const stops: MapStop[] = [];

  for (const day of tripPlan.days) {
    for (const item of day.items) {
      if (!item.placeId || seenPlaceIds.has(item.placeId)) continue;
      const place = placesById.get(item.placeId);
      if (!place?.coordinates) continue;

      seenPlaceIds.add(item.placeId);
      stops.push({ day: day.day, place, startTime: item.startTime });
    }
  }

  return stops;
}

function renderMarkers(
  google: GoogleMapsApi,
  map: MapInstance,
  stops: MapStop[],
  selectedPlaceId: string | undefined,
  onSelectPlace: (placeId: string) => void,
  markersRef: { current: MarkerInstance[] },
) {
  clearMarkers(markersRef);
  const bounds = new google.maps.LatLngBounds();

  stops.forEach((stop, index) => {
    const position = stop.place.coordinates;
    if (!position) return;

    bounds.extend(position);
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title: stop.place.name,
      content: createMarkerContent(index + 1, stop.place.id === selectedPlaceId),
      gmpClickable: true,
      zIndex: stop.place.id === selectedPlaceId ? 2 : 1,
    });
    marker.addEventListener("gmp-click", () => onSelectPlace(stop.place.id));
    markersRef.current.push(marker);
  });

  if (stops.length === 1) {
    map.setCenter(stops[0].place.coordinates!);
    map.setZoom(15);
    return;
  }

  map.fitBounds(bounds, 36);
}

function clearMarkers(markersRef: { current: MarkerInstance[] }) {
  markersRef.current.forEach((marker) => {
    marker.map = null;
  });
  markersRef.current = [];
}

function renderRouteLine(
  google: GoogleMapsApi,
  map: MapInstance,
  stops: MapStop[],
) {
  const path = stops.flatMap((stop) => (stop.place.coordinates ? [stop.place.coordinates] : []));
  if (path.length < 2) return null;

  return new google.maps.Polyline({
    map,
    path,
    strokeColor: "#6366f1",
    strokeOpacity: 0.72,
    strokeWeight: 3,
  });
}

function createMarkerContent(index: number, isSelected: boolean) {
  const marker = document.createElement("div");
  marker.className = isSelected ? "trip-map-marker active" : "trip-map-marker";
  marker.textContent = String(index);
  return marker;
}

function getGoogleMapsUrl(place: PlaceCandidate) {
  const coordinates = place.coordinates;
  const query = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : place.address ?? place.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function loadGoogleMaps() {
  const loadedGoogleMaps = getLoadedGoogleMaps();
  if (loadedGoogleMaps) return Promise.resolve(loadedGoogleMaps);
  if (googleMapsLoader) return googleMapsLoader;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (!apiKey) return Promise.reject(new Error("브라우저용 Google Maps API 키가 없습니다."));

  googleMapsLoader = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=ko&region=KR&libraries=marker`;
    script.async = true;
    script.onload = () => {
      const googleMaps = getLoadedGoogleMaps();
      if (googleMaps) resolve(googleMaps);
      else reject(new Error("Google Maps API 초기화에 실패했습니다."));
    };
    script.onerror = () => reject(new Error("Google Maps 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  googleMapsLoader.catch(() => {
    googleMapsLoader = null;
  });

  return googleMapsLoader;
}

function getLoadedGoogleMaps() {
  return typeof window.google?.maps?.Map === "function" ? window.google : null;
}
