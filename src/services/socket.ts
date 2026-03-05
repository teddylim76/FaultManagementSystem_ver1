import { io } from "socket.io-client";

const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const socketService = {
  onRecordsUpdated: (callback: () => void) => {
    socket.on("records_updated", callback);
  },
  offRecordsUpdated: (callback: () => void) => {
    socket.off("records_updated", callback);
  }
};
