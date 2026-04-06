import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import RealtorRevealModal from '../components/public/RealtorRevealModal';

const AgentContext = createContext();

export function useAgent() {
    return useContext(AgentContext);
}

export function AgentProvider({ children }) {
    const [activeAgent, setActiveAgent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalOpts, setModalOpts] = useState({ openDirectly: false, initialIndex: undefined });
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);

    const loadAgentFromId = async (agentId) => {
        try {
            const { data } = await supabase
                .from('zhomes_agents')
                .select('id, full_name, first_name, last_name, email, phone, bio, status, photo_url, video')
                .eq('id', agentId)
                .maybeSingle();

            if (data) {
                setActiveAgent({
                    ...data,
                    name: data.full_name,
                    photo: data.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=E31E24&color=fff&size=200&bold=true`
                });
            }
        } catch (err) {
            console.error('Context error loading agent:', err);
        }
    };

    useEffect(() => {
        const initAgent = async () => {
            setIsGlobalLoading(true);
            const localId = localStorage.getItem('zhomes_my_agent');
            const { data } = await supabase.auth.getSession();
            const mdId = data?.session?.user?.user_metadata?.assigned_realtor_id;

            const finalId = mdId || localId;
            if (finalId) {
                localStorage.setItem('zhomes_my_agent', finalId);
                await loadAgentFromId(finalId);
            }
            setIsGlobalLoading(false);
        };
        initAgent();
    }, []);

    useEffect(() => {
        // Enforce Selection globally: if completely signed in (not demo) but no agent exists, pop the modal
        const checkEnforcement = async () => {
            const { data } = await supabase.auth.getSession();
            const localId = localStorage.getItem('zhomes_my_agent');
            // If completely logged in as real user but they lack an agent, force open
            if (data?.session && !localId && !isGlobalLoading) {
                // To avoid blocking them completely from looking at houses initially, 
                // we ONLY enforce if they explicitly try to book. BUT if they load profile, we can pop it.
                // Decided to handle strict blocking locally on Action Buttons (Schedule) 
                // rather than taking over the screen randomly on startup.
            }
        };
        checkEnforcement();
    }, [isGlobalLoading]);

    const openAgentModal = (options = {}) => {
        setModalOpts(options);
        setIsModalOpen(true);
    };
    const closeAgentModal = () => setIsModalOpen(false);

    const selectAgent = async (agent) => {
        setActiveAgent({
            ...agent,
            name: agent.full_name || agent.name,
            photo: agent.photo_url || agent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name || agent.name)}&background=E31E24&color=fff&size=200&bold=true`
        });
        localStorage.setItem('zhomes_my_agent', agent.id);
        
        // Save to supabase metadata if logged in
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
            await supabase.auth.updateUser({
                data: { assigned_realtor_id: agent.id }
            });
        }
        
        // Triggers N8N over HTTPS conceptually
        try {
            const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL_REALTOR_MATCH || 'https://n8n-production-cfe9c.up.railway.app/webhook/realtor-match';
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    event: 'realtor_match',
                    client_id: data?.session?.user?.id || 'demo-user',
                    client_email: data?.session?.user?.email || 'demo@zhomes.com',
                    client_phone: data?.session?.user?.user_metadata?.phone || '',
                    realtor_id: agent.id,
                    realtor_name: agent.name,
                    realtor_phone: agent.phone
                })
            }).catch(e => console.warn('[N8N] webhook failed, may be offline:', e));
        } catch (e) {
            console.error('[N8N] error firing hook', e)
        }

        setIsModalOpen(false);
    };

    return (
        <AgentContext.Provider value={{ activeAgent, openAgentModal, closeAgentModal, isGlobalLoading }}>
            {children}
            
            {/* Global Marvel Reel instance */}
            <RealtorRevealModal
                isOpen={isModalOpen}
                onClose={closeAgentModal}
                onSelect={selectAgent}
                openDirectly={modalOpts.openDirectly}
                initialIndex={modalOpts.initialIndex}
            />
        </AgentContext.Provider>
    );
}
