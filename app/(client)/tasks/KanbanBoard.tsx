'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-slate-100 text-slate-600' },
  { key: 'in_progress', label: 'In Progress',  color: 'bg-blue-50 text-blue-600' },
  { key: 'review',      label: 'Review',       color: 'bg-amber/10 text-amber-600' },
  { key: 'done',        label: 'Done',         color: 'bg-green-50 text-green-700' },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber/10 text-amber-600',
  low: 'bg-slate-100 text-slate-500',
}

type Task = {
  id: string; title: string; description?: string; status: string;
  priority: string; due_date?: string; assigned_to?: string;
  contractors?: { name: string } | null
}

export default function KanbanBoard({
  initialTasks, contractors, companyId
}: {
  initialTasks: Task[]; contractors: { id: string; name: string }[]; companyId: string
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [adding, setAdding] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const supabase = createClient()

  async function moveTask(id: string, status: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await supabase.from('tasks').update({ status }).eq('id', id)
  }

  async function assignTask(id: string, contractorId: string) {
    const contractor = contractors.find(c => c.id === contractorId) ?? null
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, assigned_to: contractorId || undefined, contractors: contractor ? { name: contractor.name } : null }
      : t))
    await supabase.from('tasks').update({ assigned_to: contractorId || null }).eq('id', id)
  }

  async function addTask(status: string) {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('tasks').insert({
      title: newTitle.trim(), status, priority: 'medium', company_id: companyId
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTitle('')
    setAdding(null)
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} className="w-72 shrink-0 bg-slate-100 rounded-xl p-3">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.color}`}>{col.label}</span>
                <span className="text-xs text-slate-400 font-medium">{colTasks.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {colTasks.map(task => (
                <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 leading-snug flex-1">{task.title}</p>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-slate-400">
                        {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <select
                      value={task.assigned_to ?? ''}
                      onChange={e => assignTask(task.id, e.target.value)}
                      className={`text-xs rounded px-1 py-0.5 ml-auto max-w-[110px] border-0 outline-none cursor-pointer ${
                        task.assigned_to ? 'bg-navy/10 text-navy font-medium' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>{c.name.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Move buttons */}
                  <div className="flex gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => moveTask(task.id, c.key)}
                        className="text-xs text-slate-400 hover:text-navy px-1.5 py-0.5 hover:bg-navy/5 rounded transition-colors"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add card */}
            {adding === col.key ? (
              <div className="mt-2 bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(col.key); if (e.key === 'Escape') setAdding(null) }}
                  placeholder="Task title…"
                  className="w-full text-sm outline-none text-slate-900 placeholder-slate-400"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => addTask(col.key)} className="text-xs font-semibold text-white bg-navy px-2.5 py-1 rounded-md hover:bg-navy-deep transition-colors">
                    Add
                  </button>
                  <button onClick={() => setAdding(null)} className="text-xs text-slate-400 hover:text-slate-600">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(col.key)}
                className="w-full mt-2 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 px-1 py-2 rounded-lg hover:bg-white/60 transition-colors"
              >
                <Plus size={14} /> Add card
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
