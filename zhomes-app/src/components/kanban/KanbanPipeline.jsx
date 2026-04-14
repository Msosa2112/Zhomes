import { useState } from 'react'
import { MapPin, FileText, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import './KanbanPipeline.css'

const COLUMNS = [
    { key: 'under_contract', label: 'Bajo Contrato', color: 'var(--text-secondary)', emoji: '' },
    { key: 'inspection', label: 'Inspección', color: 'var(--text-secondary)', emoji: '' },
    { key: 'appraisal', label: 'Tasación', color: '#F97316', emoji: '' },
    { key: 'pre_close', label: 'Pre-Cierre', color: '#10B981', emoji: '' },
    { key: 'closed', label: 'Cerrada', color: '#06B6D4', emoji: '' },
    { key: 'paid', label: 'Pagada', color: '#22C55E', emoji: '' },
]

const INITIAL_CARDS = [
    { id: 1, address: '8708 Denise Dr', city: 'Louisville, KY', price: '$425,000', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '3/7', status: 'under_contract', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200' },
    { id: 2, address: '4411 Lambert Rd', city: 'Louisville, KY', price: '$289,000', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', docs: '2/7', status: 'under_contract', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200' },
    { id: 3, address: '2215 Tremont Dr', city: 'Louisville, KY', price: '$567,000', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', docs: '5/7', status: 'under_contract', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200' },
    { id: 4, address: '9320 Galene Dr', city: 'Louisville, KY', price: '$199,000', realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png', docs: '4/7', status: 'inspection', image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200' },
    { id: 5, address: '1850 Lakewood Hills', city: 'Prospect, KY', price: '$715,000', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '6/7', status: 'pre_close', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200' },
    { id: 6, address: '3744 Springhurst Blvd', city: 'Louisville, KY', price: '$345,000', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', docs: '7/7', status: 'closed', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=200' },
    { id: 7, address: '220 River Rd', city: 'Anchorage, KY', price: '$899,000', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', docs: '7/7', status: 'paid', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200' },
    { id: 8, address: '7821 Norbourne Ave', city: 'St. Matthews, KY', price: '$489,000', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '1/7', status: 'inspection', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200' },
]

export default function KanbanPipeline() {
    const [cards, setCards] = useState(INITIAL_CARDS)
    const [dragCard, setDragCard] = useState(null)
    const [dragOverCol, setDragOverCol] = useState(null)

    const handleDragStart = (e, card) => {
        setDragCard(card)
        e.dataTransfer.effectAllowed = 'move'
        setTimeout(() => e.target.classList.add('dragging'), 0)
    }

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging')
        setDragCard(null)
        setDragOverCol(null)
    }

    const handleDragOver = (e, colKey) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverCol(colKey)
    }

    const handleDragLeave = () => setDragOverCol(null)

    const handleDrop = (e, colKey) => {
        e.preventDefault()
        if (dragCard && dragCard.status !== colKey) {
            setCards(prev => prev.map(c =>
                c.id === dragCard.id ? { ...c, status: colKey } : c
            ))
        }
        setDragCard(null)
        setDragOverCol(null)
    }

    const scrollRow = (rowKey, dir) => {
        const el = document.querySelector(`[data-row="${rowKey}"]`)
        if (el) el.scrollBy({ left: dir * 220, behavior: 'smooth' })
    }

    const totalValue = cards.reduce((sum, c) => sum + parseInt(c.price.replace(/[$,]/g, '')), 0)

    return (
        <div className="kanban-section">
            <div className="kanban-header">
                <div>
                    <h2 className="kanban-title">Pipeline de Transacciones</h2>
                    <p className="kanban-subtitle">{cards.length} transacciones · ${(totalValue / 1000000).toFixed(1)}M en pipeline</p>
                </div>
            </div>

            <div className="kanban-rows">
                {COLUMNS.map(col => {
                    const colCards = cards.filter(c => c.status === col.key)
                    const isOver = dragOverCol === col.key
                    const colValue = colCards.reduce((sum, c) => sum + parseInt(c.price.replace(/[$,]/g, '')), 0)

                    return (
                        <div
                            key={col.key}
                            className={`kanban-row ${isOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleDragOver(e, col.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.key)}
                        >
                            {/* Row header (left side) */}
                            <div className="kanban-row-header">
                                <span className="kanban-row-dot" style={{ background: col.color }}></span>
                                <div className="kanban-row-info">
                                    <span className="kanban-row-name">{col.emoji} {col.label}</span>
                                    <span className="kanban-row-meta">
                                        <span className="kanban-row-count">{colCards.length}</span>
                                        <span className="kanban-row-value">${(colValue / 1000).toFixed(0)}K</span>
                                    </span>
                                </div>
                            </div>

                            {/* Horizontal scrollable cards */}
                            <div className="kanban-row-cards-wrapper">
                                {colCards.length > 2 && (
                                    <button className="scroll-btn scroll-btn-left" onClick={() => scrollRow(col.key, -1)}>
                                        <ChevronLeft size={16} />
                                    </button>
                                )}
                                <div className="kanban-row-cards" data-row={col.key}>
                                    {colCards.map(card => (
                                        <div
                                            key={card.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, card)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="kanban-card-img">
                                                <img src={card.image} alt="" loading="lazy" />
                                                <span className="kanban-card-price">{card.price}</span>
                                            </div>
                                            <div className="kanban-card-body">
                                                <div className="kanban-card-address">{card.address}</div>
                                                <div className="kanban-card-city">
                                                    <MapPin size={10} />
                                                    {card.city}
                                                </div>
                                                <div className="kanban-card-footer">
                                                    <div className="kanban-card-realtor">
                                                        <img src={card.avatar} alt="" />
                                                        <span>{card.realtor}</span>
                                                    </div>
                                                    <div className="kanban-card-docs">
                                                        <FileText size={10} />
                                                        {card.docs}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {colCards.length === 0 && (
                                        <div className="kanban-empty">Arrastra aquí</div>
                                    )}
                                </div>
                                {colCards.length > 2 && (
                                    <button className="scroll-btn scroll-btn-right" onClick={() => scrollRow(col.key, 1)}>
                                        <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
