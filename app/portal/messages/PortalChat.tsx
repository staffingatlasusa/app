'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

type Message = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string }

export default function PortalChat({
  currentUserId, companyId, companyName, ownerId, initialMessages
}: {
  currentUserId: string; companyId: string; companyName: string
  ownerId: string; initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('portal-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new as Message
        if (m.sender_id === currentUserId || m.recipient_id === currentUserId) {
          setMessages(prev => prev.some(p => p.id === m.id) ? prev : [...prev, m])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!draft.trim() || sending || !ownerId) return
    setSending(true)
    await supabase.from('messages').insert({
      company_id: companyId,
      sender_id: currentUserId,
      recipient_id: ownerId,
      content: draft.trim(),
    })
    setDraft('')
    setSending(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 min-h-0">
      <div className="px-5 py-4 border-b border-slate-100 shrink-0">
        <p className="font-semibold text-slate-900">{companyName}</p>
        <p className="text-xs text-slate-400">Your employer</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map(m => {
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
    </div>
  )
}
