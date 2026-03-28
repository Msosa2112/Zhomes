import { useState } from 'react'
import { Brain, TrendingUp, Users, Target, Activity, AlertCircle, CheckCircle2, ChevronRight, X, Plus, Trash2, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import './DashboardPageMobile.css'

export default function DashboardPageMobile() {
    // AI Knowledge Base State
    const [showRules, setShowRules] = useState(false)
    const [newRule, setNewRule] = useState('')
    const [rules, setRules] = useState([
        "El documento DEBE incluir firma del comprador en página 3.",
        "El SSN debe estar visible."
    ])
    
    // Testing state
    const [testingRule, setTestingRule] = useState(false)
    const [testResult, setTestResult] = useState(null)

    const handleAddRule = () => {
        if (newRule.trim()) {
            setRules([...rules, newRule.trim()])
            setNewRule('')
        }
    }

    const handleDeleteRule = (index) => {
        setRules(rules.filter((_, i) => i !== index))
    }

    const handleTestRule = async () => {
        setTestingRule(true)
        setTestResult(null)
        try {
            const mockDoc = "Página 1: Contrato de compra-venta.\nPágina 2: Condiciones.\nPágina 3: [Firma pendiente].\nSSN comprador: 000-XX-0000"
            const response = await fetch('/api/zhomes-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'broker_compliance', 
                    data: { 
                        documentText: mockDoc,
                        rules: rules.map(r => ({ text: r }))
                    } 
                })
            })
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setTestResult(data)
        } catch (err) {
            alert("Error IA: " + err.message)
        } finally {
            setTestingRule(false)
        }
    }

    return (
        <>
            <div className="mobile-dash-page">
                <div className="mobile-dash-header">
                    <h2>Hola, Gilbert 👋</h2>
                    <p>Aquí tienes el estado de tu agencia.</p>
                </div>

                <div className="mobile-quick-actions">
                    <Link to="/analytics" className="m-quick-btn">
                        <div className="mq-icon"><TrendingUp size={24} /></div>
                        <span>Analytics</span>
                    </Link>
                    <Link to="/equipo" className="m-quick-btn">
                        <div className="mq-icon"><Users size={24} /></div>
                        <span>Equipo</span>
                    </Link>
                </div>

                <div className="m-ai-widget" onClick={() => setShowRules(true)} style={{ cursor: 'pointer' }}>
                    <div className="mai-head" style={{ justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Brain size={18} /> ZhomesAI Compliance</span>
                        <ChevronRight size={18} />
                    </div>
                    <p>Tu asistente de revisión tiene <strong>{rules.length} reglas activas</strong> para auditar contratos. Toca para entrenarlo.</p>
                </div>

                <div className="m-kpi-scroller">
                    <div className="mk-card">
                        <TrendingUp size={20} className="kblue" />
                        <span>Revenue</span>
                        <strong>$1.2M</strong>
                    </div>
                    <div className="mk-card">
                        <Target size={20} className="kgreen" />
                        <span>Cierres</span>
                        <strong>28</strong>
                    </div>
                    <div className="mk-card">
                        <Users size={20} className="kviolet" />
                        <span>Agentes</span>
                        <strong>12</strong>
                    </div>
                </div>

                <div className="m-dash-section">
                    <h3>Ventas Activas (Pipeline)</h3>
                    <div className="m-pipeline-list">
                        <div className="m-pipe-row">
                            <span className="pname">Bajo Contrato</span>
                            <div className="pbar"><div style={{ width: '60%', background: '#8B5CF6' }}></div></div>
                            <span className="pcount">5 deals</span>
                        </div>
                        <div className="m-pipe-row">
                            <span className="pname">Inspección</span>
                            <div className="pbar"><div style={{ width: '30%', background: '#F59E0B' }}></div></div>
                            <span className="pcount">3 deals</span>
                        </div>
                        <div className="m-pipe-row">
                            <span className="pname">Pre-Cierre</span>
                            <div className="pbar"><div style={{ width: '15%', background: '#10B981' }}></div></div>
                            <span className="pcount">2 deals</span>
                        </div>
                    </div>
                </div>

                <div className="m-dash-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Brain size={18} color="var(--zhomes-red)" /> Reporte IA (Ayer)
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>8:00 AM</span>
                </div>
                <div className="m-pipeline-list">
                    <div className="m-pipe-row" style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--zhomes-red)' }}>
                        <div style={{ flex: 1 }}>
                            <span className="pname" style={{ color: 'var(--zhomes-red)' }}>Contrato Tremont Dr.</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                                Falla Regla: "El SSN debe estar visible" (Realtor: Carlos M.)
                            </span>
                        </div>
                    </div>
                    <div className="m-pipe-row" style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10B981' }}>
                        <div style={{ flex: 1 }}>
                            <span className="pname" style={{ color: '#10B981' }}>Impuestos 1045 Oak St.</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                                Cumple todas las reglas activas.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Alertas Manuales <span className="m-badge-red">2</span></h3>
                <div className="m-alerts-list">
                    <div className="m-alert">
                        <AlertCircle size={16} color="#EF4444" />
                        <p>Falta tasación en 2215 Tremont Dr.</p>
                    </div>
                    <div className="m-alert">
                        <AlertCircle size={16} color="#F59E0B" />
                        <p>Nuevo empleado: Miriam C. espera asginación de equipo.</p>
                    </div>
                </div>
            </div>
            </div>

            {/* AI Rules Modal (Knowledge Base) */}
            {showRules && (
                <div className="mai-rules-overlay" onClick={() => setShowRules(false)}>
                    <div className="mai-rules-content" onClick={e => e.stopPropagation()}>
                        <div className="mai-rules-header">
                            <h2><Brain size={24} color="var(--zhomes-red)" /> Entrenar ZhomesAI</h2>
                            <button className="mai-rules-close" onClick={() => setShowRules(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mai-rules-body">
                            <p>Escribe aquí las reglas que quieres que la IA revise en cada documento que suban tus Realtors, antes de pasártelo a ti.</p>
                            
                            <div className="mai-rules-list">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className="mai-rule-card">
                                        <span>{rule}</span>
                                        <button className="mai-rule-delete" onClick={() => handleDeleteRule(idx)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mai-rule-add">
                                <textarea 
                                    className="mai-rule-input"
                                    placeholder="Ej: Rechaza el documento si no anexan los impuestos de 2024..."
                                    value={newRule}
                                    onChange={(e) => setNewRule(e.target.value)}
                                />
                                <button 
                                    className="mai-btn-save" 
                                    disabled={!newRule.trim()}
                                    onClick={handleAddRule}
                                >
                                    <Plus size={18} /> Añadir Regla
                                </button>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }} />

                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Probar Simulación</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>Simula subir un documento que no tiene firma en la página 3.</p>
                                
                                <button 
                                    className="up-btn outline" 
                                    style={{ width: '100%', borderColor: 'var(--zhomes-red)', color: 'var(--zhomes-red)' }}
                                    onClick={handleTestRule}
                                    disabled={testingRule}
                                >
                                    {testingRule ? 'Analizando...' : 'Ejecutar Auditoría IA'}
                                </button>
                            </div>

                            {testResult && (
                                <div style={{ background: testResult.allPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: `3px solid ${testResult.allPassed ? '#10B981' : '#EF4444'}` }}>
                                    <h4 style={{ color: testResult.allPassed ? '#10B981' : '#EF4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {testResult.allPassed ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} 
                                        {testResult.allPassed ? 'Contrato Aprobado' : 'Contrato Rechazado'}
                                    </h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{testResult.report}</p>
                                </div>
                            )}

                            <button 
                                className="mai-btn-save" 
                                style={{ marginTop: '24px', background: 'var(--text-primary)' }}
                                onClick={() => { setShowRules(false); setTestResult(null); }}
                            >
                                <Save size={18} /> Guardar Conocimiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
