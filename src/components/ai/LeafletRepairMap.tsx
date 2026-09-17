import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, latLngBounds, type Marker as LeafletMarker } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { RepairSearchLocation, RepairShop } from '../../services/repairShops';

function MapBoundsController({ location, shops }: { location: RepairSearchLocation; shops: RepairShop[] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (shops.length === 1) {
      map.setView([shops[0].lat, shops[0].lng], 16);
      return;
    }
    const points = shops.map((shop) => [shop.lat, shop.lng] as [number, number]);
    if (location.isCurrentLocation) points.push([location.latitude, location.longitude]);
    if (points.length > 1) map.fitBounds(latLngBounds(points), { padding: [30, 30], maxZoom: 16 });
    else map.setView([location.latitude, location.longitude], 14);
  }, [location, map, shops]);

  return null;
}

function SelectedShopController({ selectedShop, marker }: { selectedShop: RepairShop | undefined; marker: LeafletMarker | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedShop || !marker) return;
    map.flyTo([selectedShop.lat, selectedShop.lng], 16, { duration: 0.35 });
    marker.openPopup();
  }, [map, marker, selectedShop]);

  return null;
}

interface LeafletRepairMapProps {
  location: RepairSearchLocation;
  shops: RepairShop[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string) => void;
}

export function LeafletRepairMap({ location, shops, selectedShopId, onSelectShop }: LeafletRepairMapProps) {
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const [tileError, setTileError] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const selectedShop = shops.find((shop) => shop.id === selectedShopId);
  const selectedMarker = selectedShopId ? markerRefs.current.get(selectedShopId) : undefined;
  const currentLocationIcon = useMemo(() => divIcon({
    className: 'leaflet-repair-current-icon',
    html: '<div class="leaflet-repair-current-marker"><i></i><span>내 위치</span></div>',
    iconSize: [62, 28],
    iconAnchor: [31, 14],
  }), []);

  return (
    <div className="ai-chat-page__repair-map-wrap">
      <MapContainer key={mapAttempt} className="ai-chat-page__repair-map" center={[location.latitude, location.longitude]} zoom={14} scrollWheelZoom zoomControl>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }}
        />
        <MapBoundsController location={location} shops={shops} />
        <SelectedShopController selectedShop={selectedShop} marker={selectedMarker} />
        {location.isCurrentLocation && (
          <Marker position={[location.latitude, location.longitude]} icon={currentLocationIcon}>
            <Popup><div className="leaflet-repair-popup"><strong>내 위치</strong></div></Popup>
          </Marker>
        )}
        {shops.map((shop, index) => {
          const selected = shop.id === selectedShopId;
          const shopIcon = divIcon({
            className: 'leaflet-repair-shop-icon',
            html: `<div class="leaflet-repair-marker${selected ? ' is-selected' : ''}"><span>${index + 1}</span></div>`,
            iconSize: [34, 40], iconAnchor: [17, 40], popupAnchor: [0, -34],
          });
          return (
            <Marker
              key={shop.id}
              position={[shop.lat, shop.lng]}
              icon={shopIcon}
              ref={(marker) => {
                if (marker) markerRefs.current.set(shop.id, marker);
                else markerRefs.current.delete(shop.id);
              }}
              eventHandlers={{ click: () => onSelectShop(shop.id) }}
            >
              <Popup>
                <div className="leaflet-repair-popup">
                  <strong>{shop.name}</strong>
                  <small>{shop.category}</small>
                  <span>{shop.roadAddress || shop.address}</span>
                  <span>{shop.phone}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {tileError && (
        <div className="ai-chat-page__repair-map-error" role="status">
          <strong>지도를 불러오지 못했어요.</strong>
          <span>업체 목록은 아래에서 계속 확인할 수 있어요.</span>
          <button type="button" onClick={() => { setTileError(false); setMapAttempt((attempt) => attempt + 1); }}>다시 시도</button>
        </div>
      )}
    </div>
  );
}

export default LeafletRepairMap;
