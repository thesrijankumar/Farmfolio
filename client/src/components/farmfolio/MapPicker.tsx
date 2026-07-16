import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({
  lat,
  lon,
  setLat,
  setLon,
}: {
  lat: string;
  lon: string;
  setLat: (v: string) => void;
  setLon: (v: string) => void;
}) {
  const map = useMapEvents({
    click(e) {
      setLat(e.latlng.lat.toFixed(5));
      setLon(e.latlng.lng.toFixed(5));
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  useEffect(() => {
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      map.setView([latNum, lonNum], map.getZoom(), { animate: false });
    }
  }, [latNum, lonNum, map]);

  return Number.isFinite(latNum) && Number.isFinite(lonNum) ? (
    <Marker position={[latNum, lonNum]} />
  ) : null;
}

export default function MapPicker({
  lat,
  lon,
  setLat,
  setLon,
}: {
  lat: string;
  lon: string;
  setLat: (v: string) => void;
  setLon: (v: string) => void;
}) {
  const centerLat = parseFloat(lat) || 38.5;
  const centerLon = parseFloat(lon) || -122.2;

  return (
    <MapContainer
      center={[centerLat, centerLon]}
      zoom={4}
      className="h-full w-full z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      />
      <LocationMarker lat={lat} lon={lon} setLat={setLat} setLon={setLon} />
    </MapContainer>
  );
}
