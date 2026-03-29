import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../../context/ThemeContext'
import { supabase } from '../../../lib/supabaseClient'
import { Bed, Bath, Expand } from 'lucide-react'
import MarkerClusterGroup from 'react-leaflet-cluster'
import './MapPageMobile.css'

// Clean price pill marker — ZHomes active vs off-market differentiated
const createPriceMarker = (price, status, exclusive) => {
    const isOffMarket = status && status !== 'Active' && status !== 'Pending' && status !== 'Active Under Contract';
    let priceText = `$${price?.toLocaleString() || '0'}`;
    if (price >= 1000000) {
        priceText = `$${(price / 1000000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}M`;
    } else if (price >= 1000) {
        priceText = `$${Math.round(price / 1000)}K`;
    }

    if (exclusive) {
        const bgColor = isOffMarket ? '#555' : '#1a1a1a';
        const borderColor = isOffMarket ? '#999' : '#FFD700';
        const dot = isOffMarket 
            ? '' 
            : `<span style="width:6px;height:6px;border-radius:50%;background:#4CAF50;flex-shrink:0;"></span>`;
        const logoHtml = `<img src='/assets/logo/fav.png' style='width:15px;height:15px;border-radius:50%;flex-shrink:0;' />`;
        
        return L.divIcon({
            html: `<div style="
                background: ${bgColor}; color: #fff;
                padding: 4px 8px 4px 4px; border-radius: 20px;
                font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 2px solid ${borderColor};
                white-space: nowrap; line-height: 1;
                display: inline-flex; align-items: center; gap: 4px;
                opacity: ${isOffMarket ? '0.75' : '1'};
            ">${logoHtml}${priceText}${dot}</div>`,
            className: '',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10],
        });
    }

    // Non-ZHomes markers
    const bgColor = isOffMarket ? '#718096' : '#222';
    return L.divIcon({
        html: `<div style="
            background: ${bgColor}; color: #fff;
            padding: 4px 8px; border-radius: 20px;
            font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            white-space: nowrap; text-align: center;
            line-height: 1;
            display: inline-flex; align-items: center; gap: 4px;
            opacity: ${isOffMarket ? '0.7' : '1'};
        ">${priceText}</div>`,
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

    const centerPosition = [38.2180, -85.6580];

    const [filteredProps, setFilteredProps] = useState([]);
    const [allMapProps, setAllMapProps] = useState({ active: [], exclusivas: [] });
    const [statusFilter, setStatusFilter] = useState('All');
    const [zhomesOnly, setZhomesOnly] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const [mapLoading, setMapLoading] = useState(true);

    // ── Load map properties: ZHomes always first ──
    useEffect(() => {
        async function loadMapProps() {
            setMapLoading(true);
            const cols = 'id,address,lat,lng,price,beds,baths,sqft,status,property_type,is_zhomes,primary_photo,photos,close_price,list_date';
            const baseFilters = (q) => q
                .not('lat', 'is', null)
                .not('lng', 'is', null)
                .neq('lat', 0)
                .neq('lng', 0);

            // Active: ZHomes first (no limit), then fill non-ZHomes
            const [zhActive, nonActive, zhClosed, nonClosed] = await Promise.all([
                baseFilters(supabase.from('mls_properties').select(cols))
                    .eq('is_zhomes', true)
                    .in('status', ['Active', 'Active Under Contract', 'Pending'])
                    .order('list_date', { ascending: false })
                    .order('price', { ascending: false }),

                baseFilters(supabase.from('mls_properties').select(cols))
                    .eq('is_zhomes', false)
                    .in('status', ['Active', 'Active Under Contract', 'Pending'])
                    .order('list_date', { ascending: false })
                    .order('price', { ascending: false }),

                baseFilters(supabase.from('mls_properties').select(cols))
                    .eq('is_zhomes', true)
                    .in('status', ['Exclusiva'])
                    .order('list_date', { ascending: false })
                    .order('price', { ascending: false }),
            ]);

            const fmt = p => ({
                id: p.id,
                address: p.address || '',
                lat: p.lat, lng: p.lng,
                price: p.price || p.close_price || 0,
                closePrice: p.close_price || 0,
                beds: p.beds || 0,
                baths: Math.round(p.baths || 0),
                sqft: p.sqft || 0,
                type: p.property_type || '',
                status: p.status || 'Active',
                exclusive: p.is_zhomes || false,
                exclusiva: p.status === 'Exclusiva', 
                image: p.primary_photo || null,
                images: p.photos || [p.primary_photo].filter(Boolean),
            });

            // ZHomes first in each group
            const activeRows = [
                ...(zhActive.data || []).map(fmt),
                ...(nonActive.data || []).map(fmt),
            ];
            const exclusivasRows = [
                ...(zhClosed.data || []).map(fmt)
            ];

            console.log(`🗺️  Map loaded: ${activeRows.length} active (${(zhActive.data || []).length} ZHomes), ${exclusivasRows.length} exclusivas`);
            setAllMapProps({ active: activeRows, exclusivas: exclusivasRows });
            setMapLoading(false);
        }
        loadMapProps();
    }, []); // load once on mount

    // ── Apply filters on top of loaded data ──
    useEffect(() => {
        const active = allMapProps.active;
        const exclusivas = allMapProps.exclusivas;

        // ZHomes are already first within each group — just pick the right pool
        let combined = statusFilter === 'Active'
            ? [...active]
            : statusFilter === 'Exclusivas'
                ? [...exclusivas]
                : [...active, ...exclusivas];  // ZHomes active → non-ZHomes active → Exclusivas

        if (zhomesOnly) {
            combined = combined.filter(p => p.exclusive === true);
        }

        if (activeFilter !== 'all') {
            combined = combined.filter(p => p.type === activeFilter);
        }

        console.log(`🔍 Map filter: ${combined.length} props (${combined.filter(p => p.exclusive).length} ZHomes)`);
        setFilteredProps(combined);
    }, [statusFilter, zhomesOnly, activeFilter, allMapProps]);


    const tileUrl = theme === 'light' 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    return (
        <div className={`mobile-map-page animate-fadeInUp ${theme}`} style={{ position: 'relative' }}>
            {/* ── Filter pills — at top, clearly above the map ── */}
            <div style={{
                position: 'absolute', top: 60, left: 0, right: 0,
                zIndex: 1001, display: 'flex', gap: 8, padding: '0 16px',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', gap: 6, pointerEvents: 'all' }}>
                    {[
                        { key: 'All',       label: '🏠 Todas' },
                        { key: 'Active',    label: '🟢 En Venta' },
                        { key: 'Exclusivas',label: '⭐ Exclusivas' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 20,
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s',
                                background: statusFilter === key
                                    ? (key === 'Active' ? '#10B981' : key === 'Exclusivas' ? '#FFD700' : (theme === 'dark' ? '#fff' : '#1a1a1a'))
                                    : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                                color: statusFilter === key
                                    ? (key === 'Exclusivas' ? '#1a1a1a' : '#fff')
                                    : (theme === 'dark' ? '#ccc' : '#444'),
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ZHomes toggle */}
                <button
                    onClick={() => setZhomesOnly(!zhomesOnly)}
                    style={{
                        marginLeft: 'auto',
                        width: 38, height: 38, borderRadius: '50%',
                        border: zhomesOnly ? '2.5px solid #FFD700' : '2px solid transparent',
                        background: zhomesOnly ? '#1a1a1a' : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, overflow: 'hidden',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s',
                        pointerEvents: 'all',
                        flexShrink: 0,
                    }}
                    title={zhomesOnly ? 'Mostrar todas' : 'Solo ZHomes'}
                >
                    <img
                        src="/assets/logo/fav.png"
                        alt="ZHomes"
                        style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                    />
                </button>
            </div>

            {/* Type Filter Row */}
            <div style={{
                position: 'absolute', top: 108, left: 0, right: 0,
                zIndex: 1001, display: 'flex', gap: 6, padding: '0 16px',
                overflowX: 'auto', pointerEvents: 'all',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }} className="no-scrollbar">
                {[
                    { key: 'all', label: 'Todos los Tipos' },
                    { key: 'Single Family', label: 'Casas' },
                    { key: 'Condominium', label: 'Apartamentos' },
                    { key: 'Townhouse', label: 'Townhouses' },
                    { key: 'Multifamily', label: 'Multifamiliar' },
                    { key: 'Lots/Land', label: 'Lotes / Terrenos' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: activeFilter === key ? '#E31E24' : (theme === 'dark' ? '#444' : '#ddd'),
                            background: activeFilter === key ? '#E31E24' : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                            color: activeFilter === key ? '#fff' : (theme === 'dark' ? '#ccc' : '#444'),
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>


            {/* Property count badge */}
            <div style={{
                position: 'absolute', top: '150px', left: '16px', zIndex: 1000,
                background: theme === 'dark' ? 'rgba(34,34,34,0.95)' : 'rgba(255,255,255,0.95)',
                color: theme === 'dark' ? '#fff' : '#222',
                padding: '7px 14px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                {mapLoading ? (
                    <span style={{ opacity: 0.6 }}>Cargando...</span>
                ) : (
                    <>
                        <span>{filteredProps.length} propiedades</span>
                        {filteredProps.filter(p => p.exclusive).length > 0 && (
                            <span style={{
                                background: '#FFD700', color: '#1a1a1a',
                                borderRadius: 10, padding: '2px 7px', fontSize: 11,
                            }}>
                                ⭐ {filteredProps.filter(p => p.exclusive).length} ZH
                            </span>
                        )}
                    </>
                )}
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
                    key={`${statusFilter}-${zhomesOnly}`}
                    chunkedLoading
                    maxClusterRadius={50}
                    showCoverageOnHover={false}
                    spiderfyOnMaxZoom={true}
                    disableClusteringAtZoom={15}
                    iconCreateFunction={(cluster) => {
                        const count = cluster.getChildCount();
                        let size = 36;
                        let fontSize = 12;
                        if (count >= 100) { size = 52; fontSize = 14; }
                        else if (count >= 50) { size = 46; fontSize = 13; }
                        else if (count >= 10) { size = 40; fontSize = 12; }

                        if (zhomesOnly) {
                            return L.divIcon({
                                html: `<div style="
                                    width: ${size + 8}px; height: ${size + 8}px;
                                    border-radius: 50%;
                                    background: #1a1a1a;
                                    color: #fff;
                                    display: flex; align-items: center; justify-content: center;
                                    gap: 3px;
                                    font-weight: 800; font-size: ${fontSize}px;
                                    font-family: system-ui, -apple-system, sans-serif;
                                    box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                                    border: 3px solid #FFD700;
                                "><img src='/assets/logo/fav.png' style='width:16px;height:16px;border-radius:50%;'/>${count}</div>`,
                                className: '',
                                iconSize: [size + 8, size + 8],
                                iconAnchor: [(size + 8) / 2, (size + 8) / 2],
                            });
                        }

                        return L.divIcon({
                            html: `<div style="
                                width: ${size}px; height: ${size}px;
                                border-radius: 50%;
                                background: var(--zhomes-red, #E31E24);
                                color: #fff;
                                display: flex; align-items: center; justify-content: center;
                                font-weight: 800; font-size: ${fontSize}px;
                                font-family: system-ui, -apple-system, sans-serif;
                                box-shadow: 0 3px 10px rgba(227, 30, 36, 0.4);
                                border: 3px solid rgba(255,255,255,0.9);
                            ">${count}</div>`,
                            className: '',
                            iconSize: [size, size],
                            iconAnchor: [size / 2, size / 2],
                        });
                    }}
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
