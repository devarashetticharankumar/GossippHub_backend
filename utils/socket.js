module.exports = {
  setupSocket: (io) => {
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    io.emitNotification = (userId, message) => {
      io.to(userId).emit("notification", { message, createdAt: new Date() });
    };
  },
};
