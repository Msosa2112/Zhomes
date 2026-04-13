import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DeckGL from 'deck.gl'
import { WebMercatorViewport } from 'deck.gl'
import { HeatmapLayer, HexagonLayer } from 'deck.gl'
import Map, { Marker } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { useTheme } from '../../../context/ThemeContext'
import { supabase } from '../../../lib/supabaseClient'
import { Bed, Bath, Expand, ChevronUp, ChevronDown, Search, X, Flame, Hexagon, Map as MapIcon, Loader, Home, Coins, MapPin, Building, Waves, HelpCircle, Bot, Info, Star, Car, DollarSign } from 'lucide-react'
import './MapPageMobile.css'

// ── Formatea precio ────────────────────────────────────────────────────────────
function fmtPrice(p) {
  if (!p) return '$0';
  if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
  if (p >= 1000)    return `$${Math.round(p / 1000)}K`;
  return `$${p.toLocaleString()}`;
}

// ── Estilos de mapa (CartoCDN via MapLibre raster) ────────────────────────────
const getMapStyle = (dark) => ({
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [dark
        ? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
        : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: ' CartoDB  OpenStreetMap',
    },
  },
  layers: [{ id: 'carto-tiles', type: 'raster', source: 'carto' }],
});

// ── Price Pill component (inline HTML marker) ─────────────────────────────────
function PricePill({ prop, isSelected, onClick }) {
  const isOffMarket = prop.status && !['Active', 'Pending', 'Active Under Contract'].includes(prop.status);
  const bg      = isSelected ? '#E31E24' : (prop.exclusive ? '#1a1a1a' : (isOffMarket ? '#718096' : '#222'));
  const border  = isSelected ? '#fff'    : (prop.exclusive ? '#FFD700' : 'transparent');
  const opacity = isOffMarket ? 0.7 : 1;

  return (
    <div
      onClick={onClick}
      className={`map-price-pill ${isSelected ? 'active' : ''} ${prop.exclusive ? 'exclusive' : ''}`}
      style={{ background: bg, borderColor: border, opacity }}
    >
      {prop.exclusive && <img src="/assets/logo/fav.png" alt="" className="map-pill-logo" />}
      {fmtPrice(prop.price)}
      {prop.exclusive && !isOffMarket && <span className="map-pill-dot" />}
    </div>
  );
}

// ── Cluster bubble ─────────────────────────────────────────────────────────────
function ClusterBubble({ count, isZhomes, onClick }) {
  const size = count >= 100 ? 50 : count >= 50 ? 44 : count >= 10 ? 38 : 32;
  return (
    <div onClick={onClick} className={`map-cluster-bubble ${isZhomes ? 'zhomes' : ''}`} style={{ width: size, height: size }}>
      {isZhomes && <img src="/assets/logo/fav.png" alt="" style={{ width: 14, height: 14, borderRadius: '50%' }} />}
      {count}
    </div>
  );
}

