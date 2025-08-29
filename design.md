import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Send, Settings2, Sidebar, SidebarClose, Plus, Trash2, Sparkles, MessageSquare } from "lucide-react";

// —— 主题色板 —— //
const githubDark = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#c9d1d9",
  subtext: "#8b949e",
  accent: "#1f6feb",
  success: "#238636",
};

// 玻璃态（Apple 风，护眼稍深）
const glassLight = {
  bg: "#e9ecf1",
  panel: "rgba(250,250,250,0.7)",
  border: "rgba(220,220,220,0.8)",
  text: "#111827",
  subtext: "#4b5563",
  accent: "#0a84ff",
  success: "#34c759",
};

function useLocal<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

type Msg = { id: string; role: "user" | "assistant"; content: string; time: number };

type Thread = { id: string; title: string; createdAt: number; messages: Msg[] };

export default function ChatElegantUI() {
  const [collapsed, setCollapsed] = useLocal<boolean>("ui.sidebar", false);
  const [themeDark, setThemeDark] = useLocal<boolean>("ui.themeDark", true);
  const [apiKey, setApiKey] = useLocal<string>("ui.apiKey", "");
  const [model, setModel] = useLocal<string>("ui.model", "wisdom-ai-gpt5");
  const modelList = [
    "wisdom-ai-gpt5 (via Gpt5)",
    "wisdom-ai-gpt5-mini (via Gpt5 Mini)",
    "wisdom-ai-gpt5-nano (via Gpt5 Nano)",
    "wisdom-ai-dsv3 (via DeepseekV3)",
    "wisdom-ai-dsr1 (via DeepseekR1)",
    "wisdom-ai-claude-sonnet-4 (via Claude Sonnet 4)",
    "wisdom-ai-gemini-2.5-flash (via Gemini 2.5 Flash)",
  ];
  const [threads, setThreads] = useLocal<Thread[]>("ui.threads", [
    { id: crypto.randomUUID(), title: "全新会话", createdAt: Date.now(), messages: [] },
  ]);
  const [activeId, setActiveId] = useLocal<string>("ui.activeId", threads[0]?.id);
  const [input, setInput] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeDark);
  }, [themeDark]);

  useEffect(() => {
    if (!threads.find(t => t.id === activeId) && threads.length) {
      setActiveId(threads[0].id);
    }
  }, [threads, activeId, setActiveId]);

  const palette = themeDark ? githubDark : glassLight;
  const active = useMemo(() => threads.find(t => t.id === activeId)!, [threads, activeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length]);

  function newThread() {
    const t: Thread = { id: crypto.randomUUID(), title: "全新会话", createdAt: Date.now(), messages: [] };
    setThreads([t, ...threads]);
    setActiveId(t.id);
  }

  function deleteThread(id: string) {
    const next = threads.filter(t => t.id !== id);
    setThreads(next);
    if (id === activeId) setActiveId(next[0]?.id);
  }

  function renameActive(title: string) {
    setThreads(ts => ts.map(t => (t.id === activeId ? { ...t, title } : t)));
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, time: Date.now() };
    const thinking: Msg = { id: crypto.randomUUID(), role: "assistant", content: "正在思考…", time: Date.now() };
    setThreads(ts => ts.map(t => (t.id === activeId ? { ...t, messages: [...t.messages, userMsg, thinking] } : t)));
    setInput("");

    setTimeout(() => {
      const reply = `这是一个演示回复：\n\n> 你说：${text}`;
      setThreads(ts => ts.map(t => {
        if (t.id !== activeId) return t;
        const msgs = t.messages.slice();
        const idx = msgs.findIndex(m => m.id === thinking.id);
        if (idx >= 0) msgs[idx] = { ...msgs[idx], content: reply, time: Date.now() };
        return { ...t, messages: msgs };
      }));
    }, 650);

    if (active.messages.length === 0) {
      const title = text.slice(0, 18) + (text.length > 18 ? "…" : "");
      renameActive(title);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  const shellClass = themeDark
    ? "bg-[#0d1117] text-[#c9d1d9] grid-cols-[300px_1fr]"
    : "bg-[#e9ecf1] text-[#111827] grid-cols-[300px_1fr]";

  const panelClass = themeDark
    ? "bg-[#161b22]/95 border-[#30363d]"
    : "bg-white/70 backdrop-blur-xl border-[#d0d0d0]";

  const dialogClass = themeDark
    ? "bg-[#161b22] text-[#c9d1d9] border border-[#30363d]"
    : "bg-white/90 text-[#111827]";

  const buttonClass = themeDark
    ? "h-12 w-12 rounded-xl bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
    : "h-12 w-12 rounded-xl";

  return (
    <TooltipProvider>
      <div className={`w-full h-screen grid ${shellClass}`}
        style={{ gridTemplateColumns: collapsed ? "0 1fr" : "300px 1fr" }}>
        {/* 左侧历史 */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.aside
              key="sidebar"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              className={`h-full border-r ${panelClass} relative`}
            >
              <div className="p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Highest</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="rounded-xl">
                    <SidebarClose className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-xs opacity-70 ml-7">Provide by Wisdom Gate</span>
              </div>
              <Separator />
              <ScrollArea className="h-[calc(100%-56px)]">
                <div className="p-2 space-y-1">
                  {threads.map(t => (
                    <motion.div key={t.id}>
                      <button
                        onClick={() => setActiveId(t.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${panelClass} ${
                          t.id === activeId ? "ring-1 ring-blue-500" : "hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate font-medium">{t.title}</div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-xl"
                            onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 右侧主区域 */}
        <main className="relative h-full">
          <div className={`sticky top-0 z-20 border-b ${panelClass}`}>
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {collapsed && (
                  <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="rounded-xl">
                    <Sidebar className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">对话</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setOpenSettings(true)} className="rounded-xl">
                  <Settings2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setThemeDark(!themeDark)}
                >
                  {themeDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 pt-[56px] pb-[116px]">
            <div ref={listRef} className="h-full overflow-y-auto px-6 py-6 space-y-4">
              {active?.messages.length ? (
                active.messages.map(m => (
                  <motion.div key={m.id} className={`max-w-3xl ${m.role === "user" ? "ml-auto" : "mr-auto"}`}>
                    <div className={`p-4 rounded-xl border ${panelClass}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={m.role === "user" ? "default" : "secondary"}>
                          {m.role === "user" ? "你" : "助手"}
                        </Badge>
                        <span className="text-xs opacity-70">{new Date(m.time).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-7">{m.content}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full grid place-items-center">
                  <div className="text-center opacity-80">
                    <div className="text-2xl font-semibold mb-2">开始你的对话</div>
                    <div className="text-sm">在下方输入问题，或从左侧选择历史会话。</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部输入栏 */}
          <div className={`absolute bottom-0 left-0 right-0 border-t ${panelClass}`}>
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center gap-2">
                <Button onClick={() => setOpenSettings(true)} className={buttonClass}>
                  <Settings2 className="w-5 h-5" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="输入你的问题，Ctrl/Cmd + Enter 发送…"
                  className={`flex-1 min-h-[56px] max-h-[220px] resize-y rounded-xl border ${panelClass}`}
                />
                <Button onClick={handleSend} className={buttonClass}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 设置对话框 */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className={`rounded-2xl sm:max-w-[480px] ${dialogClass}`}>
          <DialogHeader>
            <DialogTitle>接口设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-80">API Key</label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm opacity-80">选择模型</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between rounded-xl w-full">{model}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl">
                  {modelList.map(m => (
                    <DropdownMenuItem key={m} onClick={() => setModel(m)}>{m}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <a href="https://wisdom-gate.juheapi.com?i=4n2K" target="_blank" className="text-xs text-blue-500 underline">
              Get 5,000,000 Tokens for Free!
            </a>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenSettings(false)} className="rounded-xl">完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}