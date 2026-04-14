export default function PrivacyPolicyPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'system-ui, sans-serif', padding: '40px 20px', lineHeight: '1.6' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>Privacy Policy</h1>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>1. Information We Collect</h2>
                        <p>We collect information that you provide directly to us, including when you create an account, update your profile, submit forms, or communicate with us. This may include your name, email address, phone number, real estate preferences, and other details necessary to facilitate property showings and real estate transactions.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>2. SMS and Text Messaging</h2>
                        <p>If you consent to receive SMS text messages from ZHomes Real Estate LLC, we will use your phone number to send you appointment confirmations, transaction updates, and responses to your inquiries.</p>
                        <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginTop: '12px', borderRadius: '4px' }}>
                            <strong style={{ display: 'block', color: '#991b1b', marginBottom: '8px' }}>Important Mobile Information Protection:</strong>
                            <p style={{ margin: 0, color: '#7f1d1d' }}>No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</p>
                        </div>
                        <p style={{ marginTop: '12px' }}>You can opt out of SMS messages at any time by replying "STOP" to any message you receive from us.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>3. How We Use Your Information</h2>
                        <p>We use the information we collect to operate, maintain, and improve our services; to communicate with you regarding your real estate inquiries; to schedule and confirm property showings; and to provide you with customer support.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>4. Security</h2>
                        <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>5. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us via our official website or client portal support.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
