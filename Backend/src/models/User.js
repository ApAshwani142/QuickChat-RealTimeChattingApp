import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 7,
      maxlength: 20,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    statusMessage: {
      type: String,
      default: 'Hey there! I am using QuickChat.',
    },
    password: {
      type: String,
      required: true,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      default: null,
    },
    mfaTempSecret: {
      type: String,
      default: null,
    },
    mfaBackupCodes: {
      type: [String],
      default: [],
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
