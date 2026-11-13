import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./api.js";

// Markers wrapped around the question context that is sent with each message
const CONTEXT_START = "<<CONTEXT>>";
const CONTEXT_END = "<<END_CONTEXT>>";
const CONTEXT_REGEX = /<<CONTEXT>>[\s\S]*?<<END_CONTEXT>>\s*/g;

// Hides the context part so only what the user typed is shown
function stripContext(text) {
    return typeof text === "string" ? text.replace(CONTEXT_REGEX, "") : text;
}

// Bot messages with content_type "json" hold the 10 generated interview questions
function parseQuestions(content) {
    try {
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

// Turns the initial questions into plain text that goes along with every message
function buildContext(questions) {
    const lines = questions.map((q, i) => {
        const meta = [q.category, q.difficulty].filter(Boolean).join(", ");
        return `${q.question_number ?? i + 1}. ${q.question}${
            meta ? ` (${meta})` : ""
        }`;
    });

    return (
        `${CONTEXT_START}\n` +
        `Background: these are the interview questions generated for this chat from the user's document. ` +
        `Use them as context when replying.\n` +
        `${lines.join("\n")}\n` +
        `${CONTEXT_END}\n\n`
    );
}

function MessageBubble({ msg }) {
    const isUser = msg.role === "user";
    const questions =
        msg.content_type === "json" ? parseQuestions(msg.content) : null;

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[75%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                    isUser
                        ? "bg-[#0C67A0] text-white"
                        : "bg-white text-gray-800 border"
                }`}
            >
                {questions ? (
                    <div className="space-y-3">
                        <p className="font-semibold">Interview questions</p>
                        {questions.map((q, i) => (
                            <div key={q.question_number ?? i}>
                                <p>
                                    {q.question_number ?? i + 1}. {q.question}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {[q.category, q.difficulty]
                                        .filter(Boolean)
                                        .join(" • ")}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    stripContext(msg.content)
                )}
            </div>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    // New chat form
    const [showNewChat, setShowNewChat] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newFile, setNewFile] = useState(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);
    const selectedIdRef = useRef(null);

    const handleUnauthorized = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        navigate("/login");
    };

    // Load all chats when the dashboard opens (after login or signup)
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetch(`${API_URL}/api/history/get`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(async (response) => {
                if (response.status === 401) {
                    handleUnauthorized();
                    return null;
                }
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || "Could not load chats."
                    );
                }
                return response.json();
            })
            .then((data) => {
                if (data) setHistory(data.history || []);
            })
            .catch((err) => {
                console.error("Error:", err);
                setError(err.message);
            })
            .finally(() => setLoadingHistory(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the newest message in view
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loadingMessages]);

    const selectChat = (chat) => {
        setSelectedConversation(chat);
        selectedIdRef.current = chat.history_id;
        setMessages([]);
        setError("");
        setLoadingMessages(true);

        fetch(`${API_URL}/api/message/get`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ history_id: chat.history_id })
        })
            .then(async (response) => {
                if (response.status === 401) {
                    handleUnauthorized();
                    return null;
                }
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || "Could not load messages."
                    );
                }
                return response.json();
            })
            .then((data) => {
                // Ignore the response if the user already switched to another chat
                if (!data || selectedIdRef.current !== chat.history_id) return;
                // API returns newest first, so reverse for display
                setMessages([...(data.messages || [])].reverse());
            })
            .catch((err) => {
                console.error("Error:", err);
                if (selectedIdRef.current === chat.history_id) {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (selectedIdRef.current === chat.history_id) {
                    setLoadingMessages(false);
                }
            });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setCreateError("Please select a PDF file.");
            e.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setCreateError("PDF must be smaller than 10 MB.");
            e.target.value = "";
            return;
        }

        setCreateError("");
        setNewFile(file);
    };

    const resetNewChatForm = () => {
        setNewTitle("");
        setNewFile(null);
        setCreateError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCreateChat = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || creating) return;

        setCreating(true);
        setCreateError("");

        try {
            let response;

            if (newFile) {
                // With a document: multipart/form-data (browser sets the boundary itself)
                const formData = new FormData();
                formData.append("title", newTitle.trim());
                formData.append("document", newFile);

                response = await fetch(`${API_URL}/api/history/new`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
            } else {
                response = await fetch(`${API_URL}/api/history/new`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title: newTitle.trim() })
                });
            }

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Could not create chat.");
            }

            const chat = data.history;
            setHistory((prev) => [chat, ...prev]);
            setShowNewChat(false);
            resetNewChatForm();
            // Opens the chat and loads its messages (including generated questions for PDFs)
            selectChat(chat);
        } catch (err) {
            console.error("Error:", err);
            setCreateError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleSend = async () => {
        const typed = message.trim();
        if (!typed || !selectedConversation || sending || loadingMessages)
            return;

        const historyId = selectedConversation.history_id;
        const tempId = `temp-${Date.now()}`;

        // Find the initial 10 questions of this chat (the first bot "json" message)
        const questionsMsg = messages.find(
            (m) => m.role === "bot" && m.content_type === "json"
        );
        const questions = questionsMsg
            ? parseQuestions(questionsMsg.content)
            : null;

        // Questions go in front of the typed text so the backend has some history
        const content =
            (questions && questions.length ? buildContext(questions) : "") +
            typed;

        // Show only what the user typed
        setMessages((prev) => [
            ...prev,
            {
                message_id: tempId,
                content: typed,
                content_type: "text",
                role: "user"
            }
        ]);
        setMessage("");
        setSending(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/message/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    history_id: historyId,
                    role: "user"
                })
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Could not send message.");
            }

            // Only update the screen if the user is still in the same chat
            if (selectedIdRef.current === historyId) {
                setMessages((prev) => [
                    ...prev.filter((m) => m.message_id !== tempId),
                    data.message,
                    data.botResponse
                ]);
            }
        } catch (err) {
            console.error("Error:", err);
            if (selectedIdRef.current === historyId) {
                setMessages((prev) =>
                    prev.filter((m) => m.message_id !== tempId)
                );
                setMessage(typed);
                setError(err.message);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-screen bg-[#dfe7ef] flex">

            {/* Conversations */}
            <div className="w-1/3 max-w-sm bg-white border-r flex flex-col">

                <div className="p-5 border-b flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Messages
                    </h1>

                    <button
                        onClick={() => {
                            setShowNewChat(!showNewChat);
                            resetNewChatForm();
                        }}
                        className="bg-[#0C67A0] text-white px-3 py-1 rounded-lg hover:bg-[#0A5C8A]"
                    >
                        {showNewChat ? "Cancel" : "+ New"}
                    </button>
                </div>

                {showNewChat && (
                    <form
                        onSubmit={handleCreateChat}
                        className="p-4 border-b space-y-3"
                    >
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Chat title"
                            required
                            className="w-full border rounded-lg px-4 py-2"
                        />

                        <input
                            type="file"
                            accept="application/pdf,.pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                        >
                            {newFile ? "Change PDF" : "Attach PDF (optional)"}
                        </button>

                        {newFile && (
                            <p className="text-sm text-gray-500 break-all">
                                Selected: {newFile.name}
                            </p>
                        )}

                        {createError && (
                            <p className="text-sm text-red-500">
                                {createError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={creating || !newTitle.trim()}
                            className="w-full bg-[#0C67A0] text-white px-5 py-2 rounded-lg hover:bg-[#0A5C8A] disabled:opacity-50"
                        >
                            {creating ? "Creating..." : "Create chat"}
                        </button>
                    </form>
                )}

                <div className="flex-1 overflow-y-auto">
                    {loadingHistory ? (
                        <p className="p-5 text-gray-500">Loading chats...</p>
                    ) : history.length === 0 ? (
                        <p className="p-5 text-gray-500">
                            No chats yet. Create a new one.
                        </p>
                    ) : (
                        history.map((conversation) => (
                            <button
                                key={conversation.history_id}
                                onClick={() => selectChat(conversation)}
                                className={`w-full text-left px-5 py-4 hover:bg-gray-100 border-b ${
                                    selectedConversation?.history_id ===
                                    conversation.history_id
                                        ? "bg-gray-100"
                                        : ""
                                }`}
                            >
                                <p className="font-semibold text-gray-800">
                                    {conversation.title}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {conversation.pdf
                                        ? "PDF attached • "
                                        : ""}
                                    {conversation.created_at
                                        ? new Date(
                                              conversation.created_at
                                          ).toLocaleDateString()
                                        : "Click to open conversation"}
                                </p>
                            </button>
                        ))
                    )}
                </div>

            </div>

            {/* Conversation */}
            <div className="flex-1 flex flex-col min-w-0">

                {selectedConversation ? (
                    <>
                        <div className="bg-white border-b p-5">
                            <h2 className="text-xl font-bold">
                                {selectedConversation.title}
                            </h2>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-3">
                            {loadingMessages ? (
                                <p className="text-gray-500">
                                    Loading messages...
                                </p>
                            ) : messages.length === 0 ? (
                                <p className="text-gray-500">
                                    No messages yet.
                                </p>
                            ) : (
                                messages.map((msg, index) => (
                                    <MessageBubble
                                        key={msg.message_id || msg._id || index}
                                        msg={msg}
                                    />
                                ))
                            )}

                            {sending && (
                                <p className="text-sm text-gray-500">
                                    Waiting for reply...
                                </p>
                            )}

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        <div className="bg-white border-t p-4 flex gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSend();
                                }}
                                placeholder="Type a message..."
                                className="flex-1 border rounded-lg px-4 py-2"
                            />

                            <button
                                onClick={handleSend}
                                disabled={sending || loadingMessages}
                                className="bg-[#0C67A0] text-white px-5 py-2 rounded-lg hover:bg-[#0A5C8A] disabled:opacity-50"
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-gray-500">
                            Select a conversation to start messaging.
                        </p>
                        {error && (
                            <p className="mt-3 text-sm text-red-500">{error}</p>
                        )}
                    </div>
                )}

            </div>

        </div>
    );
}

export default Dashboard;