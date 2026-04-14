export default function TermsConditionsPage() {
    return (
        <div style={{ height: '100vh', width: '100vw', overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'system-ui, sans-serif', padding: '40px 20px', lineHeight: '1.6' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>Terms and Conditions</h1>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
                        <p>By using the ZHomes Real Estate progressive web application and services, you agree to these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>2. ZHomes Real Estate SMS Program</h2>
                        <p>When opted-in, you will receive text messages (SMS/MMS) to your mobile number regarding real estate inquiries, appointment confirmations, property updates, and transactional alerts.</p>
                        
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li><strong>Message Frequency:</strong> Message frequency varies depending on your interactions and active real estate transactions with us.</li>
                            <li><strong>Opt-Out Instructions:</strong> You can cancel the SMS service at any time. Just text "<strong>STOP</strong>" to the shortcode or number sending you the messages. After you send the SMS message "STOP" to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again.</li>
                            <li><strong>Help Instructions:</strong> If you are experiencing issues with the messaging program you can reply with the keyword "<strong>HELP</strong>" for more assistance, or you can get help directly by contacting our support agents via our web platform.</li>
                            <li><strong>Carrier Liability:</strong> Carriers are not liable for delayed or undelivered messages.</li>
                            <li><strong>Rates:</strong> As always, message and data rates may apply for any messages sent to you from us and to us from you. If you have any questions about your text plan or data plan, it is best to contact your wireless provider.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>3. Privacy</h2>
                        <p>If you have any questions regarding privacy, please read our Privacy Policy.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>4. Modification of Terms</h2>
                        <p>We may update these terms occasionally. Your continued use of the service constitutes acceptance of those changes.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
