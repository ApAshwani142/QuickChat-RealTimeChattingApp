import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

// TTL index to automatically remove expired OTPs from the database
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
