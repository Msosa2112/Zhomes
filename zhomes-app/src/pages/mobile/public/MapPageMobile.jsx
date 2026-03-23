import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import { SparkService } from '../../../services/sparkService'
import { useTheme } from '../../../context/ThemeContext'
import { Bed, Bath, Expand } from 'lucide-react'
import './MapPageMobile.css'

// Custom marker matching "logo mostrando cuales son" properties from Zhomes
const zhomesLogoMarker = new L.Icon({
    iconUrl: '/assets/logo/fav.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    className: 'zhomes-custom-marker'
});

const genericMarker = new L.divIcon({
    html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4))">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E31E24" stroke="none" width="32" height="32">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
               <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
             </svg>
           </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Fix to clear map layout size when transitioning pages
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

    // Default center to Louisville, KY based on mock data address locations
    const centerPosition = [38.2180, -85.6580];

    const [properties, setProperties] = useState([]);

    useEffect(() => {
        SparkService.getActiveListings("MlsStatus Eq 'Active'", 50)
            .then(data => {
                const results = data.D?.Results;
                if (results && results.length > 0) {
                    setProperties(results.map(p => ({
                        id: String(p.Id),
                        address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                        price: p.StandardFields.ListPrice || 0,
                        image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                        beds: p.StandardFields.BedsTotal || 0,
                        baths: p.StandardFields.BathsTotal || 0,
                        sqft: p.StandardFields.BuildingAreaTotal || 0,
                        lat: p.StandardFields.Latitude || (38.15 + (Math.random() * 0.1)),
                        lng: p.StandardFields.Longitude || (-85.7 + (Math.random() * 0.1)),
                        title: p.StandardFields.UnparsedAddress,
                        exclusive: false
                    })));
                } else {
                    throw new Error("No data returned from Spark API");
                }
            })
            .catch(err => {
                console.warn("Spark API Failed (App Pending Approval). Falling back to mock data.", err);
                setProperties((MOCK_PROPERTIES || []).map(p => {
                    const lat = Number(p.lat);
                    const lng = Number(p.lng);
                    return {
                        ...p,
                        lat: !isNaN(lat) ? lat : (38.15 + ((p.id || 0) * 0.012)),
                        lng: !isNaN(lng) ? lng : (-85.7 + ((p.id || 0) * 0.015)),
                        price: p.price || 0
                    }
                }));
            });
    }, []);

    // Selection of tiles depending on theme
    const tileUrl = theme === 'light' 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    return (
        <div className={`mobile-map-page animate-fadeInUp ${theme}`}>
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
                
                {properties.map(p => (
                    <Marker 
                        key={p.id} 
                        position={[p.lat, p.lng]} 
                        // Using zhomes logo strictly for exclusive ones or all? Instructions: "Zhomes properties with logo". So we apply to all or only exclusive. Let's do all, but make exclusive larger? Let's use logo for exclusive=true
                        icon={p.exclusive ? zhomesLogoMarker : genericMarker}
                    >
                        <Popup className="zhomes-map-popup" closeButton={false}>
                            <div className="map-prop-content">
                                <img src={p.image || p.images?.[0]} alt={p.title} className="map-prop-img" />
                                <div className="map-prop-info">
                                    <h3>{p.address}</h3>
                                    <p className="map-price">${p.price.toLocaleString()}</p>
                                    
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
            </MapContainer>
        </div>
    )
}
