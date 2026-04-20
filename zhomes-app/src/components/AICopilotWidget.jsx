import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Share, Loader2, Maximize2, Minimize2, Home } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './AICopilotWidget.css'; // Import the new CSS

export default function AICopilotWidget({ transactionId, onForwardToClient }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // fullscreen mode
  const [activeTxId, setActiveTxId] = useState(transactionId);
  const [availableDeals, setAvailableDeals] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: transactionId
        ? 'Soy tu copiloto de ZHomes AI. Conozco todos los documentos y contexto de este trato. ¿En qué te puedo ayudar hoy?'
        : 'Soy tu copiloto de ZHomes AI. ¿Sobre qué transacción quieres consultar hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!transactionId && isOpen && availableDeals.length === 0) {
      const fetchDeals = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const email = session.user.email;
        const role = session.user.user_metadata?.role || 'realtor';

        let query = supabase.from('tc_transactions').select('id, address').not('status', 'in', '("closed","cancelled")').order('created_at', { ascending: false });
        if (role === 'realtor') {
            query = query.eq('realtor_id', session.user.id);
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching deals for Copilot:', error);
        }
        if (data) setAvailableDeals(data);
      };
      fetchDeals();
    } else if (transactionId) {
      setActiveTxId(transactionId);
    }
  }, [transactionId, isOpen, availableDeals.length]);

  const handleSend = async () => {
    if (!input.trim() || !activeTxId) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message
    const newUserMsg = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/zhomes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deal_query',
          data: { query: userText, transactionId: activeTxId }
        })
      });

      const json = await res.json();
      
      const aiResponse = json.answer || "No pude encontrar una respuesta en los documentos.";
      let finalResponse = aiResponse;
      if (json.citations && json.citations.length > 0) {
        finalResponse += `\n\n📌 Fuente: ${json.citations.join(', ')}`;
      }

      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', text: finalResponse }
      ]);
    } catch (err) {
      console.error("AI Copilot Error:", err);
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', text: "Error de red. Asegúrate de tener conexión y de que existen documentos indexados." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForward = async (text) => {
    if (onForwardToClient) {
      onForwardToClient(text);
    } else {
      if (!activeTxId) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const senderName = user?.user_metadata?.full_name || user?.email || 'Agente';
        const senderRole = user?.user_metadata?.role || 'realtor';
  
        await supabase.from('tc_messages').insert({
          transaction_id: activeTxId,
          sender_id:      user?.id,
          sender_name:    'ZHomes AI',
          sender_role:    'system',
          content:        `✨ Resumen Automático:\n\n${text}`,
          message_type:   'document_update',
        });
        alert("Enviado al chat del cliente exitosamente.");
      } catch (err) {
        console.error('[Copilot] Error reenviando mensaje de IA:', err);
        alert("Error al reenviar el mensaje.");
      }
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="ai-copilot-fab"
        title="Open ZHomes AI Copilot"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className={`ai-copilot-container ${isExpanded ? 'expanded' : 'windowed'}`}>
      
      {/* Header */}
      <div className="ai-copilot-header">
        <div className="ai-copilot-title">
          <Bot size={20} />
          <span>Copiloto de IA Privado</span>
        </div>
        <div className="ai-copilot-actions">
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="ai-chat-area">
        {messages.map(m => (
          <div key={m.id} className={`ai-msg-wrapper ${m.role}`}>
            <div className={`ai-msg-bubble ${m.role}`}>
              {m.text}
            </div>
            
            {/* Si es respuesta de máquina, mostramos botón de transferir */}
            {m.role === 'assistant' && m.id !== 'welcome' && (
              <button
                className="ai-forward-btn"
                onClick={() => handleForward(m.text)}
              >
                <Share size={12} /> Reenviar a Cliente
              </button>
            )}

            {m.id === 'welcome' && !activeTxId && availableDeals.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', width: '100%' }}>
                    {availableDeals.map(deal => (
                        <button 
                            key={deal.id} 
                            className="ai-deal-btn"
                            onClick={() => {
                                setActiveTxId(deal.id);
                                const selectionMsg = { id: Date.now().toString(), role: 'user', text: `Quiero consultar sobre: ${deal.address}` };
                                setMessages(prev => [...prev, selectionMsg]);
                                
                                setTimeout(() => {
                                    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: `Perfecto. Ya tengo el contexto de ${deal.address}. ¿Qué necesitas saber?` }]);
                                }, 600);
                            }}
                        >
                            <Home size={14} /> {deal.address}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-typing-indicator">
            <Loader2 size={16} className="animate-spin" /> Analizando documentos...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="ai-input-area">
        <input
          type="text"
          placeholder="Pregúntale a los documentos..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`ai-send-btn ${input.trim() && !isLoading ? 'active' : 'disabled'}`}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
