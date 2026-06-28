'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

type Message = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string }
type Contractor = { id: string; name: string; role: string; user_id: string }

export default function MessagesClient({
  currentUserId, companyId, contractors, initialMessages
}: {
  currentUserId: string; companyId: string;
  contractors: Contractor[]; initialMessages: Message[]
}) {
  const [selected, setSelected] = useState<Contractor | null>(contractors[0] ?? null)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  const thread = selected
    ? messages.filter(m =>
        (m.sender_id === currentUserId && m.recipient_id === selected.user_id) ||
        (m.sender_id === selected.user_id && m.recipient_id === currentUserId)
      )
    : []

  async function send() {
    if (!draft.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      company_id: companyId,
      sender_id: currentUserId,
      recipient_id: selected.user_id,
      content: draft.trim(),
    })
    setDraft('')
    setSending(false)
  }

  if (contractors.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>No contractors with portal access yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 gap-4 min-h-0">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-white rounded-xl border border-slate-200 overflow-y-auto">
        {contractors.map(c => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
              selected?.id === c.id ? 'bg-navy/5 border-l-2 border-l-navy' : ''
            }`}
          >
            <p className="text-sm font-medium text-slate-900">{c.name}</p>
            <p className="text-xs text-slate-400">{c.role}</p>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 min-h-0">
        {selected ? (
          <>
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <p className="font-semibold text-slate-900">{selected.name}</p>
              <p className="text-xs text-slate-400">{selected.role}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {thread.length === 0 && (
                <p className="text-center text-sm text-slate-400 mt-8">No messages yet. Say hello!</p>
              )}
              {thread.map(m => {
                const isMe = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe ? 'bg-navy text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {m.content}
                      <div className={`text-xs mt-1 ${isMe ? 'text-white/50' : 'text-slate-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex gap-2 shrink-0">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Type a message…"
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="p-2.5 bg-navy text-white rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select a contractor to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
