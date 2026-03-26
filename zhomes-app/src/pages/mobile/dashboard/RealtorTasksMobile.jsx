import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock, Check, Calendar, Home } from 'lucide-react'
import './RealtorTasksMobile.css'

const INITIAL_TASKS = [
    { id: 1, title: 'Llamar a María López (Feedback)', date: 'Hoy, 2:00 PM', completed: false, property: '4132 Craig Ave' },
    { id: 2, title: 'Enviar CMA a Ana Martínez', date: 'Mañana, 10:00 AM', completed: false, property: '4300 Hillview Ave' },
    { id: 3, title: 'Confirmar Open House del Sábado', date: '12 Abril', completed: false, property: '8708 Denise Dr' },
    { id: 4, title: 'Subir contrato firmado FHA', date: 'Vencida', completed: false, property: '3918 River Park' },
    { id: 5, title: 'Revisar reporte de inspección', date: 'Ayer', completed: true, property: '4215 Vermont Ave' },
]

export default function RealtorTasksMobile() {
    const [tasks, setTasks] = useState(INITIAL_TASKS)
    const [showAddModal, setShowAddModal] = useState(false)
    const [activeTab, setActiveTab] = useState('pending') // pending, completed
    const [newTask, setNewTask] = useState({ title: '', date: '', property: '' })

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    const addTask = () => {
        if (!newTask.title.trim()) return
        const t = {
            id: Date.now(),
            title: newTask.title,
            date: newTask.date || 'Sin fecha',
            property: newTask.property || '',
            completed: false
        }
        setTasks([t, ...tasks])
        setNewTask({ title: '', date: '', property: '' })
        setShowAddModal(false)
    }

    const pendingTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)
    const displayTasks = activeTab === 'pending' ? pendingTasks : completedTasks

    return (
        <div className="rt-tasks-page">
            <div className="rt-tasks-header">
                <div>
                    <h1>Mis Tareas</h1>
                    <p>{pendingTasks.length} pendientes</p>
                </div>
                <button className="rt-tasks-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Nueva
                </button>
            </div>

            <div className="rt-tasks-tabs">
                <button 
                    className={`rt-tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pendientes ({pendingTasks.length})
                </button>
                <button 
                    className={`rt-tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completadas
                </button>
            </div>

            <div className="rt-tasks-list">
                {displayTasks.length === 0 && (
                    <div className="rt-tasks-empty">
                        <CheckCircle2 size={40} color="#E5E5E5" />
                        <p>No tienes tareas {activeTab === 'pending' ? 'pendientes' : 'completadas'}</p>
                    </div>
                )}
                {displayTasks.map(task => (
                    <div key={task.id} className={`rt-task-card ${task.completed ? 'completed' : ''}`}>
                        <button className="rt-task-check" onClick={() => toggleTask(task.id)}>
                            {task.completed ? <CheckCircle2 size={24} color="#10B981" /> : <Circle size={24} color="#D1D5DB" />}
                        </button>
                        <div className="rt-task-content" onClick={() => toggleTask(task.id)}>
                            <h3>{task.title}</h3>
                            <div className="rt-task-meta">
                                {task.date && (
                                    <span className={`rt-task-date ${task.date === 'Vencida' ? 'overdue' : ''}`}>
                                        <Clock size={12} /> {task.date}
                                    </span>
                                )}
                                {task.property && (
                                    <span className="rt-task-property">
                                        <Home size={12} /> {task.property}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <div className="rt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Nueva Tarea</h2>
                            <button onClick={() => setShowAddModal(false)}>Cerrar</button>
                        </div>
                        <div className="rt-modal-body form">
                            <input 
                                type="text" 
                                placeholder="Ej: Llamar a cliente, revisar doc..." 
                                value={newTask.title} 
                                onChange={e => setNewTask({...newTask, title: e.target.value})} 
                                autoFocus
                            />
                            <div className="rt-form-group-inline">
                                <Calendar size={18} color="#999" />
                                <input 
                                    type="text" 
                                    placeholder="Cuándo (Ej: Hoy, Mañana, 15 Abril)" 
                                    value={newTask.date} 
                                    onChange={e => setNewTask({...newTask, date: e.target.value})} 
                                />
                            </div>
                            <div className="rt-form-group-inline">
                                <Home size={18} color="#999" />
                                <input 
                                    type="text" 
                                    placeholder="Propiedad relacionada (Opcional)" 
                                    value={newTask.property} 
                                    onChange={e => setNewTask({...newTask, property: e.target.value})} 
                                />
                            </div>

                            <button className="rt-submit-btn" onClick={addTask} disabled={!newTask.title.trim()}>
                                <Check size={18} /> Guardar Tarea
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
