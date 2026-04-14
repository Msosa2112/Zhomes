import React, { useState, useEffect } from 'react';
import { Car, Loader2, MapPin, Search, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { CommuteService } from '../../services/commuteService';
import './CommuteIntel.css';

export default function CommuteIntel({ propertyAddress, propLat, propLng }) {
    const [locations, setLocations] = useState([]);
    const [commuteData, setCommuteData] = useState([]);
    const [loading, setLoading] = useState(false); // Initial loading is false for on-demand
    const [calculating, setCalculating] = useState(false); // Used when fetching logic
    const [error, setError] = useState(false);
    const [hasLocations, setHasLocations] = useState(true);
    const [hasCalculated, setHasCalculated] = useState(false);

    useEffect(() => {
        const checkSavedLocations = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setHasLocations(false);
                return;
            }

            const { data: savedLocs, error: fetchError } = await supabase
                .from('user_saved_locations')
                .select('*')
                .eq('user_id', session.user.id);

            if (fetchError || !savedLocs || savedLocs.length === 0) {
                setHasLocations(false);
                return;
            }
            setLocations(savedLocs);
        };
        checkSavedLocations();
    }, []);

    const handleCalculate = async () => {
        if (!propertyAddress || locations.length === 0) return;
        
        setCalculating(true);
        setError(false);

        // Make sure Google Maps script is loaded just in case, but CommuteService handles API Promise too.
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!window.google && apiKey) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.id = 'googleMapsScript';
            document.body.appendChild(script);
            await new Promise((res) => { script.onload = res; });
        }

        try {
            const results = await CommuteService.getCommuteTimes(propertyAddress, locations);
            setCommuteData(results);
            setHasCalculated(true);
        } catch (err) {
            console.error("Commute Calculation Error:", err);
            setError(true);
        } finally {
            setCalculating(false);
        }
    };

    if (!hasLocations) return null; // Don't show anything if zero locations

    return (
        <div className="commute-intel-card">
            <div className="commute-intel-header">
                <Car size={20} color="var(--text-secondary)" />
                <h3>Tiempos de Traslado</h3>
            </div>
            
            {!hasCalculated && !calculating && (
                <button className="commute-calc-btn" onClick={handleCalculate}>
                    Calcular rutas y tráfico <ChevronRight size={16} />
                </button>
            )}

            {calculating && (
                <div className="commute-shimmer-wrapper">
                    <div className="shimmer-item">
                        <div className="shimmer-icon"></div>
                        <div className="shimmer-lines">
                            <div className="shimmer-line s-long"></div>
                            <div className="shimmer-line s-short"></div>
                        </div>
                    </div>
                    <div className="shimmer-item">
                        <div className="shimmer-icon"></div>
                        <div className="shimmer-lines">
                            <div className="shimmer-line s-long"></div>
                            <div className="shimmer-line s-short"></div>
                        </div>
                    </div>
                </div>
            )}

            {hasCalculated && error && (
                <div className="commute-error">
                    No se pudieron calcular las rutas en este momento.
                </div>
            )}

            {hasCalculated && !error && (
                <div className="commute-list">
                    {commuteData.map((item, i) => (
                        <div key={item.id || i} className="commute-item">
                            <div className="commute-item-icon">
                                <MapPin size={16} />
                            </div>
                            <div className="commute-info-wrap">
                                <div className="commute-label">{item.label}</div>
                                {item.error ? (
                                    <div className="commute-addr error">Ruta no encontrada</div>
                                ) : (
                                    <div className="commute-addr">{item.address}</div>
                                )}
                            </div>
                            {!item.error && (
                                <div className="commute-stats">
                                    <div className="commute-time">{item.duration}</div>
                                    <div className="commute-dist">{item.distance}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
