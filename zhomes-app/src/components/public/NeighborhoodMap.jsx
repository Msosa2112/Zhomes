import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { GraduationCap, Utensils, Car, TreePine, ShoppingBag, Dumbbell, Coffee, Clock, MapPin, Layers } from 'lucide-react'
import './NeighborhoodMap.css'

/**
 * NeighborhoodMap — Mapa interactivo con capas de datos del vecindario.
 * 
 * Props:
 * - lat: number (latitud de la propiedad)
 * - lng: number (longitud de la propiedad)
 * - address: string
 */

// Mock data de puntos de interés cercanos a Louisville, KY
function generatePOIs(lat, lng) {
    return {
        schools: [
            { name: 'Louisville Academy', rating: 8.5, dist: '0.4 mi', type: 'Primaria', lat: lat + 0.004, lng: lng - 0.005 },
            { name: 'Jefferson High School', rating: 7.8, dist: '0.9 mi', type: 'Secundaria', lat: lat - 0.006, lng: lng + 0.003 },
            { name: 'Bluegrass Montessori', rating: 9.2, dist: '1.2 mi', type: 'Preescolar', lat: lat + 0.008, lng: lng + 0.007 },
        ],
        dining: [
            { name: 'El Nopal', dist: '0.3 mi', type: 'Mexicano', lat: lat + 0.002, lng: lng + 0.004 },
            { name: 'Starbucks', dist: '0.5 mi', type: 'Café', lat: lat - 0.003, lng: lng - 0.006 },
            { name: 'Raising Cane\'s', dist: '0.7 mi', type: 'Fast Food', lat: lat - 0.007, lng: lng + 0.005 },
            { name: 'Thai Noodles', dist: '1.0 mi', type: 'Thai', lat: lat + 0.009, lng: lng - 0.004 },
        ],
        lifestyle: [
            { name: 'Cherokee Park', dist: '1.5 mi', type: 'Parque', icon: 'park', lat: lat + 0.012, lng: lng - 0.008 },
            { name: 'Planet Fitness', dist: '0.8 mi', type: 'Gym', icon: 'gym', lat: lat - 0.005, lng: lng + 0.009 },
            { name: 'Kroger', dist: '0.4 mi', type: 'Supermercado', icon: 'shop', lat: lat + 0.003, lng: lng - 0.007 },
        ],
        commute: [
            { name: 'I-64 Access', time: '3 min', lat: lat + 0.01, lng: lng + 0.01 },
            { name: 'Downtown Louisville', time: '15 min', lat: lat + 0.04, lng: lng + 0.02 },
            { name: 'SDF Airport', time: '20 min', lat: lat - 0.06, lng: lng + 0.05 },
        ],
    }
}

const DAY_TIMELINE = [
    { time: '7:00 AM', emoji: '☕', activity: 'Café a 5 min caminando', category: 'dining' },
    { time: '7:45 AM', emoji: '🚗', activity: 'I-64 a 3 min — Commute fluido', category: 'commute' },
    { time: '8:00 AM', emoji: '🏫', activity: 'Dejar niños en la escuela (0.4 mi)', category: 'schools' },
    { time: '12:00 PM', emoji: '🍽️', activity: 'Almuerzo en El Nopal (0.3 mi)', category: 'dining' },
    { time: '3:30 PM', emoji: '🏫', activity: 'Recoger niños de la escuela', category: 'schools' },
    { time: '4:00 PM', emoji: '🌳', activity: 'Cherokee Park — caminata familiar (1.5 mi)', category: 'lifestyle' },
    { time: '5:30 PM', emoji: '🏋️', activity: 'Session en Planet Fitness (0.8 mi)', category: 'lifestyle' },
    { time: '6:30 PM', emoji: '🛒', activity: 'Compras en Kroger (0.4 mi)', category: 'lifestyle' },
    { time: '7:30 PM', emoji: '🏠', activity: 'De vuelta en casa — tu hogar', category: 'home' },
]

const LAYER_CONFIG = {
    schools: { label: 'Escuelas', icon: GraduationCap, color: '#3B82F6' },
    dining: { label: 'Restaurantes', icon: Utensils, color: '#F59E0B' },
    lifestyle: { label: 'Estilo de Vida', icon: TreePine, color: '#10B981' },
    commute: { label: 'Commute', icon: Car, color: '#8B5CF6' },
}

function createLayerIcon(color) {
    return L.divIcon({
        className: 'nh-marker',
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    })
}

