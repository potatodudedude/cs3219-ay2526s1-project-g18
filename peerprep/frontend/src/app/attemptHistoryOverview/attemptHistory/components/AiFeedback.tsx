"use client";

/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5 Thinking), Copilot (model: GPT-5 Mini), date: 2025‑11‑12, 2025-11-13
Scope: Based on my strict specifications and following the base structure from code I provided, it generated implementation for setInitFeedback and sendFollowUp functions, UI scroll behavior, message rendering helper, pretty Feedback display UI.
Author review: I validated correctness, fixed bugs and parts where it did not follow my exact specifications, edited for style, added checks and accounted for edge cases.
*/

import { Sparkles, ChevronDown, ChevronUp, Repeat } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string
  id?: string;
}

type Feedback = {
  score: "Needs Improvement" | "Good" | "Excellent";
  general_feedback: string;
  correctness: string;
  efficiency: string;
  clarity: string;
  improvements: string[];
};

// AI generated
function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

const ASKS_LIMIT = 8;

export default function AiFeedback({codeAttempt, question}: {codeAttempt: string, question: string}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [initialFeedback, setInitialFeedback] = useState<Feedback| null>(null);
  const [isLoading, setIsLoading] = useState(false); //AI generated
  const [error, setError] = useState<string | null>(null); //AI generated
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({}); //AI generated
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [initFeedbackId, setInitFeedbackId] = useState<string | null>(null);
  const asksLeft = useRef<number>(ASKS_LIMIT);

  useEffect(() => {
    if (!codeAttempt || !question) return;
    sendInitFeedback(codeAttempt, question);
  }, [codeAttempt, question]);

  // AI generated UI scroll
  // auto-scroll when messages update 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //when enter is pressed in textarea, call the sendFollowUp function
  // AI generated, edited by Prisha to include checks
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!initialFeedback || isLoading || !input.trim() || asksLeft.current <= 0) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendFollowUp(input);
    }
  }

  const sendInitFeedback = async (codeAttempt: string, question: string)   => {
    // AI generated, edited by Prisha
    setError(null);
    setIsLoading(true);
    setInitialFeedback(null);

    // Create the user message content exactly how backend expects when providing codeAttempt/question
    const userContent = `User's code attempt:\n${codeAttempt}\n\nQuestion:\n${question}. Please rate and give structured feedback in JSON.`;

    // Add user message locally (so UI shows the submission immediately)
    const userMsg: Message = { role: "user", content: userContent, id: makeId() };
    setMessages([userMsg]);

    try {
      const res = await fetch("/api/ai_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeAttempt, question }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      // create assistant placeholder and stream into it
      const assistantMsg: Message = { role: "assistant", content: "", id: makeId() };
      setMessages((prev) => [...prev, assistantMsg]);

      // stream the response and append progressively
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          assistantContent += decoder.decode(value, { stream: true });
        }
      }

      assistantContent += decoder.decode();
      let contentToParse = assistantContent.trim();
      console.log("Full assistant content:", contentToParse);
      // from here onwards is largely my edits
      if (!contentToParse.startsWith("{")) {
        console.log("Fixing JSON format by adding braces");
        contentToParse = "{ \n" + contentToParse;
        console.log("After adding opening brace:", contentToParse);
      }
      if (!contentToParse.endsWith("}")) {
        console.log("Fixing JSON format by adding closing brace");
        contentToParse = contentToParse + "\n }";
        console.log("After adding closing brace:", contentToParse);
      }

      const parsed = JSON.parse(contentToParse);
      setInitialFeedback(parsed);
      const feedbackId = makeId();
      setInitFeedbackId(feedbackId);
      setMessages([{ role: "assistant", content: JSON.stringify(parsed, null, 2), id: feedbackId }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
      setMessages([{ role: "assistant", content: `Error: ${err.message}`, id: makeId() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFollowUp = async (prompt: string) => {
    // AI generated, edited by Prisha
    if (!prompt.trim()) return;
    setError(null);
    setIsLoading(true);

    // Add user message locally immediately
    const userMsg: Message = { role: "user", content: prompt, id: makeId() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    asksLeft.current -= 1;

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      // I added this as it was missing 
      const assistantMsg: Message = { role: "assistant", content: "", id: makeId() }; 
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m, idx) => (idx === prev.length - 1 ? { ...m, content: assistantContent } : m))
          );
        }
      }

      assistantContent += decoder.decode();
      setMessages((prev) => prev.map((m, idx) => (idx === prev.length - 1 ? { ...m, content: assistantContent } : m)));
    } catch (err: any) {
      console.error("sendFollowUp error:", err);
      setError(err.message || "Unknown error");
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message || "Unknown"}`, id: makeId() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // AI generated, edited by Prisha to improve style
  // helper to render simple message cards 
  const renderMessage = (m: Message, i: number) => { 
    const isUser = m.role === "user"; 
    return ( 
    <div key={m.id ?? i} className="w-full">
      {isUser && (<div className="mb-3 text-right"> 
        <div className="inline-block max-w-full text-left wrap-break-word px-4 py-3 rounded-2xl bg-purple-button text-white" > 
          <span className="whitespace-pre-wrap text-m">
            {m.content}
          </span> 
        </div> 
      </div>)
      }
      {//this part is added by Prisha
      !isUser && m.id !== initFeedbackId && (
    <div className="mb-3">
      <div className="inline-block text-justify max-w-full wrap-break-word whitespace-pre-wrap text-m px-4 py-3 text-white">
        <span>
          {m.content}
        </span>
      </div>
    </div>
  )}
    </div>
    ); 
  };
  
  //AI generated
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  //AI generated
  const scoreSegments = (score: string) => {
    switch (score) {
      case "Needs Improvement":
        return [true, false, false];
      case "Good":
        return [true, true, false];
      case "Excellent":
        return [true, true, true];
      default:
        return [false, false, false];
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case "Needs Improvement":
        return "bg-red-outline";
      case "Good":
        return "bg-yellow-outline";
      case "Excellent":
        return "bg-green-outline";
      default:
        return "bg-light-box";
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="pt-4 pb-4 px-4 bg-light-box rounded-t-3xl flex items-center gap-2">
        <p className="text-white flex items-center gap-2 font-poppins text-xl font-bold">
          AI Feedback
          <Sparkles className="text-white w-4 h-4" />
        </p>
      </div>

      <div className="text-white flex-1 px-4 py-4 flex flex-col justify-between overflow-hidden relative bg-dark-box rounded-b-3xl">
        <div className="overflow-y-auto pr-4 pb-4" style={{ maxHeight: "60vh" }}>
          {initialFeedback ? (
            <div className="space-y-4">
              {/* Score section - AI generated, edited by Prisha */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Score: {initialFeedback.score}</span>
                  <div className="flex gap-1">
                    {scoreSegments(initialFeedback.score).map((filled, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-4 rounded ${
                          idx === 0
                            ? filled
                              ? getScoreColor(initialFeedback.score)
                              : "bg-light-box"
                            : idx === 1
                            ? filled
                              ? getScoreColor(initialFeedback.score)
                              : "bg-light-box"
                            : filled
                            ? getScoreColor(initialFeedback.score)
                            : "bg-light-box"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* General feedback - AI generated, style improved by Prisha */}
                <div className="bg-black-box rounded-md p-3 text-white">
                  {initialFeedback.general_feedback}
                </div>
              </div>

              {/* Expandable sections - AI generated, style improved by Prisha */}
              {["correctness", "efficiency", "clarity", "improvements"].map((key) => (
                <div key={key} className="border border-text-dark-purple rounded-md ">
                  <button
                    className="flex justify-between w-full px-4 py-2 text-left text-white font-semibold hover:bg-black-box"
                    onClick={() => toggleSection(key)}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {expandedSections[key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections[key] && (
                    <div className="px-4 py-2 text-white">
                      {key === "improvements" ? (
                        <ul className="list-disc list-inside space-y-1">
                          {initialFeedback.improvements.map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{(initialFeedback as any)[key]}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4"> 
                {messages.map((m, i) => renderMessage(m, i))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : ( error ? (
            <div className="text-text-error italic flex justify-end">
              Error generating feedback.
              <Repeat className="h-12 w-12" onClick={() => sendInitFeedback(codeAttempt, question)}/>
            </div>
          ) :
            <div className="text-text-grey font-semibold italic">
              Generating AI feedback...
            </div>
          )}
        </div>

        {/* Follow-up input */}
        {initialFeedback && 
        (<div className="mt-1 shrink-0 w-full bg-black-box p-4 rounded-xl relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-white px-4 py-2 resize-none h-20 border-none outline-none font-poppins"
            placeholder={
              initialFeedback ? "Type a follow-up question..." : "Waiting for initial feedback..."
            }
            disabled={!initialFeedback}
          />

          <div className="flex items-center justify-end gap-2">
            <span className={`${asksLeft.current <= 0 ? "text-text-error" : "text-text-grey"} absolute left-4 bottom-3`}>Asks left: {asksLeft.current} / {ASKS_LIMIT} </span>
            <button
              className={`px-4 py-2 rounded-lg text-white ${
                isLoading ? "bg-light-box" : "bg-purple-button hover:bg-blue-button-hover"
              } disabled:bg-light-box`}
              onClick={() => sendFollowUp(input)}
              disabled={!initialFeedback || isLoading || !input.trim() || asksLeft.current <= 0}
            >
              {isLoading ? "Thinking..." : "Ask"}
            </button>
            {error && <div className="ml-auto text-sm text-text-error">{error}</div>}
          </div>
        </div>)}
      </div>
    </div>
  );
}