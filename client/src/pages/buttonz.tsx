import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DoorOpen,
  Hash,
  Home,
  Loader2,
  Plus,
  Send,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { ButtonzOutlineIcon } from "@/components/icons/buttonz-outline-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chat, Message, PublicUser } from "@shared/schema";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function LoginScreen() {
  const gfsUrl = import.meta.env.VITE_GFS_URL || "http://localhost:5174";
  const gfsLoginUrl = new URL("/login", gfsUrl).toString();
  const launchedFromGameForge = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("from") === "gfs" || document.referrer.startsWith(gfsUrl);
  }, [gfsUrl]);
  const [isCheckingGameForgeSession, setIsCheckingGameForgeSession] = useState(() => {
    return launchedFromGameForge;
  });

  const gfsSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/gfs-session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
    },
    onSettled: () => {
      setIsCheckingGameForgeSession(false);
    },
  });

  useEffect(() => {
    if (isCheckingGameForgeSession) {
      gfsSessionMutation.mutate();
    }
  }, [isCheckingGameForgeSession]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.25),transparent_35%),linear-gradient(135deg,#070b18,#111827)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-card/90 p-8 shadow-2xl shadow-primary/20">
        <div className="mb-8 text-center">
          <img
            src="/buttonz-icon.png"
            alt="Buttonz"
            className="mx-auto mb-4 h-28 w-28 object-contain drop-shadow-[0_0_24px_hsl(var(--primary)/0.45)]"
          />
          <h1 className="text-4xl font-bold">Buttonz</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Buttonz requires a verified GameForgeStudio session.
          </p>
        </div>

        <div className="space-y-4">
          {isCheckingGameForgeSession ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your GameForgeStudio session...
              </div>
            </div>
          ) : launchedFromGameForge && gfsSessionMutation.isError ? (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
              <p className="font-semibold text-foreground">Session Verification Failed</p>
              <p className="text-sm text-muted-foreground">
                GameForgeStudio could not verify your session, so Buttonz did not create a session.
              </p>
              <Button type="button" className="w-full rounded-xl" onClick={() => {
                window.location.href = gfsLoginUrl;
              }}>
                <Home className="h-4 w-4" />
                Sign in again through GameForgeStudio
              </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
              <p className="font-semibold text-foreground">Access Required</p>
              <p className="text-sm text-muted-foreground">
                Please sign in to GameForgeStudio first, then open Buttonz from the GameForgeStudio sidebar.
              </p>
              <Button type="button" className="w-full rounded-xl" onClick={() => {
                window.location.href = gfsLoginUrl;
              }}>
                <Home className="h-4 w-4" />
                Sign in through GameForgeStudio
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ChatSidebar({
  chats,
  activeChatId,
  currentUser,
  onChatSelect,
  onCreateChat,
  onReturnToGameForge,
  onSettings,
  onLogout,
}: {
  chats: Chat[];
  activeChatId: string | null;
  currentUser: PublicUser;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  onReturnToGameForge: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="w-72 bg-gradient-to-b from-card to-background border-r border-border/50 flex flex-col rounded-r-3xl overflow-hidden animate-slide-in-left">
      <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <img
            src="/buttonz-icon.png"
            alt="Buttonz"
            className="h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
          />
          <div>
            <h2 className="text-xl font-bold">Buttonz</h2>
            <p className="text-xs text-muted-foreground">Connect & Collaborate</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold">Welcome Back</h3>
            <p className="text-xs text-muted-foreground">Using your GameForgeStudio identity</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-4 w-full rounded-xl border-primary/30"
          onClick={onReturnToGameForge}
        >
          <Home className="w-4 h-4" />
          Return to GameForgeStudio
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 mt-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            Your Channels
          </div>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeChatId === chat.id
                  ? "bg-primary/20 text-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeChatId === chat.id ? "bg-primary/30" : "bg-muted/50"}`}>
                <Hash className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium block truncate flex-1">{chat.name}</span>
              {chat.isMainChat === 1 && <Badge className="text-xs border-0 rounded-full px-2">Main</Badge>}
            </button>
          ))}

          <button
            onClick={onCreateChat}
            className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 text-muted-foreground hover:bg-primary/10 hover:text-primary group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/50 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Create Channel</span>
          </button>
        </div>
      </ScrollArea>

      <div className="p-4 bg-gradient-to-t from-card to-background border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={currentUser.avatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">{initials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{currentUser.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.jobTitle || currentUser.role}</p>
          </div>
          <Button size="sm" variant="ghost" className="p-2 h-auto rounded-xl" onClick={onSettings}>
            <Settings className="w-4 h-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-2 h-auto rounded-xl" onClick={onLogout}>
                <DoorOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Log out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function ChatArea({
  chat,
  messages,
  users,
  onSendMessage,
}: {
  chat: Chat | null;
  messages: Message[];
  users: PublicUser[];
  onSendMessage: (content: string) => void;
}) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim());
    setMessageInput("");
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 max-w-md">
          <ButtonzOutlineIcon className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Start a Conversation</h3>
          <p className="text-muted-foreground">Select or create a channel to begin chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background animate-fade-in">
      <div className="p-5 border-b border-border/50 bg-gradient-to-r from-card to-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{chat.name}</h3>
              {chat.description && <p className="text-sm text-muted-foreground">{chat.description}</p>}
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/30 rounded-full">
            <Users className="w-3 h-3 mr-1" />
            {users.length} users
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="min-h-full flex flex-col justify-end">
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {messages.map((message) => {
              const user = usersById.get(message.userId);
              return (
                <div key={message.id} className="flex gap-4 hover:bg-muted/20 p-3 -mx-3 rounded-2xl transition-all duration-200">
                  <Avatar className="w-10 h-10 border-2 border-primary/10">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials(user?.displayName || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-semibold">{user?.displayName || "Unknown User"}</span>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary px-2 py-0 rounded-full">
                        {user?.role || "member"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="text-foreground/90 text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      <div className="p-5 border-t border-border/50 bg-gradient-to-t from-card to-background">
        <div className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3 max-w-4xl mx-auto border border-border/50 focus-within:border-primary/50">
          <Input
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message #${chat.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button onClick={handleSend} size="sm" className="rounded-xl h-auto p-2 shadow-lg shadow-primary/30">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserList({ users }: { users: PublicUser[] }) {
  return (
    <div className="w-72 bg-gradient-to-b from-card to-background border-l border-border/50 p-5 rounded-l-3xl overflow-hidden animate-slide-in-right">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          GameForge Users
        </h3>
        <Badge className="bg-primary/20 text-primary border-0 rounded-full">{users.length}</Badge>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="p-3 rounded-2xl hover:bg-muted/50 transition-all duration-200 flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-primary/30">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">{initials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.status || user.jobTitle || user.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsDialog({ open, onClose, currentUser }: { open: boolean; onClose: () => void; currentUser: PublicUser }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>Buttonz Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={currentUser.username} disabled className="mt-2 bg-muted/50" />
              <p className="text-xs text-muted-foreground mt-1">Managed by GameForgeStudio</p>
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={currentUser.displayName} disabled className="mt-2 bg-muted/50" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={currentUser.jobTitle || currentUser.role} disabled className="mt-2 bg-muted/50" />
            </div>
          </div>
          <div className="space-y-4">
            {["Project updates", "Team messages", "Direct messages"].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <p className="text-xs text-muted-foreground">Local Buttonz preference placeholder</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateChannelDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chats", {
        name,
        description: description || null,
        type: "group",
      });
      return response.json();
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="channel-name">Name</Label>
            <Input id="channel-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="channel-description">Description</Label>
            <Textarea id="channel-description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2" />
          </div>
          <Button disabled={!name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            Create Channel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ButtonzPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const gfsUrl = import.meta.env.VITE_GFS_URL || "http://localhost:5174";
  const userQuery = useCurrentUser();

  const chatsQuery = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: Boolean(userQuery.data),
  });

  const usersQuery = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    enabled: Boolean(userQuery.data),
  });

  useEffect(() => {
    if (!activeChatId && chatsQuery.data?.[0]) {
      setActiveChatId(chatsQuery.data[0].id);
    }
  }, [activeChatId, chatsQuery.data]);

  const messagesQuery = useQuery<Message[]>({
    queryKey: [`/api/chats/${activeChatId}/messages`],
    enabled: Boolean(activeChatId),
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/chats/${activeChatId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${activeChatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  if (userQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userQuery.data) {
    return <LoginScreen />;
  }

  const currentChat = chatsQuery.data?.find((chat) => chat.id === activeChatId) || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex">
        <ChatSidebar
          chats={chatsQuery.data || []}
          activeChatId={activeChatId}
          currentUser={userQuery.data}
          onChatSelect={setActiveChatId}
          onCreateChat={() => setCreateOpen(true)}
          onReturnToGameForge={() => {
            window.location.href = gfsUrl;
          }}
          onSettings={() => setSettingsOpen(true)}
          onLogout={() => logoutMutation.mutate()}
        />
        <ChatArea
          chat={currentChat}
          messages={messagesQuery.data || []}
          users={usersQuery.data || []}
          onSendMessage={(content) => sendMessageMutation.mutate(content)}
        />
        <UserList users={usersQuery.data || []} />
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} currentUser={userQuery.data} />
      <CreateChannelDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
