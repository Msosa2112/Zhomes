import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_PROPERTIES } from '../data/mockData'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

export function PropertiesProvider({ children }) {
    // Initialize with mock data
    const [properties, setProperties] = useState(MOCK_PROPERTIES)

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
        addProperty
    }

    return (
        <PropertyContext.Provider value={value}>
            {children}
        </PropertyContext.Provider>
    )
}
