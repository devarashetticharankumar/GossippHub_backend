// const mongoose = require("mongoose");

// // Chat Message Schema
// const messageSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   content: { type: String, trim: true }, // Content is optional if media is present
//   media: {
//     type: [
//       {
//         url: { type: String, required: true },
//         type: {
//           type: String,
//           enum: ["image", "video", "audio", "file"],
//           required: true,
//         },
//       },
//     ],
//     default: [],
//   },
//   createdAt: { type: Date, default: Date.now },
//   room: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "ChatRoom",
//     required: true,
//   },
//   isRead: { type: Boolean, default: false },
//   isEdited: { type: Boolean, default: false }, // New field to track if message was edited
// });

// // Chat Room Schema
// const chatRoomSchema = new mongoose.Schema({
//   name: { type: String, required: true, trim: true },
//   isPublic: { type: Boolean, default: false },
//   creator: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   createdAt: { type: Date, default: Date.now },
//   lastMessage: { type: Date },
// });

// // Direct Message Schema (for one-on-one chats)
// const directMessageSchema = new mongoose.Schema({
//   participants: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   ],
//   messages: [
//     {
//       sender: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//       content: { type: String, trim: true }, // Content is optional if media is present
//       media: {
//         type: [
//           {
//             url: { type: String, required: true },
//             type: {
//               type: String,
//               enum: ["image", "video", "audio", "file"],
//               required: true,
//             },
//           },
//         ],
//         default: [],
//       },
//       createdAt: { type: Date, default: Date.now },
//       isRead: { type: Boolean, default: false },
//       isEdited: { type: Boolean, default: false }, // New field to track if message was edited
//     },
//   ],
//   lastMessage: { type: Date },
// });

// module.exports = {
//   Message: mongoose.model("Message", messageSchema),
//   ChatRoom: mongoose.model("ChatRoom", chatRoomSchema),
//   DirectMessage: mongoose.model("DirectMessage", directMessageSchema),
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// models/chat.js
const mongoose = require("mongoose");

// Chat Message Schema
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, trim: true }, // Content is optional if media is present
    media: {
      type: [
        {
          url: { type: String, required: true },
          type: {
            type: String,
            enum: ["image", "video", "audio", "file"],
            required: true,
          },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false }, // New field to track if message was edited
  },
  {
    validate: {
      validator: function (doc) {
        return doc.content || doc.media.length > 0;
      },
      message: "Message must have either content or media",
    },
  }
);
messageSchema.index({ room: 1, createdAt: -1 });

// Chat Room Schema
const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3 },
  isPublic: { type: Boolean, default: false },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: Date },
});
chatRoomSchema.index({ members: 1, creator: 1 });

// Direct Message Schema (for one-on-one chats)
const directMessageSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: { type: String, trim: true }, // Content is optional if media is present
        media: {
          type: [
            {
              url: { type: String, required: true },
              type: {
                type: String,
                enum: ["image", "video", "audio", "file"],
                required: true,
              },
            },
          ],
          default: [],
        },
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
        isEdited: { type: Boolean, default: false }, // New field to track if message was edited
      },
    ],
    lastMessage: { type: Date },
  },
  {
    validate: {
      validator: function (doc) {
        return doc.messages.every((msg) => msg.content || msg.media.length > 0);
      },
      message: "Each message must have either content or media",
    },
  }
);
directMessageSchema.index({ participants: 1 }, { unique: true });
directMessageSchema.index({ participants: 1, lastMessage: -1 });

module.exports = {
  Message: mongoose.model("Message", messageSchema),
  ChatRoom: mongoose.model("ChatRoom", chatRoomSchema),
  DirectMessage: mongoose.model("DirectMessage", directMessageSchema),
};
