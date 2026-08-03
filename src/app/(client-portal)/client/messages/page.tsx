"use client"

import { useEffect, useState, useRef } from "react"
import { Send, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { formatDate, unwrap } from "@/lib/utils"
import { toast } from "react-hot-toast"

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  client_id: string
  created_at: string
  sender?: { full_name: string } | { full_name: string }[] | null
}

export default function ClientMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadMessages() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data } = await supabase
          .from("messages")
          .select("id, content, sender_id, receiver_id, client_id, created_at, sender:profiles(full_name)")
          .eq("client_id", user.id)
          .order("created_at", { ascending: true })

        if (data) setMessages(data)
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message
          if (msg.client_id === userId || msg.sender_id === userId) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  async function handleSend() {
    if (!newMessage.trim() || !userId) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("client_portal_users")
        .select("client_id")
        .eq("user_id", user.id)
        .single()

      const { error } = await supabase.from("messages").insert({
        client_id: profile?.client_id,
        sender_id: user.id,
        receiver_id: null,
        content: newMessage.trim(),
      })

      if (error) throw error
      setNewMessage("")
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
        <p className="text-[var(--text-secondary)]">Communicate with your lawyer.</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-[var(--text-secondary)]">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === userId
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                        isOwn
                          ? "bg-primary text-white"
                          : "bg-[var(--surface-subtle)] text-[var(--text-primary)]"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-75">
                        {unwrap(msg.sender)?.full_name || "Lawyer"}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          isOwn ? "text-white/60" : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
