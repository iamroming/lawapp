"use client";
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Search,
  Loader2,
  Circle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Conversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  client_id: string;
  is_read: boolean;
  created_at: string;
  case: { id: string; case_number: string; title: string } | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchConversations();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMessages(selectedClient);
    }
  }, [selectedClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    // Get current user's firm members (clients created by this user or all if owner)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.id)
      .single();

    const isOwner = ["owner", "partner", "super_admin"].includes(profile?.role || "");
    const firmId = profile?.firm_id || user.id;

    // Get all clients
    let clientsQuery = supabase
      .from("clients")
      .select("id, full_name, phone")
      .is("deleted_at", null);

    if (isOwner) {
      clientsQuery = clientsQuery.eq("firm_id", firmId);
    } else {
      clientsQuery = clientsQuery.eq("created_by", user.id);
    }

    const { data: allClients } = await clientsQuery;
    if (!allClients) return;

    // Get messages for this user's firm
    let messagesQuery = supabase
      .from("messages")
      .select("client_id, content, created_at, is_read, sender_id, firm_id")
      .order("created_at", { ascending: false });

    if (isOwner) {
      messagesQuery = messagesQuery.eq("firm_id", firmId);
    } else {
      const clientIds = allClients.map((c) => c.id);
      messagesQuery = messagesQuery.in("client_id", clientIds);
    }

    const { data: messagesData } = await messagesQuery;

    // Build conversation map from all clients
    const convMap = new Map<string, Conversation>();

    for (const client of allClients) {
      const clientMessages = (messagesData || []).filter((m) => m.client_id === client.id);
      const lastMsg = clientMessages[0];

      convMap.set(client.id, {
        clientId: client.id,
        clientName: client.full_name,
        lastMessage: lastMsg?.content || "No messages yet",
        lastMessageTime: lastMsg?.created_at || new Date().toISOString(),
        unreadCount: clientMessages.filter(
          (m) => !m.is_read && m.sender_id !== user.id
        ).length,
      });
    }

    // Sort: clients with messages first (by last message time), then clients without messages
    const sorted = Array.from(convMap.values()).sort((a, b) => {
      if (a.lastMessage === "No messages yet" && b.lastMessage !== "No messages yet") return 1;
      if (a.lastMessage !== "No messages yet" && b.lastMessage === "No messages yet") return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setConversations(sorted);
  };

  const fetchMessages = async (clientId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, case:cases(id, case_number, title)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages((data || []) as Message[]);

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("client_id", clientId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        client_id: selectedClient,
        sender_id: currentUserId,
        content: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedClient);
      fetchConversations();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Conversations List */}
      <Card className={`w-full lg:w-80 flex flex-col ${selectedClient ? "hidden lg:flex" : "flex"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Messages
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.clientId}
                onClick={() => setSelectedClient(conv.clientId)}
                className={`w-full p-3 text-left hover:bg-gray-50 border-b transition-colors ${
                  selectedClient === conv.clientId ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    conv.lastMessage === "No messages yet" ? "bg-gray-100" : "bg-blue-100"
                  }`}>
                    <span className={`text-sm font-medium ${
                      conv.lastMessage === "No messages yet" ? "text-gray-500" : "text-blue-700"
                    }`}>
                      {conv.clientName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.clientName}</span>
                      {conv.lastMessage !== "No messages yet" && (
                        <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${
                      conv.lastMessage === "No messages yet" ? "text-gray-400 italic" : "text-gray-500"
                    }`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      {selectedClient ? (
        <Card className={`flex-1 flex flex-col ${selectedClient ? "flex" : "hidden lg:flex"}`}>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedClient(null)}
                >
                  <span className="sr-only">Back</span>
                  &larr;
                </Button>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {conversations.find((c) => c.clientId === selectedClient)?.clientName.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">
                    {conversations.find((c) => c.clientId === selectedClient)?.clientName}
                  </h3>
                  <p className="text-xs text-gray-500">Client</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === currentUserId
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.case && (
                      <div className={`text-xs mb-1 ${msg.sender_id === currentUserId ? "text-blue-200" : "text-gray-500"}`}>
                        Re: {msg.case.case_number}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`text-xs mt-1 ${
                        msg.sender_id === currentUserId ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500">Choose a client from the list to start messaging</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
