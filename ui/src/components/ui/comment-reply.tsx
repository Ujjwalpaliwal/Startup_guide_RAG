import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CommentReplyProps {
  author?: string;
  timestamp?: string;
  content?: string;
  initialLikes?: number;
  placeholder?: string;
  className?: string;
  onSubmit?: (reply: string) => void;
}

export function CommentReply({
  author = "Yassine Zanina",
  timestamp = "Wednesday, March 13th at 2:45pm",
  content = "I've been using this product for a few days now and I'm really impressed! The interface is intuitive and easy to use, and the features are exactly what I need to streamline my workflow.",
  initialLikes = 14,
  placeholder = "Reply",
  className,
  onSubmit,
}: CommentReplyProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");

  function handleLike() {
    setLikes((count) => count + (liked ? -1 : 1));
    setLiked((value) => !value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = reply.trim();
    if (!value) return;
    onSubmit?.(value);
    setReply("");
  }

  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-lg",
        className
      )}
    >
      <span className="text-sm font-semibold text-slate-900">Comments</span>

      <div className="mt-3 flex gap-3">
        <div className="flex w-9 shrink-0 flex-col items-center gap-1 pt-1">
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? "Unlike comment" : "Like comment"}
            aria-pressed={liked}
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100",
              liked ? "text-red-500" : "text-slate-500"
            )}
          >
            <HeartIcon filled={liked} />
          </button>
          <hr className="w-4 border-slate-200" />
          <span className="text-xs font-medium text-slate-500">{likes}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserIcon />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {author}
              </p>
              <p className="truncate text-xs text-slate-400">{timestamp}</p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {content}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-2"
      >
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none bg-transparent px-1 py-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-500">
            <ToolbarButton label="Bold">
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton label="Italic">
              <ItalicIcon />
            </ToolbarButton>
            <ToolbarButton label="Underline">
              <UnderlineIcon />
            </ToolbarButton>
            <ToolbarButton label="Strikethrough">
              <StrikethroughIcon />
            </ToolbarButton>
            <ToolbarButton label="Add emoji">
              <EmojiIcon />
            </ToolbarButton>
          </div>
          <button
            type="submit"
            title="Send"
            aria-label="Send reply"
            disabled={!reply.trim()}
            className="flex size-8 items-center justify-center rounded-lg bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

function ToolbarButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
    >
      {children}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill={filled ? "currentColor" : "none"}
        strokeLinecap="round"
        strokeWidth={2}
        stroke="currentColor"
        d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        fill="currentColor"
        strokeLinecap="round"
        strokeWidth={2}
        stroke="currentColor"
        d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"
      />
      <path
        strokeWidth={2}
        fill="currentColor"
        stroke="currentColor"
        d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"
      />
    </svg>
  );
}

function BoldIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M5 6C5 4.58579 5 3.87868 5.43934 3.43934C5.87868 3 6.58579 3 8 3H12.5789C15.0206 3 17 5.01472 17 7.5C17 9.98528 15.0206 12 12.5789 12H5V6Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M12.4286 12H13.6667C16.0599 12 18 14.0147 18 16.5C18 18.9853 16.0599 21 13.6667 21H8C6.58579 21 5.87868 21 5.43934 20.5607C5 20.1213 5 19.4142 5 18V12"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M12 4H19"
      />
      <path
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M8 20L16 4"
      />
      <path
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M5 20H12"
      />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M5.5 3V11.5C5.5 15.0899 8.41015 18 12 18C15.5899 18 18.5 15.0899 18.5 11.5V3"
      />
      <path
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M3 21H21"
      />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M4 12H20"
      />
      <path
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M17.5 7.66667C17.5 5.08934 15.0376 3 12 3C8.96243 3 6.5 5.08934 6.5 7.66667C6.5 8.15279 6.55336 8.59783 6.6668 9M6 16.3333C6 18.9107 8.68629 21 12 21C15.3137 21 18 19.6667 18 16.3333C18 13.9404 16.9693 12.5782 14.9079 12"
      />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        r="10"
        cy="12"
        cx="12"
      />
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15"
      />
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={3}
        stroke="currentColor"
        d="M8.00897 9L8 9M16 9L15.991 9"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      height="18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M12 5L12 20"
      />
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth={2.5}
        stroke="currentColor"
        d="M7 9L11.2929 4.70711C11.6262 4.37377 11.7929 4.20711 12 4.20711C12.2071 4.20711 12.3738 4.37377 12.7071 4.70711L17 9"
      />
    </svg>
  );
}
