import { useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Bot,
  ChevronDown,
  FileText,
  Loader2,
  Mic,
  Send,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CITATION_ARTIFACT = /\u3010[^\u3011]*\u3011/g;

function cleanAnswer(text) {
  return (text || "")
    .replace(CITATION_ARTIFACT, "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toPlainText(text) {
  return cleanAnswer(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_#>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const LANGUAGES = [
  { code: "en", label: "English", speech: "en-IN", placeholder: "Ask a question about startups in India..." },
  { code: "hi", label: "हिंदी", speech: "hi-IN", placeholder: "भारत में स्टार्टअप के बारे में सवाल पूछें..." },
];

const SUGGESTIONS = [
  "How do I register a startup in India?",
  "What are the tax benefits for recognized startups?",
  "What is DPIIT recognition and why is it important?",
  "Which entity types are eligible to be called a startup?",
];

const MARKDOWN_COMPONENTS = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener" />
  ),
};

function SourceList({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <details className="group mt-3 rounded-xl border bg-muted/40 px-3 py-2">
      <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
        <FileText className="size-3.5" />
        {sources.length} source{sources.length > 1 ? "s" : ""}
        <ChevronDown className="ml-auto size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2 space-y-1.5">
        {sources.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <Badge
              variant="secondary"
              className="mt-0.5 h-5 shrink-0 px-1.5 text-[10px] tabular-nums"
            >
              {i + 1}
            </Badge>
            <span className="min-w-0">
              <span className="font-medium text-foreground">{s.source}</span>
              <span> — page {s.page}</span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function AssistantAvatar() {
  return (
    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
      <Bot className="size-4" />
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const activeLanguage =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setNotice("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 4, language }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          language,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${err.message}. Is the API server running on port 8000?`,
          sources: [],
          language,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRecording() {
    if (transcribing) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("Voice input is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        setNotice("");
        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const form = new FormData();
          form.append("file", blob, "speech.webm");
          form.append("language", language);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          if (!res.ok) throw new Error(`Transcription error ${res.status}`);
          const data = await res.json();
          if (data.text) {
            setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
          } else {
            setNotice("No speech detected. Please try again.");
          }
        } catch (err) {
          setNotice(`Could not transcribe audio: ${err.message}`);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setNotice("");
      setRecording(true);
    } catch (err) {
      setNotice(`Microphone unavailable: ${err.message}`);
    }
  }

  function speak(text, code) {
    if (!("speechSynthesis" in window)) {
      setNotice("Speech playback is not supported in this browser.");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(toPlainText(text));
    const config = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
    utterance.lang = config.speech;
    const voice = synth
      .getVoices()
      .find((v) =>
        v.lang.toLowerCase().startsWith(code === "hi" ? "hi" : "en")
      );
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }

  const status = transcribing ? "Transcribing…" : notice;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
                Startup India RAG Assistant
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Answers from your Startup India documents · Qdrant + Groq
              </p>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center rounded-lg border bg-muted p-1"
            role="group"
            aria-label="Response language"
          >
            {LANGUAGES.map((l) => (
              <Button
                key={l.code}
                type="button"
                size="sm"
                variant={language === l.code ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setLanguage(l.code)}
                disabled={loading || recording || transcribing}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <BookOpen className="size-7" />
              </div>
              <h2 className="text-xl font-semibold">
                Ask anything about startups in India
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Registration, DPIIT recognition, funding, tax benefits, and
                government incentives — answered from your indexed documents.
              </p>
              <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    className="h-auto whitespace-normal rounded-full px-3.5 py-2 text-left text-xs font-normal"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && <AssistantAvatar />}
              <div
                className={cn(
                  "min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border bg-card text-card-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-a:text-primary prose-p:leading-relaxed">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={MARKDOWN_COMPONENTS}
                    >
                      {cleanAnswer(m.content)}
                    </Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}

                {m.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                    onClick={() => speak(m.content, m.language || language)}
                    title="Read answer aloud"
                  >
                    <Volume2 className="size-3.5" />
                    Listen
                  </Button>
                )}

                {m.role === "assistant" && <SourceList sources={m.sources} />}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border bg-card px-4 py-4 shadow-sm">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    style={{ animationDelay: `${delay}ms` }}
                    className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {status && (
        <div className="border-t bg-amber-50">
          <p className="mx-auto w-full max-w-4xl px-4 py-2 text-xs text-amber-700 sm:px-6">
            {status}
          </p>
        </div>
      )}

      <footer className="border-t bg-card/80 backdrop-blur">
        <form
          className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Button
            type="button"
            variant={recording ? "destructive" : "outline"}
            size="icon"
            className="size-10 shrink-0"
            onClick={toggleRecording}
            disabled={loading || transcribing}
            title={recording ? "Stop recording" : "Ask by voice"}
            aria-label={recording ? "Stop recording" : "Ask by voice"}
          >
            {transcribing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : recording ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
          </Button>

          <Input
            type="text"
            placeholder={activeLanguage.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || transcribing}
            className="h-10 flex-1"
          />

          <Button
            type="submit"
            className="h-10 shrink-0 gap-2 px-4"
            disabled={loading || transcribing || !input.trim()}
          >
            <Send className="size-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