// ── PropCard del panel inferior ────────────────────────────────────────────────
function PropCard({ prop, isActive, onClick, onView }) {
  const fallback = '/assets/logo/fav.png';
  return (
    <div className={`map-bottom-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="map-bottom-card-img-wrap">
        <img
          src={prop.image || prop.images?.[0] || fallback}
          alt={prop.address}
          onError={e => { e.target.src = fallback; }}
        />
        {prop.exclusive && <span className="map-bottom-card-badge"> ZH</span>}
        {isActive && (
          <button className="map-bottom-card-view" onClick={e => { e.stopPropagation(); onView(); }}>
            Ver →
          </button>
        )}
      </div>
      {/* Una sola línea: precio | camas | baños | sqft */}
      <div className="map-bottom-card-body">
        <div className="map-card-inline">
          <span className="map-card-price">{fmtPrice(prop.price)}</span>
          <span className="map-card-vsep" />
          <span className="map-card-stat">{prop.beds} <span className="map-card-unit">bd</span></span>
          <span className="map-card-vsep" />
          <span className="map-card-stat">{prop.baths} <span className="map-card-unit">ba</span></span>
          <span className="map-card-vsep" />
          <span className="map-card-stat">{prop.sqft?.toLocaleString()} <span className="map-card-unit">ft²</span></span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MapPageMobile() {
  const navigate   = useNavigate();
  const { theme }  = useTheme();
  const scrollRef  = useRef(null);

  // ── ViewState (DeckGL controla el viewport) ──────────────────────────────
  const [viewState, setViewState] = useState({
    latitude: 38.2180, longitude: -85.6580,
    zoom: 11, pitch: 0, bearing: 0,
    transitionDuration: 300,
  });

  // ── Data & filters ────────────────────────────────────────────────────────
  const [allMapProps, setAllMapProps]     = useState({ active: [], exclusivas: [] });
  const [filteredProps, setFilteredProps] = useState([]);
  const [statusFilter, setStatusFilter]   = useState('All');
  const [zhomesOnly, setZhomesOnly]       = useState(false);
  const [typeFilter, setTypeFilter]       = useState('all');
  const [mapLoading, setMapLoading]       = useState(true);

  // ── Map mode: standard | heat | hex ──────────────────────────────────────
  const [mapMode, setMapMode] = useState('standard');

  // ── Selection & panel ─────────────────────────────────────────────────────
  const [selectedId, setSelectedId]       = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(false);

  // ── AI Search ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiFilters, setAiFilters]     = useState({});
  const [showSearch, setShowSearch]   = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // ── Load properties ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setMapLoading(true);
      const cols = 'id,address,lat,lng,price,beds,baths,sqft,status,property_type,is_zhomes,primary_photo,photos,close_price,list_date';
      const base = (q) => q.not('lat','is',null).not('lng','is',null).neq('lat',0).neq('lng',0);

      const [zhA, nonA, zhC] = await Promise.all([
        base(supabase.from('mls_properties').select(cols)).eq('is_zhomes',true).in('status',['Active','Active Under Contract','Pending']).order('list_date',{ascending:false}),
        base(supabase.from('mls_properties').select(cols)).eq('is_zhomes',false).in('status',['Active','Active Under Contract','Pending']).order('list_date',{ascending:false}),
        base(supabase.from('mls_properties').select(cols)).eq('is_zhomes',true).in('status',['Exclusiva']).order('list_date',{ascending:false}),
      ]);

      const fmt = p => ({
        id: p.id, address: p.address || '',
        lat: p.lat, lng: p.lng,
        price: p.price || p.close_price || 0,
        beds: p.beds || 0, baths: Math.round(p.baths || 0),
        sqft: p.sqft || 0, type: p.property_type || '',
        status: p.status || 'Active',
        exclusive: p.is_zhomes || false,
        image: p.primary_photo || null,
        images: p.photos || [p.primary_photo].filter(Boolean),
      });

      setAllMapProps({
        active:    [...(zhA.data||[]).map(fmt), ...(nonA.data||[]).map(fmt)],
        exclusivas:[...(zhC.data||[]).map(fmt)],
      });
      setMapLoading(false);
    }
    load();
  }, []);

  // ── Apply category + AI filters ───────────────────────────────────────────
  useEffect(() => {
    const { active, exclusivas } = allMapProps;
    let combined =
      statusFilter === 'Active'     ? [...active]     :
      statusFilter === 'Exclusivas' ? [...exclusivas]  :
      [...active, ...exclusivas];

    if (zhomesOnly)          combined = combined.filter(p => p.exclusive);
    
    if (typeFilter !== 'all') {
      combined = combined.filter(p => {
        const t = String(p.type || '').toLowerCase();
        if (typeFilter === 'Condominium') {
            return t.includes('condo') || t.includes('apartment') || t.includes('town') || t.includes('multi');
        } else if (typeFilter === 'Lots/Land') {
            return t.includes('land') || t.includes('lot') || t.includes('farm') || t.includes('acreage');
        } else if (typeFilter === 'Single Family') {
            const isCondo = t.includes('condo') || t.includes('apartment') || t.includes('town') || t.includes('multi');
            const isLand = t.includes('land') || t.includes('lot') || t.includes('farm') || t.includes('acreage');
            return !isCondo && !isLand; // Default to houses if it's not a condo or land
        } else {
            return t.includes(typeFilter.toLowerCase());
        }
      });
    }

    // AI filters
    if (aiFilters.priceMax) combined = combined.filter(p => p.price <= aiFilters.priceMax);
    if (aiFilters.priceMin) combined = combined.filter(p => p.price >= aiFilters.priceMin);
    if (aiFilters.beds)     combined = combined.filter(p => p.beds >= aiFilters.beds);
    if (aiFilters.baths)    combined = combined.filter(p => p.baths >= aiFilters.baths);
    if (aiFilters.type)     combined = combined.filter(p => p.type === aiFilters.type);

    setFilteredProps(combined);
    setSelectedId(null);
  }, [statusFilter, zhomesOnly, typeFilter, allMapProps, aiFilters]);

  // ── Supercluster index ────────────────────────────────────────────────────
  const clusterIndex = useMemo(() => {
    if (!filteredProps.length) return null;
    const idx = new Supercluster({ radius: 60, maxZoom: 15 });
    idx.load(filteredProps.map(p => ({
      type: 'Feature',
      properties: { ...p },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })));
    return idx;
  }, [filteredProps]);

  // ── Compute clusters for current viewport ─────────────────────────────────
  const clusters = useMemo(() => {
    if (!clusterIndex || mapMode !== 'standard') return [];
    try {
      const vp   = new WebMercatorViewport(viewState);
      const bnds = vp.getBounds();
      const zoom = Math.max(0, Math.min(20, Math.round(viewState.zoom)));
      return clusterIndex.getClusters(bnds, zoom);
    } catch { return []; }
  }, [clusterIndex, viewState, mapMode]);

  // ── Props visible in viewport (for bottom panel) ──────────────────────────
  const visibleProps = useMemo(() => {
    try {
      const vp = new WebMercatorViewport(viewState);
      const [w, s, e, n] = vp.getBounds();
      const visible = filteredProps.filter(p =>
        p.lat >= s && p.lat <= n && p.lng >= w && p.lng <= e
      );
      visible.sort((a,b) => (b.exclusive?1:0)-(a.exclusive?1:0) || b.price-a.price);
      return visible.slice(0, 40);
    } catch { return filteredProps.slice(0, 20); }
  }, [filteredProps, viewState]);

  // ── deck.gl layers ────────────────────────────────────────────────────────
  const deckLayers = useMemo(() => {
    const dark = theme === 'dark';
    if (mapMode === 'heat') {
      return [new HeatmapLayer({
        id: 'heatmap',
        data: filteredProps,
        getPosition:  d => [d.lng, d.lat],
        getWeight:    d => Math.min(d.price / 1000, 500),
        radiusPixels: 70,
        intensity:    1.2,
        threshold:    0.03,
        colorRange: [
          [0,   0,   255, 0  ],
          [0,   128, 255, 100],
          [0,   255, 128, 150],
          [255, 255, 0,   200],
          [255, 128, 0,   230],
          [255, 0,   0,   255],
        ],
      })];
    }
    if (mapMode === 'hex') {
      return [new HexagonLayer({
        id: 'hexagon',
        data: filteredProps,
        getPosition:         d => [d.lng, d.lat],
        getElevationWeight:  d => d.price / 1000,
        getColorWeight:      d => d.price,
        elevationScale:      8,
        extruded:            true,
        radius:              400,
        coverage:            0.85,
        upperPercentile:     100,
        colorRange: [
          [26,  117, 255],
          [0,   200, 150],
          [80,  220, 60 ],
          [255, 230, 0  ],
          [255, 140, 0  ],
          [220, 30,  30 ],
        ],
        pickable:   true,
        opacity:    0.85,
        material:   { ambient: 0.64, diffuse: 0.6, shininess: 100 },
      })];
    }
    return [];
  }, [mapMode, filteredProps, theme]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleModeChange = useCallback((mode) => {
    setMapMode(mode);
    setSelectedId(null);
    // 3D tilt for hex mode
    setViewState(v => ({ ...v, pitch: mode === 'hex' ? 45 : 0, transitionDuration: 600 }));
  }, []);

  const handleSelectProp = useCallback((prop) => {
    setSelectedId(prev => prev === prop.id ? null : prop.id);
    if (prop.lat && prop.lng) {
      setViewState(v => ({
        ...v,
        latitude: prop.lat, longitude: prop.lng,
        zoom: Math.max(v.zoom, 14),
        transitionDuration: 500,
      }));
    }
    // Scroll card into view
    setTimeout(() => {
      const el = document.getElementById(`map-card-${prop.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  }, []);

  const handleClusterClick = useCallback((cluster) => {
    if (!clusterIndex) return;
    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(cluster.id), 15);
    const [lng, lat] = cluster.geometry.coordinates;
    setViewState(v => ({ ...v, latitude: lat, longitude: lng, zoom: expansionZoom, transitionDuration: 400 }));
  }, [clusterIndex]);

  // ── AI Search ─────────────────────────────────────────────────────────────
  const handleAiSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setAiFilters({}); return; }
    setAiLoading(true);
    try {
      const res  = await fetch('/api/map-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setAiFilters(data.filters || {});
    } catch { setAiFilters({}); }
    setAiLoading(false);
  }, [searchQuery]);

  const clearAiSearch = useCallback(() => {
    setSearchQuery('');
    setAiFilters({});
    setShowSearch(false);
  }, []);

  // ── Map style ─────────────────────────────────────────────────────────────
  const mapStyle = useMemo(() => getMapStyle(theme === 'dark'), [theme]);

  const hasAiFilters = Object.keys(aiFilters).length > 0;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`mobile-map-page ${theme}`}>

      {/* ── AI Search Bar ──────────────────────────────────────────────── */}
      {showSearch ? (
        <div className="map-ai-bar">
          <Search size={16} className="map-ai-icon" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
            placeholder="Ej: casa tranquila con 3 cuartos, menos de $280k..."
            className="map-ai-input"
          />
          {aiLoading
            ? <Loader size={16} className="map-ai-spin" />
            : searchQuery
              ? <button onClick={clearAiSearch} className="map-ai-clear"><X size={16} /></button>
              : <button onClick={() => setShowSearch(false)} className="map-ai-clear"><X size={16} /></button>
          }
          {!aiLoading && searchQuery && (
            <button onClick={handleAiSearch} className="map-ai-go">Buscar</button>
          )}
        </div>
      ) : (
        <button
          className={`map-ai-trigger ${hasAiFilters ? 'active' : ''}`}
          onClick={() => setShowSearch(true)}
        >
          <Search size={14} />
          {hasAiFilters ? `"${searchQuery}"` : 'Describe tu hogar ideal...'}
          {hasAiFilters && <span className="map-ai-active-dot" />}
        </button>
      )}

      {/* ── Status filter pills ────────────────────────────────────────── */}
      <div className="map-filter-row top">
        {[
          { key: 'All',        label: <span className="flex items-center gap-1"><Home size={14} /> Todas</span> },
          { key: 'Active',     label: <span className="flex items-center gap-1"><DollarSign size={14} color="#10B981" /> En Venta</span> },
          { key: 'Exclusivas', label: <span className="flex items-center gap-1"><Star size={14} color="#F59E0B" /> Exclusivas</span> },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`map-pill flex items-center ${statusFilter === key ? `active-${key.toLowerCase()}` : ''}`}
          >{label}</button>
        ))}
        <button
          onClick={() => setZhomesOnly(!zhomesOnly)}
          className={`map-pill-icon ${zhomesOnly ? 'active-zhomes' : ''}`}
        >
          <img src="/assets/logo/fav.png" alt="ZHomes" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        </button>
      </div>

      {/* ── Type filter row: Todos / Casas / Apt / Lotes + ··· ────────────── */}
      <div style={{ position: 'relative' }}>
        <div className="map-filter-row types">
          {[
            { key: 'all',          label: 'Todos' },
            { key: 'Single Family',label: <span className="flex items-center gap-1"><Home size={14} /> Casas</span> },
            { key: 'Condominium',  label: <span className="flex items-center gap-1"><Building size={14} /> Apt</span> },
            { key: 'Lots/Land',    label: <span className="flex items-center gap-1"><MapPin size={14} /> Lotes</span> },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTypeFilter(key); setShowTypeDropdown(false); }}
              className={`map-pill sm flex items-center ${
                typeFilter === key ? 'active-type' :
                (typeFilter === 'Townhouse' || typeFilter === 'Multifamily') && key === 'all' && typeFilter !== 'all' ? '' : ''
              }`}
            >{label}</button>
          ))}

          {/* Botón más ··· */}
          <button
            onClick={() => setShowTypeDropdown(v => !v)}
            className={`map-pill sm ${
              (typeFilter === 'Townhouse' || typeFilter === 'Multifamily') ? 'active-type' : ''
            }`}
          >
            {typeFilter === 'Townhouse' ? <span className="flex items-center gap-1"><Building size={14} /> Town</span> : typeFilter === 'Multifamily' ? <span className="flex items-center gap-1"><Building size={14} /> Multi</span> : '···'}
          </button>
        </div>

        {/* Dropdown */}
        {showTypeDropdown && (
          <>
            {/* Overlay para cerrar al tocar fuera */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 1199 }}
              onClick={() => setShowTypeDropdown(false)}
            />
            <div className="map-type-dropdown">
              {[
                { key: 'Townhouse',  label: <span className="flex items-center gap-1"><Building size={14} /> Townhouse</span> },
                { key: 'Multifamily',label: <span className="flex items-center gap-1"><Building size={14} /> Multifamiliar</span> },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(key); setShowTypeDropdown(false); }}
                  className={`map-type-dropdown-item flex items-center ${typeFilter === key ? 'active' : ''}`}
                >{label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Map (DeckGL + MapLibre) ────────────────────────────────────── */}
      <DeckGL
        viewState={viewState}
        controller={{ touchRotate: false, dragRotate: false }}
        layers={deckLayers}
        onViewStateChange={({ viewState: vs }) => setViewState({ ...vs })}
        className={`zhomes-map mode-${mapMode}`}
        getCursor={() => 'grab'}
      >
        <Map mapStyle={mapStyle} mapLib={maplibregl} reuseMaps>

          {/* Clusters + Price Pills (standard mode) */}
          {mapMode === 'standard' && clusters.map((c, i) => {
            const [lng, lat] = c.geometry.coordinates;
            const isCluster  = !!c.properties.cluster;
            const key        = isCluster ? `cl-${c.id}` : `pp-${c.properties.id}`;

            if (isCluster) {
              const hasZH = clusterIndex?.getLeaves(c.id, 1)?.[0]?.properties?.exclusive;
              return (
                <Marker key={key} latitude={lat} longitude={lng} anchor="center">
                  <ClusterBubble
                    count={c.properties.point_count}
                    isZhomes={hasZH}
                    onClick={() => handleClusterClick(c)}
                  />
                </Marker>
              );
            }

            const prop = c.properties;
            return (
              <Marker key={key} latitude={lat} longitude={lng} anchor="center">
                <PricePill
                  prop={prop}
                  isSelected={selectedId === prop.id}
                  onClick={() => handleSelectProp(prop)}
                />
              </Marker>
            );
          })}

        </Map>
      </DeckGL>

      {/* ── Mode toggle (mapa / calor / 3D) ───────────────────────────── */}
      <div className="map-mode-controls">
        <button onClick={() => handleModeChange('standard')} className={`map-mode-btn ${mapMode === 'standard' ? 'active' : ''}`} title="Vista normal">
          <MapIcon size={16} />
        </button>
        <button onClick={() => handleModeChange('heat')} className={`map-mode-btn ${mapMode === 'heat' ? 'active' : ''}`} title="Mapa de calor de precios">
          <Flame size={16} />
        </button>
        <button onClick={() => handleModeChange('hex')} className={`map-mode-btn ${mapMode === 'hex' ? 'active' : ''}`} title="Vista 3D de precios por zona">
          <Hexagon size={16} />
        </button>
      </div>

      {/* ── Mode indicator label ───────────────────────────────────────── */}
      {mapMode !== 'standard' && (
        <div className="map-mode-label">
          {mapMode === 'heat' ? <span className="flex items-center gap-1"><Flame size={14}/> Densidad de precios</span> : <span className="flex items-center gap-1"><Hexagon size={14}/> Precios 3D por zona</span>}
        </div>
      )}

      {/* ── Prop count badge ───────────────────────────────────────────── */}
      <div className="map-count-badge">
        {mapLoading ? 'Cargando...' : (
          <>
            <span>{mapMode === 'standard' ? visibleProps.length : filteredProps.length} prop{(visibleProps.length !== 1) ? 's' : ''}</span>
            {hasAiFilters && <span className="map-count-ai flex items-center gap-1"><Bot size={12}/> IA</span>}
            {filteredProps.filter(p => p.exclusive).length > 0 && !zhomesOnly && (
              <span className="map-count-zh"> {filteredProps.filter(p => p.exclusive).length}</span>
            )}
          </>
        )}
      </div>

      {/* ══ BOTTOM AIRBNB PANEL ═══════════════════════════════════════════ */}
      <div className={`map-bottom-panel ${panelExpanded ? 'expanded' : ''} ${theme}`}>

        {/* Handle */}
        <div className="map-bottom-header" onClick={() => setPanelExpanded(p => !p)}>
          <div className="map-bottom-handle" />
          <div className="map-bottom-header-row">
            <span className="map-bottom-count">
              {mapLoading ? 'Cargando...' : (
                panelExpanded
                  ? `${visibleProps.length} propiedades en esta área`
                  : `Ver ${visibleProps.length} propiedades →`
              )}
            </span>
            {panelExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>

        {/* Horizontal card scroll (collapsed) */}
        {!panelExpanded && (
          <div className="map-bottom-cards-scroll no-scrollbar" ref={scrollRef}>
            {visibleProps.length === 0 && !mapLoading ? (
              <div className="map-bottom-empty-inline">Mueve el mapa para ver propiedades</div>
            ) : visibleProps.map(p => (
              <div key={p.id} id={`map-card-${p.id}`}>
                <PropCard
                  prop={p}
                  isActive={selectedId === p.id}
                  onClick={() => handleSelectProp(p)}
                  onView={() => navigate(`/propiedades/${p.id}`)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Expanded list */}
        {panelExpanded && (
          <div className="map-bottom-list no-scrollbar">
            {visibleProps.length === 0 ? (
              <div className="map-bottom-empty">
                <p>No hay propiedades en esta área.</p>
                <p style={{ opacity: 0.5, fontSize: 13 }}>Aleja el mapa para ver más</p>
              </div>
            ) : visibleProps.map(p => (
              <div
                key={p.id}
                className={`map-list-item ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => { handleSelectProp(p); setPanelExpanded(false); }}
              >
                <img
                  src={p.image || p.images?.[0] || '/assets/logo/fav.png'}
                  alt={p.address}
                  className="map-list-img"
                  onError={e => { e.target.src = '/assets/logo/fav.png'; }}
                />
                <div className="map-list-info">
                  <p className="map-list-price">{fmtPrice(p.price)} {p.exclusive && <Star size={14} color="#F59E0B" className="inline"/>}</p>
                  <p className="map-list-address">{p.address}</p>
                  <p className="map-list-meta">{p.beds} rec · {p.baths} baños · {p.sqft?.toLocaleString()} ft²</p>
                </div>
                <button
                  className="map-list-btn"
                  onClick={e => { e.stopPropagation(); navigate(`/propiedades/${p.id}`); }}
                >Ver</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
