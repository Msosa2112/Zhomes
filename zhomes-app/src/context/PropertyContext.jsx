import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_PROPERTIES } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

export function PropertiesProvider({ children }) {
    // Initialize with mock data to avoid flash of empty UI
    const [properties, setProperties] = useState(MOCK_PROPERTIES)
    const [loading, setLoading] = useState(true)

    // Fetch real properties from Supabase
    useEffect(() => {
        async function fetchFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .limit(100)

                if (error) throw error

                if (data && data.length > 0) {
                    const formattedProps = data.map(p => ({
                        id: p.id,
                        address: p.address,
                        price: p.price,
                        image: p.primary_photo,
                        images: Array.isArray(p.photos) ? p.photos.map(m => m.MediaURL) : [p.primary_photo],
                        beds: p.beds,
                        baths: p.baths,
                        sqft: p.sqft,
                        type: p.property_type,
                        description: p.description,
                        lat: p.latitude,
                        lng: p.longitude,
                        exclusive: false,
                        city: p.city
                    }))
                    setProperties(formattedProps)
                }
            } catch (err) {
                console.error("Error fetching properties from Supabase:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchFromSupabase()
    }, [])

    // Simulation of adding a property to DB
    const addProperty = (newProperty) => {
        // Generate a random ID (or find max ID + 1)
        const newId = Math.max(...properties.map(p => p.id), 0) + 1

        const propertyWithId = {
            id: newId,
            ...newProperty,
            // Defaults for mock if missing
            exclusive: false,
            images: newProperty.images || [newProperty.image], // Ensure array exists if single image passed
            postedAt: new Date().toISOString()
        }

        setProperties(prev => [propertyWithId, ...prev])
        return propertyWithId
    }

    const value = {
        properties,
        loading,
        addProperty
    }

    return (
        <PropertyContext.Provider value={value}>
            {children}
        </PropertyContext.Provider>
    )
}
