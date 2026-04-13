import { useState, useEffect } from 'react'
import { MapPin, School, TreePine, Bus, Bike } from 'lucide-react'
import { WalkScoreService } from '../../services/walkScoreService'
import './NeighborhoodIntel.css'

export default function NeighborhoodIntel({ address, lat, lng }) {
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address || !lat || !lng) {
      setLoading(false)
      return
    }

    const fetchScores = async () => {
      setLoading(true)
      const data = await WalkScoreService.getScore(address, lat, lng)
      setScores(data)
      setLoading(false)
    }

    fetchScores()
  }, [address, lat, lng])

  if (loading) {
    return (
      <div className="ni-section">
        <h2> Vecindario</h2>
        <div className="ni-loading">
          <div className="ni-loading-dot"></div>
          <div className="ni-loading-dot"></div>
          <div className="ni-loading-dot"></div>
        </div>
      </div>
    )
  }

  // If no API key or no data, show placeholder with explanation
  if (!scores) {
    return (
      <div className="ni-section">
        <h2> Vecindario</h2>
        <div className="ni-placeholder">
          <div className="ni-score-cards">
            <ScoreCard icon={<MapPin size={18} />} label="Walk Score" score="—" color="#6B7280" desc="Disponible pronto" />
            <ScoreCard icon={<Bus size={18} />} label="Transit" score="—" color="#6B7280" desc="Disponible pronto" />
            <ScoreCard icon={<Bike size={18} />} label="Bike" score="—" color="#6B7280" desc="Disponible pronto" />
          </div>
          <p className="ni-note">Datos de vecindario próximamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ni-section">
      <h2> Vecindario</h2>
      <div className="ni-score-cards">
        <ScoreCard 
          icon={<MapPin size={18} />} 
          label="Walk Score" 
          score={scores.walkscore} 
          color={WalkScoreService.getScoreColor(scores.walkscore)}
          desc={WalkScoreService.getScoreLabel(scores.walkscore)}
        />
        <ScoreCard 
          icon={<Bus size={18} />} 
          label="Transit" 
          score={scores.transit?.score || 0} 
          color={WalkScoreService.getScoreColor(scores.transit?.score || 0)}
          desc={scores.transit?.description || ''}
        />
        <ScoreCard 
          icon={<Bike size={18} />} 
          label="Bike Score" 
          score={scores.bike?.score || 0} 
          color={WalkScoreService.getScoreColor(scores.bike?.score || 0)}
          desc={scores.bike?.description || ''}
        />
      </div>
    </div>
  )
}

function ScoreCard({ icon, label, score, color, desc }) {
  const isNumber = typeof score === 'number'
  return (
    <div className="ni-card">
      <div className="ni-card-icon" style={{ color }}>{icon}</div>
      <div className="ni-card-score" style={{ color: isNumber ? color : '#6B7280' }}>
        {isNumber ? score : score}
      </div>
      <div className="ni-card-label">{label}</div>
      {desc && <div className="ni-card-desc">{desc}</div>}
      {isNumber && (
        <div className="ni-progress-bar">
          <div 
            className="ni-progress-fill" 
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      )}
    </div>
  )
}
