
// import { useState } from "react";
// import OwnerLayout from "../components/ContractorLayout";

// function Notifications() {
//   const [notifications, setNotifications] = useState([
//     {
//       id: 1,
//       type: "danger",
//       icon: "bi-exclamation-triangle",
//       title: "High Risk Alert — Anomalous Pricing Detected",
//       text: "Peak Contracting LLC's bid for Eastfield Tower Complex is 34% below market average. Immediate review recommended.",
//       time: "2 hours ago",
//       project: "Eastfield Tower Complex",
//       priority: "High",
//     },
//     {
//       id: 2,
//       type: "warning",
//       icon: "bi-clock",
//       title: "Submission Deadline in 18 Days",
//       text: "Eastfield Tower Complex tender deadline is June 28, 2026. Currently 12 of 47 invited contractors have submitted.",
//       time: "4 hours ago",
//       project: "Eastfield Tower Complex",
//       priority: "High",
//     },
//     {
//       id: 3,
//       type: "info",
//       icon: "bi-file-earmark-text",
//       title: "New Proposal Received",
//       text: "Vertex Construction has submitted their proposal for Eastfield Tower Complex. Review is pending.",
//       time: "6 hours ago",
//       project: "Eastfield Tower Complex",
//       priority: "Medium",
//     },
//     {
//       id: 4,
//       type: "success",
//       icon: "bi-check-circle",
//       title: "AI Evaluation Complete",
//       text: "AI evaluation for Al Noor Medical Center Expansion is complete. 8 proposals scored and ranked. Ready for review.",
//       time: "Yesterday",
//       project: "Al Noor Medical Center",
//       priority: "Medium",
//     },
//     {
//       id: 5,
//       type: "purple",
//       icon: "bi-people",
//       title: "5 New Contractor Registrations",
//       text: "5 contractors have registered on the platform and requested access to active tenders.",
//       time: "Yesterday",
//       project: "",
//       priority: "Low",
//     },
//     {
//       id: 6,
//       type: "warning",
//       icon: "bi-clock",
//       title: "Submission Deadline in 30 Days",
//       text: "Marina Bridge Refurbishment deadline is July 12, 2026. Only 3 of 20 contractors have submitted so far.",
//       time: "2 days ago",
//       project: "Marina Bridge Refurbishment",
//       priority: "Medium",
//     },
//     {
//       id: 7,
//       type: "success",
//       icon: "bi-check-circle",
//       title: "Contract Awarded — Central Station Retrofit",
//       text: "AlSalam Construction has been awarded the Central Station Retrofit contract. Award letter has been issued.",
//       time: "3 days ago",
//       project: "Central Station Retrofit",
//       priority: "Low",
//     },
//   ]);

//   const handleDeleteNotification = (id) => {
//     setNotifications((prev) =>
//       prev.filter((notification) => notification.id !== id)
//     );
//   };

//   const handleClearAll = () => {
//     setNotifications([]);
//   };

//   return (
//     <OwnerLayout activePage="notifications">
//       <section className="notifications-content">
//         <div className="notifications-header">
//           <div>
//             <h2>
//               Notifications <span>{notifications.length} new</span>
//             </h2>
//             <p>Stay up to date with tender activity and AI alerts</p>
//           </div>

//           <div className="notifications-actions">
//             <button onClick={handleClearAll}>Mark all read</button>
//             <button>
//               <i className="bi bi-gear"></i>
//             </button>
//           </div>
//         </div>

//         <div className="notification-tabs">
//           <button className="active">All</button>
//           <button>
//             Unread <span>{notifications.length}</span>
//           </button>
//           <button>Risk</button>
//           <button>Deadlines</button>
//           <button>Submissions</button>
//         </div>

//         <div className="notifications-list">
//           {notifications.length === 0 ? (
//             <div className="empty-notifications">
//               <i className="bi bi-bell-slash"></i>
//               <h5>No notifications available</h5>
//               <p>You have cleared all notifications.</p>
//             </div>
//           ) : (
//             notifications.map((item) => (
//               <div className={`notification-card ${item.type}`} key={item.id}>
//                 <button
//                   className="delete-notification-btn"
//                   onClick={() => handleDeleteNotification(item.id)}
//                 >
//                   <i className="bi bi-x-lg"></i>
//                 </button>

//                 <div className={`notification-icon ${item.type}`}>
//                   <i className={`bi ${item.icon}`}></i>
//                 </div>

//                 <div className="notification-body">
//                   <h5>{item.title}</h5>
//                   <p>{item.text}</p>

//                   <div className="notification-meta">
//                     <span>{item.time}</span>
//                     {item.project && <b>{item.project}</b>}
//                   </div>
//                 </div>

//                 <span
//                   className={`priority-badge ${item.priority.toLowerCase()}`}
//                 >
//                   {item.priority}
//                 </span>
//               </div>
//             ))
//           )}
//         </div>
//       </section>
//     </OwnerLayout>
//   );
// }

// export default Notifications;