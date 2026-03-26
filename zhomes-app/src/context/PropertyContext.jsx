import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_PROPERTIES } from '../data/mockData'
import { SparkService } from '../services/sparkService'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

// Sample ZHomes exclusive & off-market properties for the demo
const ZHOMES_SAMPLE_PROPERTIES = [
    {
        id: 'zh-001', address: '2345 Bardstown Rd, Louisville, KY 40205',
        price: 425000, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'],
        beds: 4, baths: 3, sqft: 2850, type: 'Single Family', description: 'Stunning ZHomes exclusive listing on Bardstown Road.',
        lat: 38.2280, lng: -85.7050, exclusive: true, city: 'Louisville', status: 'Active', listOfficeName: 'ZHomes Realty'
    },
    {
        id: 'zh-002', address: '890 Cherokee Pkwy, Louisville, KY 40204',
        price: 575000, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
        images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600'],
        beds: 5, baths: 4, sqft: 3600, type: 'Single Family', description: 'Cherokee Park beauty. ZHomes managed luxury property.',
        lat: 38.2190, lng: -85.7200, exclusive: true, city: 'Louisville', status: 'Active', listOfficeName: 'ZHomes Realty'
    },
    {
        id: 'zh-003', address: '1500 River Rd, Louisville, KY 40206',
        price: 890000, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600',
        images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600'],
        beds: 6, baths: 5, sqft: 4500, type: 'Single Family', description: 'Riverfront mansion. ZHomes premium listing.',
        lat: 38.2680, lng: -85.7350, exclusive: true, city: 'Louisville', status: 'Active', listOfficeName: 'ZHomes Realty'
    },
    {
        id: 'zh-off-001', address: '456 S 4th St, Louisville, KY 40202',
        price: 320000, image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600',
        images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600'],
        beds: 3, baths: 2, sqft: 1800, type: 'Condo', description: 'Downtown condo. Previously listed with ZHomes.',
        lat: 38.2530, lng: -85.7580, exclusive: false, city: 'Louisville', status: 'Closed', listOfficeName: 'ZHomes Realty'
    },
    {
        id: 'off-001', address: '7890 Hurstbourne Pkwy, Louisville, KY 40222',
        price: 289000, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600',
        images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'],
        beds: 3, baths: 2, sqft: 1650, type: 'Single Family', description: 'Recently sold home in Hurstbourne.',
        lat: 38.2340, lng: -85.5950, exclusive: false, city: 'Louisville', status: 'Closed', listOfficeName: 'Remax'
    },
    {
        id: 'off-002', address: '3210 Frankfort Ave, Louisville, KY 40206',
        price: 195000, image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600',
        images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'],
        beds: 2, baths: 1, sqft: 1200, type: 'Single Family', description: 'Off-market property in Frankfort Ave corridor.',
        lat: 38.2490, lng: -85.6900, exclusive: false, city: 'Louisville', status: 'Pending', listOfficeName: 'Keller Williams'
    }
]

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'

export function PropertiesProvider({ children }) {
    // Initialize with normalized mock data
    const normalizedMock = MOCK_PROPERTIES.map(p => ({
        ...p, id: String(p.id), images: p.images || [p.image],
        status: p.status || 'Active', exclusive: p.exclusive || false
    }))

    const [properties, setProperties] = useState(normalizedMock)
    const [loading, setLoading] = useState(true)

    // Fetch real properties from Spark RESO Web API v3
    useEffect(() => {
        async function fetchFromSpark() {
            try {
                const data = await SparkService.getActiveListings("MlsStatus eq 'Active'", 100);
                const results = data?.value || data?.D?.Results || [];
                if (results.length > 0) {
                    const formattedProps = results.map(p => {
                        const isZhomes = String(p.ListOfficeName || '').toLowerCase().includes('zhomes');
                        // Extract photo URLs from Media array (RESO v3)
                        const mediaPhotos = (p.Media || [])
                            .map(m => m.MediaURL)
                            .filter(Boolean);
                        const primaryPhoto = mediaPhotos[0] || PLACEHOLDER_IMG;
                        
                        return {
                            id: String(p.ListingKey || p.ListingId || p.Id || Math.random()),
                            address: p.UnparsedAddress || 'Dirección no disponible',
                            price: p.ListPrice || p.OriginalListPrice || 0,
                            image: primaryPhoto,
                            images: mediaPhotos.length > 0 ? mediaPhotos : [PLACEHOLDER_IMG],
                            beds: p.BedsTotal || p.BedroomsTotal || 0,
                            baths: p.BathroomsTotalInteger || p.BathroomsFull || 0,
                            sqft: p.LivingArea || p.BuildingAreaTotal || 0,
                            type: p.PropertySubType || p.PropertyType || 'Property',
                            description: p.PublicRemarks || '',
                            lat: p.Latitude || null,
                            lng: p.Longitude || null,
                            exclusive: isZhomes,
                            city: p.City || '',
                            status: p.MlsStatus || p.StandardStatus || 'Active',
                            listOfficeName: p.ListOfficeName || ''
                        }
                    })
                    // Merge real data with ZHomes sample & off-market sample properties
                    const allProperties = [...ZHOMES_SAMPLE_PROPERTIES, ...formattedProps]
                    setProperties(allProperties)
                    console.log("✅ Loaded", formattedProps.length, "REAL +", ZHOMES_SAMPLE_PROPERTIES.length, "sample properties")
                } else {
                    console.warn("⚠️ Spark returned 0 results, adding ZHomes samples to mock")
                    setProperties([...ZHOMES_SAMPLE_PROPERTIES, ...normalizedMock])
                }
            } catch (err) {
                console.warn("⚠️ Spark API error, using mock + samples:", err.message)
                setProperties([...ZHOMES_SAMPLE_PROPERTIES, ...normalizedMock])
            } finally {
                setLoading(false)
            }
        }
        fetchFromSpark()
    }, [])

    const addProperty = (newProperty) => {
        const newId = Math.max(...properties.map(p => Number(p.id) || 0), 0) + 1
        const propertyWithId = {
            id: String(newId), ...newProperty,
            exclusive: false, images: newProperty.images || [newProperty.image],
            postedAt: new Date().toISOString()
        }
        setProperties(prev => [propertyWithId, ...prev])
        return propertyWithId
    }

    return (
        <PropertyContext.Provider value={{ properties, loading, addProperty }}>
            {children}
        </PropertyContext.Provider>
    )
}
