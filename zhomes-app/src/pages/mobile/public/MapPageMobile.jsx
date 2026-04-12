import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../../context/ThemeContext'
import { supabase } from '../../../lib/supabaseClient'
import { Bed, Bath, Expand, ChevronUp, ChevronDown, X } from 'lucide-react'
import MarkerClusterGroup from 'react-leaflet-cluster'
import './MapPageMobile.css'

// ── Price pill marker ──────────────────────────────────────────────────────────
const createPriceMarker = (price, status, exclusive, isSelected = false) => {
    const isOffMarket = status && status !== 'Active' && status !== 'Pending' && status !== 'Active Under Contract';
    let priceText = `$${price?.toLocaleString() || '0'}`;
    if (price >= 1000000) {
        priceText = `$${(price / 1000000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}M`;
    } else if (price >= 1000) {
        priceText = `$${Math.round(price / 1000)}K`;
    }

    const scale = isSelected ? 'transform: scale(1.25); z-index: 9999;' : '';
    const glow = isSelected ? 'box-shadow: 0 0 0 3px #E31E24, 0 4px 16px rgba(227,30,36,0.6);' : '';

    if (exclusive) {
        const bgColor = isSelected ? '#E31E24' : (isOffMarket ? '#555' : '#1a1a1a');
        const borderColor = isSelected ? '#fff' : (isOffMarket ? '#999' : '#FFD700');
        const dot = isOffMarket ? '' : `<span style="width:6px;height:6px;border-radius:50%;background:#4CAF50;flex-shrink:0;"></span>`;
        const logoHtml = `<img src='/assets/logo/fav.png' style='width:15px;height:15px;border-radius:50%;flex-shrink:0;' />`;
        return L.divIcon({
            html: `<div style="
                background: ${bgColor}; color: #fff;
                padding: 4px 8px 4px 4px; border-radius: 20px;
                font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif;
                border: 2px solid ${borderColor};
                white-space: nowrap; line-height: 1;
                display: inline-flex; align-items: center; gap: 4px;
                opacity: ${isOffMarket ? '0.75' : '1'};
                transition: all 0.2s;
                ${scale} ${glow}
            ">${logoHtml}${priceText}${dot}</div>`,
            className: '',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10],
        });
    }

    const bgColor = isSelected ? '#E31E24' : (isOffMarket ? '#718096' : '#222');
    return L.divIcon({
        html: `<div style="
            background: ${bgColor}; color: #fff;
            padding: 4px 8px; border-radius: 20px;
            font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif;
            white-space: nowrap; text-align: center; line-height: 1;
            display: inline-flex; align-items: center; gap: 4px;
            opacity: ${isOffMarket ? '0.7' : '1'};
            transition: all 0.2s;
            ${scale} ${glow}
        ">${priceText}</div>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -10],
    });
};

// ── Hook: emite bounds cada vez que el mapa se mueve ──────────────────────────
function BoundsWatcher({ onBoundsChange }) {
    const map = useMapEvents({
        moveend: () => onBoundsChange(map.getBounds()),
        zoomend: () => onBoundsChange(map.getBounds()),
    });
    useEffect(() => {
        // Inicializar bounds al montar
        onBoundsChange(map.getBounds());
    }, [map, onBoundsChange]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => { map.invalidateSize(); }, 300);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

// Ref que expone el mapa para centrarlo desde fuera
function MapController({ mapRef }) {
    const map = useMap();
    useEffect(() => { mapRef.current = map; }, [map, mapRef]);
    return null;
}

// ── Formatea precio para la card ───────────────────────────────────────────────
function fmtPrice(p) {
    if (!p) return '$0';
    if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
    if (p >= 1000)    return `$${Math.round(p / 1000)}K`;
    return `$${p.toLocaleString()}`;
}

// ── Componente Card horizontal ────────────────────────────────────────────────
function PropCard({ prop, isActive, onClick }) {
    const fallback = '/assets/logo/fav.png';
    return (
        <div
            className={`map-bottom-card ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            <div className="map-bottom-card-img-wrap">
                <img
                    src={prop.image || prop.images?.[0] || fallback}
                    alt={prop.address}
                    onError={e => { e.target.src = fallback; }}
                />
                {prop.exclusive && (
                    <span className="map-bottom-card-badge">⭐ ZH</span>
                )}
            </div>
            <div className="map-bottom-card-body">
                <p className="map-bottom-card-price">{fmtPrice(prop.price)}</p>
                <p className="map-bottom-card-address">{prop.address}</p>
                <div className="map-bottom-card-meta">
                    <span><Bed size={11} /> {prop.beds}</span>
                    <span><Bath size={11} /> {prop.baths}</span>
                    <span><Expand size={11} /> {prop.sqft?.toLocaleString()} ft²</span>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MapPageMobile() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const mapRef = useRef(null);
    const cardScrollRef = useRef(null);

    const centerPosition = [38.2180, -85.6580];

    const [filteredProps, setFilteredProps]     = useState([]);
    const [visibleProps, setVisibleProps]       = useState([]);
    const [allMapProps, setAllMapProps]         = useState({ active: [], exclusivas: [] });
    const [statusFilter, setStatusFilter]       = useState('All');
    const [zhomesOnly, setZhomesOnly]           = useState(false);
    const [activeFilter, setActiveFilter]       = useState('all');
    const [mapLoading, setMapLoading]           = useState(true);
    const [selectedId, setSelectedId]           = useState(null);
    const [panelExpanded, setPanelExpanded]     = useState(false);
    const [mapBounds, setMapBounds]             = useState(null);

    // ── Load properties ───────────────────────────────────────────────────────
    useEffect(() => {
        async function loadMapProps() {
            setMapLoading(true);
            const cols = 'id,address,lat,lng,price,beds,baths,sqft,status,property_type,is_zhomes,primary_photo,photos,close_price,list_date';
            const baseFilters = (q) => q
                .not('lat', 'is', null)
                .not('lng', 'is', null)
                .neq('lat', 0)
                .neq('lng', 0);

            const [zhActive, nonActive, zhClosed] = await Promise.all([
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

            setAllMapProps({
                active: [...(zhActive.data || []).map(fmt), ...(nonActive.data || []).map(fmt)],
                exclusivas: [...(zhClosed.data || []).map(fmt)],
            });
            setMapLoading(false);
        }
        loadMapProps();
    }, []);

    // ── Apply category/status filters ─────────────────────────────────────────
    useEffect(() => {
        const { active, exclusivas } = allMapProps;
        let combined =
            statusFilter === 'Active'     ? [...active] :
            statusFilter === 'Exclusivas' ? [...exclusivas] :
            [...active, ...exclusivas];

        if (zhomesOnly)          combined = combined.filter(p => p.exclusive);
        if (activeFilter !== 'all') combined = combined.filter(p => p.type === activeFilter);

        setFilteredProps(combined);
    }, [statusFilter, zhomesOnly, activeFilter, allMapProps]);

    // ── Sync visible cards with map bounds ────────────────────────────────────
    useEffect(() => {
        if (!mapBounds) { setVisibleProps(filteredProps.slice(0, 20)); return; }
        const visible = filteredProps.filter(p =>
            p.lat >= mapBounds.getSouth() &&
            p.lat <= mapBounds.getNorth() &&
            p.lng >= mapBounds.getWest() &&
            p.lng <= mapBounds.getEast()
        );
        // ZHomes primero, luego por precio desc
        visible.sort((a, b) => (b.exclusive ? 1 : 0) - (a.exclusive ? 1 : 0) || b.price - a.price);
        setVisibleProps(visible.slice(0, 40));
        setSelectedId(null); // reset selection on map move
    }, [mapBounds, filteredProps]);

    // ── Cuando se selecciona una card → centrar mapa ──────────────────────────
    const handleCardClick = useCallback((prop) => {
        setSelectedId(prev => prev === prop.id ? null : prop.id);
        if (mapRef.current) {
            mapRef.current.flyTo([prop.lat, prop.lng], Math.max(mapRef.current.getZoom(), 14), {
                animate: true,
                duration: 0.6,
            });
        }
        // Scroll the card into view
        const el = document.getElementById(`map-card-${prop.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, []);

    const handleBoundsChange = useCallback((bounds) => {
        setMapBounds(bounds);
    }, []);

    const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const zhomesCount = filteredProps.filter(p => p.exclusive).length;
    const visibleCount = visibleProps.length;

    return (
        <div className={`mobile-map-page animate-fadeInUp ${theme}`} style={{ position: 'relative' }}>

            {/* ── Filter pills ────────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 60, left: 0, right: 0,
                zIndex: 1001, display: 'flex', gap: 8, padding: '0 16px',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', gap: 6, pointerEvents: 'all' }}>
                    {[
                        { key: 'All',        label: '🏠 Todas' },
                        { key: 'Active',     label: '🟢 En Venta' },
                        { key: 'Exclusivas', label: '⭐ Exclusivas' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            style={{
                                padding: '8px 14px', borderRadius: 20, border: 'none',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                                background: statusFilter === key
                                    ? (key === 'Active' ? '#10B981' : key === 'Exclusivas' ? '#FFD700' : (theme === 'dark' ? '#fff' : '#1a1a1a'))
                                    : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                                color: statusFilter === key
                                    ? (key === 'Exclusivas' ? '#1a1a1a' : '#fff')
                                    : (theme === 'dark' ? '#ccc' : '#444'),
                            }}
                        >{label}</button>
                    ))}
                </div>

                {/* ZHomes toggle */}
                <button
                    onClick={() => setZhomesOnly(!zhomesOnly)}
                    style={{
                        marginLeft: 'auto', width: 38, height: 38, borderRadius: '50%',
                        border: zhomesOnly ? '2.5px solid #FFD700' : '2px solid transparent',
                        background: zhomesOnly ? '#1a1a1a' : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, overflow: 'hidden', backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s', pointerEvents: 'all', flexShrink: 0,
                    }}
                >
                    <img src="/assets/logo/fav.png" alt="ZHomes" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                </button>
            </div>

            {/* ── Type filter row ─────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 108, left: 0, right: 0,
                zIndex: 1001, display: 'flex', gap: 6, padding: '0 16px',
                overflowX: 'auto', pointerEvents: 'all',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }} className="no-scrollbar">
                {[
                    { key: 'all',          label: 'Todos los Tipos' },
                    { key: 'Single Family',label: 'Casas' },
                    { key: 'Condominium',  label: 'Apartamentos' },
                    { key: 'Townhouse',    label: 'Townhouses' },
                    { key: 'Multifamily',  label: 'Multifamiliar' },
                    { key: 'Lots/Land',    label: 'Lotes / Terrenos' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        style={{
                            padding: '6px 12px', borderRadius: 16, border: '1px solid',
                            borderColor: activeFilter === key ? '#E31E24' : (theme === 'dark' ? '#444' : '#ddd'),
                            background: activeFilter === key ? '#E31E24' : (theme === 'dark' ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
                            color: activeFilter === key ? '#fff' : (theme === 'dark' ? '#ccc' : '#444'),
                            fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s', flexShrink: 0
                        }}
                    >{label}</button>
                ))}
            </div>

            {/* ── Map ─────────────────────────────────────────────────────── */}
            <MapContainer
                center={centerPosition}
                zoom={11}
                scrollWheelZoom={true}
                className="zhomes-map"
                zoomControl={false}
                attributionControl={false}
            >
                <MapResizer />
                <MapController mapRef={mapRef} />
                <BoundsWatcher onBoundsChange={handleBoundsChange} />
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
                                    border-radius: 50%; background: #1a1a1a; color: #fff;
                                    display: flex; align-items: center; justify-content: center; gap: 3px;
                                    font-weight: 800; font-size: ${fontSize}px; font-family: system-ui, sans-serif;
                                    box-shadow: 0 3px 12px rgba(0,0,0,0.4); border: 3px solid #FFD700;
                                "><img src='/assets/logo/fav.png' style='width:16px;height:16px;border-radius:50%;'/>${count}</div>`,
                                className: '', iconSize: [size + 8, size + 8], iconAnchor: [(size + 8) / 2, (size + 8) / 2],
                            });
                        }
                        return L.divIcon({
                            html: `<div style="
                                width: ${size}px; height: ${size}px; border-radius: 50%;
                                background: var(--zhomes-red, #E31E24); color: #fff;
                                display: flex; align-items: center; justify-content: center;
                                font-weight: 800; font-size: ${fontSize}px; font-family: system-ui, sans-serif;
                                box-shadow: 0 3px 10px rgba(227, 30, 36, 0.4); border: 3px solid rgba(255,255,255,0.9);
                            ">${count}</div>`,
                            className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
                        });
                    }}
                >
                    {filteredProps.map(p => (
                        <Marker
                            key={p.id}
                            position={[p.lat, p.lng]}
                            icon={createPriceMarker(p.price, p.status, p.exclusive, selectedId === p.id)}
                            eventHandlers={{
                                click: () => handleCardClick(p),
                            }}
                        >
                            {/* Popup solo como fallback en desktop */}
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

            {/* ── BOTTOM PANEL ────────────────────────────────────────────── */}
            <div className={`map-bottom-panel ${panelExpanded ? 'expanded' : ''} ${theme}`}>
                {/* Handle + header */}
                <div className="map-bottom-header" onClick={() => setPanelExpanded(p => !p)}>
                    <div className="map-bottom-handle" />
                    <div className="map-bottom-header-row">
                        <span className="map-bottom-count">
                            {mapLoading ? 'Cargando...' : (
                                <>
                                    <strong>{visibleCount}</strong> en esta área
                                    {zhomesCount > 0 && !zhomesOnly && (
                                        <span className="map-bottom-zh-badge">⭐ {filteredProps.filter(p => p.exclusive && visibleProps.find(v => v.id === p.id)).length} ZH</span>
                                    )}
                                </>
                            )}
                        </span>
                        <span className="map-bottom-toggle-icon">
                            {panelExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </span>
                    </div>
                </div>

                {/* Cards scroll */}
                {!panelExpanded && visibleProps.length > 0 && (
                    <div className="map-bottom-cards-scroll" ref={cardScrollRef}>
                        {visibleProps.map(p => (
                            <div key={p.id} id={`map-card-${p.id}`}>
                                <PropCard
                                    prop={p}
                                    isActive={selectedId === p.id}
                                    onClick={() => handleCardClick(p)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Expanded list view */}
                {panelExpanded && (
                    <div className="map-bottom-list">
                        {visibleProps.length === 0 ? (
                            <div className="map-bottom-empty">
                                <p>No hay propiedades visibles en esta área.</p>
                                <p style={{ opacity: 0.5, fontSize: 13 }}>Mueve o aleja el mapa para ver más</p>
                            </div>
                        ) : visibleProps.map(p => (
                            <div
                                key={p.id}
                                className={`map-list-item ${selectedId === p.id ? 'active' : ''} ${theme}`}
                                onClick={() => { handleCardClick(p); setPanelExpanded(false); }}
                            >
                                <img
                                    src={p.image || p.images?.[0] || '/assets/logo/fav.png'}
                                    alt={p.address}
                                    className="map-list-img"
                                    onError={e => { e.target.src = '/assets/logo/fav.png'; }}
                                />
                                <div className="map-list-info">
                                    <p className="map-list-price">{fmtPrice(p.price)} {p.exclusive && '⭐'}</p>
                                    <p className="map-list-address">{p.address}</p>
                                    <p className="map-list-meta">
                                        {p.beds} rec · {p.baths} baños · {p.sqft?.toLocaleString()} ft²
                                    </p>
                                </div>
                                <button
                                    className="map-list-btn"
                                    onClick={e => { e.stopPropagation(); navigate(`/propiedades/${p.id}`); }}
                                >
                                    Ver
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
