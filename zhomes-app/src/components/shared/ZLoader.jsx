import React from 'react';
import './ZLoader.css';

export default function ZLoader({ fullScreen = true, message = "Cargando..." }) {
    if (fullScreen) {
        return (
            <div className="zloader-fullscreen-overlay">
                <div className="zloader-content">
                    <div className="zloader-logo-wrapper">
                        <img 
                            src="/assets/logo/logo 1024x1024.png" 
                            alt="ZHomes Base" 
                            className="zloader-img zloader-base" 
                        />
                        <img 
                            src="/assets/logo/logo 1024x1024.png" 
                            alt="ZHomes Color" 
                            className="zloader-img zloader-color" 
                        />
                    </div>
                    {message && <div className="zloader-message">{message}</div>}
                </div>
            </div>
        );
    }

    // Inline version
    return (
        <div className="zloader-inline">
            <div className="zloader-logo-wrapper inline">
                <img 
                    src="/assets/logo/logo 1024x1024.png" 
                    alt="ZHomes Base" 
                    className="zloader-img zloader-base" 
                />
                <img 
                    src="/assets/logo/logo 1024x1024.png" 
                    alt="ZHomes Color" 
                    className="zloader-img zloader-color" 
                />
            </div>
        </div>
    );
}
