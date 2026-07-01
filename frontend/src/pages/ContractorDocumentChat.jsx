import { useEffect, useMemo, useState } from "react";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";
import {
  createChat,
  getChatDetails,
  getChats,
  sendChatMessage,
} from "../services/chatApi";

function DocumentChat() {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const questions = [
    "What are the concrete specifications for the foundation work?",
    "Summarize the MEP scope of work",
    "What certifications are contractors required to have?",
    "What is the penalty clause for delays?",
    "Compare the BOQ for structural steel across all submissions",
  ];

  const chatHistory = [
    "Foundation material questions",
    "BOQ pricing discussion",
    "MEP scope clarification",
  ];

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedTenderId) {
      return;
    }

    setSending(true);
    setError("");

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const createResponse = await createChat(
          selectedTenderId,
          selectedTender?.title
            ? `Chat for ${selectedTender.title}`
            : "Document Chat",
        );
        chatId = createResponse.data.id;
        setActiveChatId(chatId);
        await loadChats(selectedTenderId);
      }

      const sendResponse = await sendChatMessage(chatId, trimmedMessage);
      const assistantAnswer = sendResponse.data.answer || "";

      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "user", content: trimmedMessage },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantAnswer,
        },
      ]);
      setMessage("");
    } catch (err) {
      console.error("Send message error:", err.response?.data || err);
      setError("Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const loadChats = async (tenderId) => {
    setError("");

    try {
      const response = await getChats(tenderId);
      const list = Array.isArray(response.data)
        ? response.data
        : response.data.tenders || response.data.results || [];
      setChats(list);

      if (list.length > 0) {
        setActiveChatId(list[0].id);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Load chats error:", err.response?.data || err);
      setError("Unable to load chat history.");
    }
  };

  const loadChatMessages = async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError("");

    try {
      const response = await getChatDetails(chatId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Load messages error:", err.response?.data || err);
      setError("Unable to load chat messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        setTenders(list);

        if (list.length > 0) {
          setSelectedTenderId(String(list[0].id));
        }
      })
      .catch((error) => {
        console.error("Load tenders error:", error.response?.data || error);
      });
  }, []);

  useEffect(() => {
    if (selectedTenderId) {
      loadChats(selectedTenderId);
    }
  }, [selectedTenderId]);

  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    }
  }, [activeChatId]);

  return (
    <ContractorLayout activePage="document-chat">
      <section className="document-chat-page">
        <aside className="document-panel">
          <div className="document-title">
            <h4>
              <i className="bi bi-cpu text-primary"></i>
              Document Chat
            </h4>

            <div className="chat-tender-dropdown-wrap">
              <button
                type="button"
                className="chat-tender-dropdown-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <div>
                  <strong>{selectedTender?.title || "Select tender"}</strong>
                  <span>Choose tender documents</span>
                </div>

                <i
                  className={`bi ${
                    dropdownOpen ? "bi-chevron-up" : "bi-chevron-down"
                  }`}
                ></i>
              </button>

              {dropdownOpen && (
                <div className="chat-tender-dropdown-menu">
                  {tenders.length === 0 ? (
                    <div className="chat-dropdown-empty">No tenders found</div>
                  ) : (
                    tenders.map((tender) => (
                      <button
                        type="button"
                        key={tender.id}
                        className={
                          String(tender.id) === selectedTenderId ? "active" : ""
                        }
                        onClick={() => {
                          setSelectedTenderId(String(tender.id));
                          setDropdownOpen(false);
                        }}
                      >
                        <strong>{tender.title || `Tender ${tender.id}`}</strong>
                        <span>{tender.location || "N/A"}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="history-section">
            <h6>CHAT HISTORY</h6>

            {chats.length === 0 ? (
              <p className="chat-empty-text">
                No chat history yet. Start a new conversation.
              </p>
            ) : (
              chats.map((item) => (
                <button
                  key={item.id}
                  className={item.id === activeChatId ? "active" : ""}
                  onClick={() => handleSelectChat(item.id)}
                >
                  <i className="bi bi-clock-history"></i>
                  {item.title || `Chat ${item.id}`}
                </button>
              ))
            )}
          </div>

          <div className="suggested-section">
            <h6>SUGGESTED QUESTIONS</h6>

            {questions.map((question) => (
              <button key={question} onClick={() => setMessage(question)}>
                {question}
              </button>
            ))}
          </div>
        </aside>

        <main className="chat-area">
          <div className="chat-messages">
            {error && <div className="chat-error">{error}</div>}

            <div className="chat-message-row">
              <div className="ai-chat-icon">
                <i className="bi bi-stars"></i>
              </div>

              <div className="chat-bubble">
                <p>
                  Hello! I'm your BuildTender AI assistant. Ask me anything
                  about{" "}
                  <strong>{selectedTender?.title || "this tender"}</strong>.
                </p>

                <p>
                  I can help with scope of work, pricing details, material
                  specifications, compliance requirements, and contractor
                  requirements.
                </p>
              </div>
            </div>

            {loadingMessages ? (
              <div className="chat-loading">Loading messages...</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message-row ${msg.role === "assistant" ? "assistant" : "user"}`}
                >
                  <div className={`chat-icon ${msg.role}`}>
                    <i
                      className={
                        msg.role === "assistant"
                          ? "bi bi-robot"
                          : "bi bi-person"
                      }
                    ></i>
                  </div>

                  <div className="chat-bubble">
                    <p>{msg.content}</p>
                    <div className="chat-meta">
                      <span>
                        {msg.role === "assistant" ? "BuildTender AI" : "You"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-bottom">
            <div className="chat-input-area">
              <div className="chat-input-column">
                <div className="chat-input-box">
                  <textarea
                    placeholder="Ask anything about this tender's documents..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <div className="chat-input-footer">
                    <span>Shift+Enter for new line</span>
                  </div>
                </div>

                <p className="chat-note">
                  AI answers are grounded in tender documents. Always verify
                  critical information.
                </p>
              </div>

              <button
                className="send-chat-btn"
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
              >
                {sending ? "Sending..." : <i className="bi bi-send"></i>}
              </button>
            </div>
          </div>
        </main>
      </section>
    </ContractorLayout>
  );
}

export default DocumentChat;
