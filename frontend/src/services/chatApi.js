import api from "./api";

export const createChat = (tenderId, title) => {
  return api.post(`/chats/`, { tender_id: tenderId, title });
};

export const getChats = (tenderId) => {
  return api.get(`/chats/`, { params: { tender_id: tenderId } });
};

export const getChatDetails = (chatId) => {
  return api.get(`/chats/${chatId}/`);
};

export const deleteChat = (chatId) => {
  return api.delete(`/chats/${chatId}/`);
};

export const sendChatMessage = (chatId, message) => {
  return api.post(`/chats/${chatId}/messages/`, { message });
};