const propertyIcon = L.divIcon({
    className: 'nh-property-marker',
    html: `<div style="background:#E31E24;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(227,30,36,0.4);animation:nh-prop-pulse 2s ease-in-out infinite"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
})

// Mock data de puntos de interés (sirve como fallback si el API falla)
export default function NeighborhoodMap({ propertyId, lat, lng, address }) {
    const [activeTab, setActiveTab] = useState('map')
    const [activeLayers, setActiveLayers] = useState(['schools', 'dining', 'lifestyle', 'commute'])
    const [realPois, setRealPois] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!propertyId || !lat || !lng) return;
        
        setLoading(true);
        fetch(`/api/neighborhood?property_id=${propertyId}&lat=${lat}&lng=${lng}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) setRealPois(data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("OSM Error:", err);
                setLoading(false);
            })
    }, [propertyId, lat, lng])

    const pois = useMemo(() => realPois || generatePOIs(lat, lng), [lat, lng, realPois])

    const toggleLayer = (layer) => {
        setActiveLayers(prev =>
            prev.includes(layer)
                ? prev.filter(l => l !== layer)
                : [...prev, layer]
        )
    }

    return (
        <div className="nh-map-container">
            {/* Tabs */}
            <div className="nh-tabs">
                <button
                    className={`nh-tab ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <MapPin size={16} />
                    Vecindario
                </button>
                <button
                    className={`nh-tab ${activeTab === 'day' ? 'active' : ''}`}
                    onClick={() => setActiveTab('day')}
                >
                    <Clock size={16} />
                    Un Día Aquí
                </button>
            </div>

            {/* Map View */}
            {activeTab === 'map' && (
                <div className="nh-map-view">
                    {/* Layer Toggles */}
                    <div className="nh-layers">
                        <span className="nh-layers-title"><Layers size={14} /> Capas</span>
                        {Object.entries(LAYER_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                className={`nh-layer-btn ${activeLayers.includes(key) ? 'active' : ''}`}
                                onClick={() => toggleLayer(key)}
                                style={{
                                    '--layer-color': config.color,
                                    borderColor: activeLayers.includes(key) ? config.color : 'var(--border-medium)',
                                }}
                            >
                                <config.icon size={14} />
                                {config.label}
                            </button>
                        ))}
                    </div>

                    {/* Leaflet Map */}
                    <div className="nh-map-wrapper">
                        <MapContainer
                            center={[lat, lng]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />

                            {/* Property Marker */}
                            <Marker position={[lat, lng]} icon={propertyIcon}>
                                <Popup>
                                    <div className="nh-popup-property">
                                        <strong>{address}</strong>
                                        <span>Tu propiedad</span>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Walking radius */}
                            <Circle
                                center={[lat, lng]}
                                radius={800}
                                pathOptions={{
                                    color: 'rgba(227, 30, 36, 0.2)',
                                    fillColor: 'rgba(227, 30, 36, 0.05)',
                                    fillOpacity: 0.3,
                                    weight: 1,
                                    dashArray: '5 5',
                                }}
                            />

                            {/* POI Markers */}
                            {activeLayers.includes('schools') && pois.schools.map((p, i) => (
                                <Marker key={`s-${i}`} position={[p.lat, p.lng]} icon={createLayerIcon('#3B82F6')}>
                                    <Popup>
                                        <div className="nh-popup-poi">
                                            <strong>{p.name}</strong>
                                            <span>{p.type} · ⭐ {p.rating}/10</span>
                                            <span>{p.dist}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {activeLayers.includes('dining') && pois.dining.map((p, i) => (
                                <Marker key={`d-${i}`} position={[p.lat, p.lng]} icon={createLayerIcon('#F59E0B')}>
                                    <Popup>
                                        <div className="nh-popup-poi">
                                            <strong>{p.name}</strong>
                                            <span>{p.type}</span>
                                            <span>{p.dist}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {activeLayers.includes('lifestyle') && pois.lifestyle.map((p, i) => (
                                <Marker key={`l-${i}`} position={[p.lat, p.lng]} icon={createLayerIcon('#10B981')}>
                                    <Popup>
                                        <div className="nh-popup-poi">
                                            <strong>{p.name}</strong>
                                            <span>{p.type}</span>
                                            <span>{p.dist}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {activeLayers.includes('commute') && pois.commute.map((p, i) => (
                                <Marker key={`c-${i}`} position={[p.lat, p.lng]} icon={createLayerIcon('#8B5CF6')}>
                                    <Popup>
                                        <div className="nh-popup-poi">
                                            <strong>{p.name}</strong>
                                            <span>🚗 {p.time}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    {/* Quick Stats */}
                    <div className="nh-quick-stats">
                        {activeLayers.includes('schools') && (
                            <div className="nh-stat" style={{ '--stat-color': '#3B82F6' }}>
                                <GraduationCap size={16} />
                                <span>{pois.schools.length} escuelas cercanas</span>
                            </div>
                        )}
                        {activeLayers.includes('dining') && (
                            <div className="nh-stat" style={{ '--stat-color': '#F59E0B' }}>
                                <Utensils size={16} />
                                <span>{pois.dining.length} restaurantes</span>
                            </div>
                        )}
                        {activeLayers.includes('commute') && (
                            <div className="nh-stat" style={{ '--stat-color': '#8B5CF6' }}>
                                <Car size={16} />
                                <span>Downtown en {pois.commute[1]?.time}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* "Un Día Aquí" Timeline */}
            {activeTab === 'day' && (
                <div className="nh-day-view">
                    <p className="nh-day-intro">
                        Así podría lucir un día típico viviendo en <strong>{address}</strong>
                    </p>
                    <div className="nh-day-timeline">
                        {DAY_TIMELINE.map((item, i) => (
                            <div
                                key={i}
                                className={`nh-day-item animate-fadeInUp`}
                                style={{ animationDelay: `${0.08 * i}s` }}
                            >
                                <div className="nh-day-time">{item.time}</div>
                                <div className="nh-day-dot">
                                    <span
                                        className="nh-day-dot-inner"
                                        style={{
                                            background: item.category === 'home'
                                                ? '#E31E24'
                                                : LAYER_CONFIG[item.category]?.color || '#6B7280'
                                        }}
                                    />
                                    {i < DAY_TIMELINE.length - 1 && <div className="nh-day-line" />}
                                </div>
                                <div className="nh-day-content">
                                    <span className="nh-day-emoji">{item.emoji}</span>
                                    <span className="nh-day-activity">{item.activity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
