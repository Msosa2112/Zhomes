import { useState } from 'react'

export default function TwilioOptInPage() {
    const [agreed, setAgreed] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    return (
        <div style={{ height: '100vh', width: '100vw', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ maxWidth: '450px', width: '100%', margin: '40px auto', padding: '32px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>ZHomes Real Estate</h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Contact an Agent</p>
                </div>

                {!submitted ? (
                    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Full Name</label>
                            <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="John Doe" />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Phone Number</label>
                            <input type="tel" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="(555) 123-4567" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '24px', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', borderLeft: '3px solid #111827' }}>
                            <input 
                                type="checkbox" 
                                id="smsConsent"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                style={{ marginTop: '2px', cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                            <label htmlFor="smsConsent" style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5', cursor: 'pointer' }}>
                                By checking this box and submitting this form, you actively consent to receive SMS text messages from ZHomes Real Estate LLC regarding your inquiry and properties. Reply STOP to opt out. Message and data rates may apply. <br/><br/>
                                <a href="https://zhomesre.com/#privacy" style={{ color: '#E31E24', textDecoration: 'underline' }}>View Privacy Policy</a>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={!agreed}
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                backgroundColor: agreed ? '#111827' : '#9ca3af', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '16px', 
                                fontWeight: 'bold',
                                cursor: agreed ? 'pointer' : 'not-allowed',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Request Contact
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ width: '56px', height: '56px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>✓</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>Request received!</h3>
                        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>We will contact you shortly.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
