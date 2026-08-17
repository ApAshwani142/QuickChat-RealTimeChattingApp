const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: function () {
        return !this.mediaUrl
      },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      index: true,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: String,
      default: null,
    },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
)

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 })

module.exports = mongoose.model('Message', messageSchema)
