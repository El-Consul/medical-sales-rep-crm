import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapPage = () => {
  const [doctors, setDoctors] = useState([]);
  useEffect(() => { axios.get('/doctors').then(r => setDoctors(r.data)).catch(console.error); }, []);

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-800">
      <div className="max-w-md mx-auto px-4 pt-4">
        <h2 className="text-lg font-black mb-3 text-right">🗺️ خريطة الدكاتره</h2>
        <div className="bg-white rounded-2xl overflow-hidden border" style={{height: '60vh'}}>
          <MapContainer center={[30.0444,31.2357]} zoom={10} style={{height: '100%', width: '100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {doctors.filter(d => d.lat && d.lng).map(d => (
              <Marker key={d.id} position={[d.lat, d.lng]}>
                <Popup className="text-right">
                  <div className="font-bold">{d.name}</div>
                  <div className="text-xs text-slate-600">{d.specialty}</div>
                  <div className="text-[11px] mt-2">الأولويه: {d.priority}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
