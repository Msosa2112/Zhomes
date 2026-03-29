import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AddressAutocomplete.css';

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className = '' }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(false);

    const wrapperRef = useRef(null);
    const debounceTimeout = useRef(null);
    const autocompleteService = useRef(null);

    // Sync external value
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load Google Maps API Script
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.warn("VITE_GOOGLE_MAPS_API_KEY is not defined in .env");
            setApiError(true);
            return;
        }

        if (window.google) return; // Ya está cargado

        const existingScript = document.getElementById('googleMapsScript');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.id = 'googleMapsScript';
            document.body.appendChild(script);
        }
    }, []);

    const fetchAddresses = (text) => {
        if (!text || text.trim().length < 3) {
            setResults([]);
            setLoading(false);
            return;
        }

        if (!window.google) {
            // Reintentar si el script apenas está cargando
            setTimeout(() => fetchAddresses(text), 1000);
            return;
        }

        setLoading(true);

        if (!autocompleteService.current) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }

        // Configuración para priorizar y restringir a US
        const request = {
            input: text,
            componentRestrictions: { country: "us" },
        };

        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
                setResults([]);
                setLoading(false);
                return;
            }
            
            // Format results seamlessly for our UI
            const formatted = predictions.map(p => ({
                id: p.place_id,
                label: p.description
            })).slice(0, 5); // Limit limit to Top 5 matches

            setResults(formatted);
            setLoading(false);
        });
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (onChange) onChange(val);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (val.trim().length >= 3) {
            setShowDropdown(true);
            setLoading(true);
            debounceTimeout.current = setTimeout(() => {
                fetchAddresses(val);
            }, 600); // 600ms debounce to save API requests quota
        } else {
            setShowDropdown(false);
            setResults([]);
        }
    };

    const handleSelect = (addressLabel) => {
        setQuery(addressLabel);
        setShowDropdown(false);
        if (onChange) onChange(addressLabel);
        if (onSelect) onSelect(addressLabel);
    };

    return (
        <div className={`address-autocomplete ${className}`} ref={wrapperRef}>
            <div className="aa-input-wrapper">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if (query.trim().length >= 3) setShowDropdown(true); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (showDropdown && results.length > 0) {
                                handleSelect(results[0].label);
                            } else {
                                if (onSelect) onSelect(query);
                            }
                        }
                    }}
                    placeholder={placeholder || t('home.searchPlaceholder') || "Buscar por dirección o ciudad..."}
                />
                {loading && (
                    <div className="aa-loader">
                        <Loader2 size={16} className="spinner" />
                    </div>
                )}
            </div>

            {apiError && showDropdown && (
                <ul className="aa-dropdown">
                    <li className="aa-loading-state" style={{ color: 'var(--zhomes-red)' }}>
                        Falta API Key de Google Maps
                    </li>
                </ul>
            )}

            {!apiError && showDropdown && (results.length > 0 || loading) && (
                <ul className="aa-dropdown">
                    {loading && results.length === 0 && (
                        <li className="aa-loading-state">Buscando en Google...</li>
                    )}
                    {!loading && results.length > 0 && results.map((r, i) => (
                        <li key={`${r.id}-${i}`} onClick={() => handleSelect(r.label)}>
                            <MapPin size={16} className="aa-icon" />
                            <span className="aa-text">{r.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
