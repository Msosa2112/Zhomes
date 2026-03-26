import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useProperties } from '../../../context/PropertyContext'
import { useTheme } from '../../../context/ThemeContext'
import { Bed, Bath, Expand } from 'lucide-react'
import MarkerClusterGroup from 'react-leaflet-cluster'
import './MapPageMobile.css'

// Clean price pill marker — same style for all, ZHomes adds logo
const createPriceMarker = (price, status, exclusive) => {
    const isOffMarket = status && status !== 'Active';
    const bgColor = isOffMarket ? '#718096' : '#222';
    let priceText = `$${price?.toLocaleString() || '0'}`;
    if (price >= 1000000) priceText = `$${(price / 1000000).toFixed(1)}M`;
    else if (price >= 1000) priceText = `$${Math.round(price / 1000)}K`;

    const logoHtml = exclusive 
        ? `<img src='/assets/logo/fav.png' style='width:16px;height:16px;border-radius:50%;flex-shrink:0;' />` 
        : '';

    return L.divIcon({
        html: `<div style="
            background: ${bgColor}; color: #fff;
            padding: 4px ${exclusive ? '8px 4px 4px' : '8px'}; border-radius: 20px;
            font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            white-space: nowrap; text-align: center;
            line-height: 1;
            display: inline-flex; align-items: center; gap: 4px;
        ">${logoHtml}${priceText}</div>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -10],
    });
};

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => { map.invalidateSize(); }, 300);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

export default function MapPageMobile() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { properties: globalProperties, loading: ctxLoading } = useProperties();

    const centerPosition = [38.2180, -85.6580];

    const [filteredProps, setFilteredProps] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [zhomesOnly, setZhomesOnly] = useState(false);

    useEffect(() => {
        if (ctxLoading) return;
        let filtered = [...(globalProperties || [])];
        
        // Only show properties with REAL coordinates (not null/random)
        filtered = filtered.filter(p => p.lat && p.lng && p.lat !== 0 && p.lng !== 0);

        if (statusFilter === 'Active') {
            filtered = filtered.filter(p => !p.status || p.status === 'Active');
        } else if (statusFilter === 'OffMarket') {
            filtered = filtered.filter(p => p.status && p.status !== 'Active');
        }

        if (zhomesOnly) {
            filtered = filtered.filter(p => p.exclusive === true);
        }

        setFilteredProps(filtered);
    }, [statusFilter, zhomesOnly, globalProperties, ctxLoading]);

    const tileUrl = theme === 'light' 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    return (
        <div className={`mobile-map-page animate-fadeInUp ${theme}`} style={{ position: 'relative' }}>
            {/* Floating filter buttons */}
            <div style={{ 
                position: 'absolute', bottom: '145px', left: '24px', zIndex: 1000, 
                display: 'flex', gap: '8px', alignItems: 'center' 
            }}>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ 
                        padding: '10px 14px', borderRadius: '24px', 
                        border: 'none', 
                        background: theme === 'dark' ? '#222' : '#fff',
                        color: theme === 'dark' ? '#fff' : '#222', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px', 
                        fontWeight: 600, outline: 'none', cursor: 'pointer',
                        WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none'
                    }}
                >
                    <option value="All">🏠 Todas</option>
                    <option value="Active">🟢 En Venta</option>
                    <option value="OffMarket">⚪ Off-Market</option>
                </select>

                <button
                    onClick={() => setZhomesOnly(!zhomesOnly)}
                    style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        border: zhomesOnly ? '2px solid #FFD700' : '2px solid transparent',
                        background: zhomesOnly ? '#222' : (theme === 'dark' ? '#222' : '#fff'),
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}
                    title={zhomesOnly ? 'Mostrar todas' : 'Solo ZHomes'}
                >
                    <img 
                        src="/assets/logo/fav.png" 
                        alt="ZHomes" 
                        style={{ width: '26px', height: '26px', objectFit: 'contain' }} 
                    />
                </button>
            </div>

            {/* Property count badge */}
            <div style={{
                position: 'absolute', top: '80px', right: '16px', zIndex: 1000,
                background: theme === 'dark' ? '#222' : '#fff',
                color: theme === 'dark' ? '#fff' : '#222',
                padding: '8px 14px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
                {filteredProps.length} propiedades
            </div>

            <MapContainer 
                center={centerPosition} 
                zoom={11} 
                scrollWheelZoom={true} 
                className="zhomes-map"
                zoomControl={false}
                attributionControl={false}
            >
                <MapResizer />
                <TileLayer url={tileUrl} />
                
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={40}
                    showCoverageOnHover={false}
                >
                    {filteredProps.map(p => (
                        <Marker 
                            key={p.id} 
                            position={[p.lat, p.lng]} 
                            icon={createPriceMarker(p.price, p.status, p.exclusive)}
                        >
                            <Popup className="zhomes-map-popup" closeButton={false}>
                                <div className="map-prop-content">
                                    <img src={p.image || p.images?.[0]} alt={p.address} className="map-prop-img" />
                                    <div className="map-prop-info">
                                        <h3>{p.address}</h3>
                                        <p className="map-price">${p.price?.toLocaleString()}</p>
                                        <div className="map-meta">
                                            <span><Bed size={14} /> {p.beds}</span>
                                            <span><Bath size={14} /> {p.baths}</span>
                                            <span><Expand size={14} /> {p.sqft} sqft</span>
                                        </div>
                                        <button className="map-btn" onClick={() => navigate(`/propiedades/${p.id}`)}>
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    )
}
