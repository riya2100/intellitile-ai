import { useState, useEffect, useRef } from "react";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Sparkles, Plus, Trash2, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";
const API_BASE = import.meta.env.VITE_API_URL || "";

const QUICK_PROMPTS = [
  "Suggest tiles for a modern industrial kitchen",
  "I need warm terracotta tiles for a patio under ₹60/sqft",
  "What pairs well with glossy white marble bathroom walls?",
  "Best floor tiles for a north-facing bedroom with less sunlight",
];

export default function AiAdvisor() {
  const searchParams = new URLSearchParams(window.location.search);
  const convIdParam = searchParams.get("id");
  const referenceParam = searchParams.get("reference");

  const [activeConvId, setActiveConvId] = useState<string | null>(convIdParam);
  const [input, setInput] = useState(referenceParam ? `Tell me more about tile #${referenceParam} and what rooms it suits best` : "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConvs } = useListConversations();
  const createConv = useCreateConversation();

  const { data: activeConvData, isLoading: isConvLoading } = useGetConversation(activeConvId || "", {
    query: { enabled: !!activeConvId, queryKey: ["/api/conversations", activeConvId] },
  });

  useEffect(() => {
    if (activeConvData) {
      setMessages(activeConvData.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConvData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleNewChat = () => {
    createConv.mutate(
      { data: { title: "New Design Chat" } },
      {
        onSuccess: (data) => {
          setActiveConvId(data.id);
          setMessages([]);
          window.history.replaceState(null, "", `?id=${data.id}`);
          refetchConvs();
        },
      }
    );
  };

  const safeDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/conversations/${id}`, { method: "DELETE" });
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
        window.history.replaceState(null, "", window.location.pathname);
      }
      refetchConvs();
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    let targetConvId = activeConvId;

    if (!targetConvId) {
      try {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: input.substring(0, 40) }),
        });
        const newConv = await res.json();
        targetConvId = newConv.id;
        setActiveConvId(targetConvId);
        window.history.replaceState(null, "", `?id=${targetConvId}`);
        refetchConvs();
      } catch {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      conversationId: targetConvId as string,
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        conversationId: targetConvId as string,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/conversations/${targetConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.substring(6);
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.done) break;
            if (data.content) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: msg.content + data.content } : msg
                )
              );
            }
          } catch {
            // Skip incomplete SSE chunks
          }
        }
      }
    } catch {
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "I encountered an error. Please try again." }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      refetchConvs();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/20 flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2 shadow-sm" disabled={createConv.isPending}>
            {createConv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New Design Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Recent Conversations
            </div>
            {conversations?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet. Start a new chat!
              </p>
            )}
            {conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  window.history.replaceState(null, "", `?id=${conv.id}`);
                }}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
                  activeConvId === conv.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate text-sm">{conv.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
                  onClick={(e) => safeDelete(conv.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card">
        <header className="h-14 border-b flex items-center px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <Sparkles className="h-5 w-5 text-primary mr-2" />
          <h2 className="font-semibold font-serif text-lg">TileGenius AI Expert</h2>
          {activeConvId && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {conversations?.find(c => c.id === activeConvId)?.title || "Active Chat"}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
          {isConvLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-3">Your Personal Design Assistant</h3>
                <p className="text-muted-foreground">
                  Describe your dream room, ask for style recommendations, or get expert AI advice on the perfect tile for your space.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start h-auto py-3 text-left font-normal bg-background hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => setInput(prompt)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border text-foreground"
                    )}
                  >
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm"
                    )}
                  >
                    {msg.content.split("\n").map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                    {msg.role === "assistant" && isStreaming && index === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-card border-t">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto relative flex items-end gap-2 bg-muted/30 p-2 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project or ask for design advice..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base min-h-[48px] py-3"
              disabled={isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming}
              className={cn(
                "h-12 w-12 rounded-xl shrink-0 transition-all",
                input.trim()
                  ? "bg-primary text-primary-foreground shadow-md hover:scale-105"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
