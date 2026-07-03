import { useEffect, useMemo, useState } from "react";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";
import {
  createChat,
  deleteChat,
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
  ];

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedTenderId) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmedMessage },
    ]);
    setMessage("");
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

  const handleAddNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setMessage("");
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        console.log("Attempting to delete chat:", chatId);
        const response = await deleteChat(chatId);
        console.log("Delete response:", response);
        
        // Update state to remove the chat
        const updatedChats = chats.filter((c) => c.id !== chatId);
        console.log("Updated chats list:", updatedChats);
        setChats(updatedChats);
        
        if (activeChatId === chatId) {
          console.log("Deleted chat was active, clearing active chat");
          setActiveChatId(null);
          setMessages([]);
        }
        setError(""); // Clear any previous errors
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message || err.toString();
        console.error("Delete chat error:", errorMsg);
        setError("Unable to delete chat. " + errorMsg);
      }
    }
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
      <section className="gpt-chat-container">
        {/* القائمة الجانبية الداكنة - كـ ChatGPT Sidebar */}
        <aside className="gpt-sidebar">
          <div className="sidebar-top">
            <button className="gpt-new-chat-btn" onClick={handleAddNewChat}>
              <i className="bi bi-plus-lg"></i>
              <span>New chat</span>
            </button>
          </div>

          <div className="sidebar-dropdown-area">
            <label className="sidebar-label">Active Tender</label>
            <div className="chat-tender-dropdown-wrap">
              <button
                type="button"
                className="chat-tender-dropdown-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <div>
                  <strong>{selectedTender?.title || "Select tender"}</strong>
                </div>
                <i
                  className={`bi ${dropdownOpen ? "bi-chevron-up" : "bi-chevron-down"}`}
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
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="gpt-history-section">
            <span className="history-title">Recent Chats</span>
            <div className="gpt-history-list">
              {chats.map((item) => (
                <div
                  key={item.id}
                  className={`gpt-history-item ${item.id === activeChatId ? "active" : ""}`}
                  onClick={() => handleSelectChat(item.id)}
                >
                  <div className="gpt-item-title">
                    <i className="bi bi-chat-left-text"></i>
                    <span>{item.title || `Chat ${item.id}`}</span>
                  </div>
                  <button
                    className="gpt-delete-btn"
                    onClick={(e) => handleDeleteChat(e, item.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* منطقة المحادثة الرئيسية الواسعة */}
        <main className="gpt-main-chat">
          <header className="gpt-chat-header">
            <span>BuildTender AI v2.0</span>
          </header>

          <div className="gpt-messages-container">
            {error && <div className="gpt-alert-error">{error}</div>}

            {/* رسالة الترحيب الافتراضية بنظام كتل ChatGPT */}
            <div className="gpt-row assistant-row">
              <div className="gpt-avatar assistant-avatar">
                <i className="bi bi-robot"></i>
              </div>
              <div className="gpt-content">
                <h5>BuildTender Assistant</h5>
                <p>
                  Hello! I'm your AI assistant grounded in your tender
                  documents. Ask me anything about{" "}
                  <strong>{selectedTender?.title || "this tender"}</strong>.
                </p>
                <p>
                  I can analyze the scope of work, Bill of Quantities (BOQ), and
                  penalty clauses efficiently.
                </p>
              </div>
            </div>

            {loadingMessages ? (
              <div className="gpt-loading">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Loading conversation...
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`gpt-row ${msg.role === "assistant" ? "assistant-row" : "user-row"}`}
                >
                  <div
                    className={`gpt-avatar ${msg.role === "assistant" ? "assistant-avatar" : "user-avatar"}`}
                  >
                    <i
                      className={
                        msg.role === "assistant"
                          ? "bi bi-robot"
                          : "bi bi-person-fill"
                      }
                    ></i>
                  </div>
                  <div className="gpt-content">
                    <h5>
                      {msg.role === "assistant" ? "BuildTender AI" : "You"}
                    </h5>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* الجزء السفلي العائم للأسئلة والمستطيل الاحترافي */}
          <div className="gpt-footer-area">
            <div className="gpt-footer-wrapper">
              {/* الأسئلة المقترحة كبطاقات فوق حقل الكتابة مباشرة */}
              <div className="gpt-suggestions-grid">
                {questions.map((question) => (
                  <button
                    key={question}
                    className="gpt-suggestion-card"
                    onClick={() => setMessage(question)}
                  >
                    <span className="card-text">{question}</span>
                    <i className="bi bi-arrow-up-short card-icon"></i>
                  </button>
                ))}
              </div>

              {/* صندوق المدخلات مثل ChatGPT تماماً */}
              <div className="gpt-input-container">
                <textarea
                  placeholder="Message BuildTender AI..."
                  rows="1"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  className="gpt-send-btn"
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                >
                  {sending ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-arrow-up-circle-fill"></i>
                  )}
                </button>
              </div>
              <p className="gpt-disclaimer">
                AI can make mistakes. Verify critical tender specifications.
              </p>
            </div>
          </div>
        </main>
      </section>
    </ContractorLayout>
  );
}

export default DocumentChat;
