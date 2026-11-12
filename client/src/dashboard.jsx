import React, { useState } from "react";

function Dashboard() {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [message, setMessage] = useState("");

    const conversations = [
        { id: 1, username: "John" },
        { id: 2, username: "Sarah" },
        { id: 3, username: "Client XYZ" }
    ];

    const handleSend = () => {
        if (!message.trim()) return;

        console.log("Message sent:", message);

        setMessage("");
    };

    return (
        <div className="min-h-screen bg-[#dfe7ef] flex">

            {/* Conversations */}
            <div className="w-1/3 max-w-sm bg-white border-r">

                <div className="p-5 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Messages
                    </h1>
                </div>

                <div>
                    {conversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() =>
                                setSelectedConversation(conversation)
                            }
                            className="w-full text-left px-5 py-4 hover:bg-gray-100 border-b"
                        >
                            <p className="font-semibold text-gray-800">
                                @{conversation.username}
                            </p>

                            <p className="text-sm text-gray-500">
                                Click to open conversation
                            </p>
                        </button>
                    ))}
                </div>

            </div>

            {/* Conversation */}
            <div className="flex-1 flex flex-col">

                {selectedConversation ? (
                    <>
                        <div className="bg-white border-b p-5">
                            <h2 className="text-xl font-bold">
                                @{selectedConversation.username}
                            </h2>
                        </div>

                        <div className="flex-1 p-6">
                            <p className="text-gray-500">
                                No messages yet.
                            </p>
                        </div>

                        <div className="bg-white border-t p-4 flex gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border rounded-lg px-4 py-2"
                            />

                            <button
                                onClick={handleSend}
                                className="bg-[#0C67A0] text-white px-5 py-2 rounded-lg hover:bg-[#0A5C8A]"
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">
                            Select a conversation to start messaging.
                        </p>
                    </div>
                )}

            </div>

        </div>
    );
}

export default Dashboard;