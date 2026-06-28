// import OwnerLayout from "../components/ContractorLayout";

// function DocumentChat() {
//   const documents = [
//     "All Documents",
//     "BOQ_Eastfield_Tower.xlsx",
//     "Arch_Drawings_v3.pdf",
//     "Structural_Layout.pdf",
//     "Technical_Specifications.docx",
//   ];

//   const questions = [
//     "What are the concrete specifications for the foundation work?",
//     "Summarize the MEP scope of work",
//     "What certifications are contractors required to have?",
//     "What is the penalty clause for delays?",
//     "Compare the BOQ for structural steel across all submissions",
//   ];

//   return (
//     <OwnerLayout activePage="document-chat">
//       <section className="document-chat-page">
//         <aside className="document-panel">
//           <div className="document-title">
//             <h4>
//               <i className="bi bi-cpu text-primary"></i>
//               Document Chat
//             </h4>

//             <div className="project-card">
//               <strong>Eastfield Tower Complex</strong>
//               <p>4 documents · 248 pages indexed</p>
//             </div>
//           </div>

//           <div className="scope-section">
//             <h6>SCOPE FILTER</h6>

//             {documents.map((doc, index) => (
//               <button className={index === 0 ? "active" : ""} key={doc}>
//                 <i className="bi bi-file-earmark-text"></i>
//                 {doc}
//               </button>
//             ))}
//           </div>

//           <div className="suggested-section">
//             <h6>SUGGESTED QUESTIONS</h6>

//             {questions.map((question) => (
//               <button key={question}>{question}</button>
//             ))}
//           </div>
//         </aside>

//         <main className="chat-area">
//           <div className="chat-messages">
//             <div className="chat-message-row">
//               <div className="ai-chat-icon">
//                 <i className="bi bi-stars"></i>
//               </div>

//               <div className="chat-bubble">
//                 <p>
//                   Hello! I'm your BuildTender AI assistant. I've analyzed all
//                   documents for <strong>Eastfield Tower Complex</strong> — the
//                   BOQ (247 line items), 2 drawing sets, and technical
//                   specifications.
//                 </p>

//                 <p>
//                   Ask me anything about the tender documents — pricing details,
//                   scope of work, material specifications, compliance
//                   requirements, or contractor requirements.
//                 </p>

//                 <div className="chat-actions">
//                   <div>
//                     <button>
//                       <i className="bi bi-hand-thumbs-up"></i>
//                     </button>
//                     <button>
//                       <i className="bi bi-hand-thumbs-down"></i>
//                     </button>
//                     <button>
//                       <i className="bi bi-copy"></i>
//                     </button>
//                   </div>

//                   <span>09:40 AM</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="chat-bottom">
//             <div className="chat-input-area">
//               <div className="chat-input-column">
//                 <div className="chat-input-box">
//                   <textarea placeholder="Ask anything about this tender's documents..."></textarea>

//                   <div className="chat-input-footer">
//                     <span>
//                       <i className="bi bi-paperclip"></i>
//                       Shift+Enter for new line
//                     </span>
//                   </div>
//                 </div>

//                 <p className="chat-note">
//                   AI answers are grounded in your uploaded documents. Always
//                   verify critical information.
//                 </p>
//               </div>

//               <button className="send-chat-btn">
//                 <i className="bi bi-send"></i>
//               </button>
//             </div>
//           </div>
//         </main>
//       </section>
//     </OwnerLayout>
//   );
// }

// export default DocumentChat;
import { useEffect, useMemo, useState } from "react";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";

function DocumentChat() {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");

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

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

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

            {chatHistory.map((item) => (
              <button key={item}>
                <i className="bi bi-clock-history"></i>
                {item}
              </button>
            ))}
          </div>

          <div className="suggested-section">
            <h6>SUGGESTED QUESTIONS</h6>

            {questions.map((question) => (
              <button
                key={question}
                onClick={() => setMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </aside>

        <main className="chat-area">
          <div className="chat-messages">
            <div className="chat-message-row">
              <div className="ai-chat-icon">
                <i className="bi bi-stars"></i>
              </div>

              <div className="chat-bubble">
                <p>
                  Hello! I'm your BuildTender AI assistant. Ask me anything about{" "}
                  <strong>{selectedTender?.title || "this tender"}</strong>.
                </p>

                <p>
                  I can help with scope of work, pricing details, material
                  specifications, compliance requirements, and contractor
                  requirements.
                </p>

                <div className="chat-actions">
                  <div>
                    <button>
                      <i className="bi bi-hand-thumbs-up"></i>
                    </button>
                    <button>
                      <i className="bi bi-hand-thumbs-down"></i>
                    </button>
                    <button>
                      <i className="bi bi-copy"></i>
                    </button>
                  </div>

                  <span>09:40 AM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chat-bottom">
            <div className="chat-input-area">
              <div className="chat-input-column">
                <div className="chat-input-box">
                  <textarea
                    placeholder="Ask anything about this tender's documents..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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

              <button className="send-chat-btn">
                <i className="bi bi-send"></i>
              </button>
            </div>
          </div>
        </main>
      </section>
    </ContractorLayout>
  );
}

export default DocumentChat;