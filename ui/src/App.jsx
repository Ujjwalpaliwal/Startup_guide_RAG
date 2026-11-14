import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CITATION_ARTIFACT = /\u3010[^\u3011]*\u3011/g;

function cleanAnswer(text) {
  return (text || "")
    .replace(CITATION_ARTIFACT, "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MARKDOWN_COMPONENTS = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener" />
  ),
};

function SourceList({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <details className="sources">
      <summary>{sources.length} source{sources.length > 1 ? "s" : ""}</summary>
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            <span className="src-ref">[{i + 1}]</span> {s.source}{" "}
            <span className="src-page">— page {s.page}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const SUGGESTIONS = [
  "How do I register a startup in India?",
  "What are the tax benefits for recognized startups?",
  "What is DPIIT recognition and why is it important?",
  "Which entity types are eligible to be called a startup?",
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 4 }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${err.message}. Is the API server running on port 8000?`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Startup India RAG Assistant</h1>
        <p>Answers from your Startup India documents (Qdrant retrieval + Groq)</p>
      </header>

      <main className="chat">
        {messages.length === 0 && (
          <div className="welcome">
            <p>Ask anything about startup registration, DPIIT recognition, funding, or incentives in India.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">
              {m.role === "assistant" ? (
                <div className="markdown">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {cleanAnswer(m.content)}
                  </Markdown>
                </div>
              ) : (
                <p className="plain">{m.content}</p>
              )}
              {m.role === "assistant" && <SourceList sources={m.sources} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg assistant">
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </main>

      <footer>
        <input
          type="text"
          placeholder="Ask a question about startups in India..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}>
          Send
        </button>
      </footer>
    </div>
  );
}