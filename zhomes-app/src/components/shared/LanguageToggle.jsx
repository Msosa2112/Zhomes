import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const isEnglish = i18n.language === 'en';

    const toggleLang = () => {
        const target = isEnglish ? 'es' : 'en';
        i18n.changeLanguage(target);
    };

    return (
        <button 
            className="m-theme-toggle" 
            onClick={toggleLang} 
            title={isEnglish ? "Ver en Español" : "Translate to English"}
            style={{ 
                background: isEnglish ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(10px)', 
                borderRadius: '50%', 
                border: '1px solid rgba(255,255,255,0.1)', 
                display: 'flex', 
                padding: '8px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
            }}
        >
            <Globe size={18} color="white" />
        </button>
    );
}
