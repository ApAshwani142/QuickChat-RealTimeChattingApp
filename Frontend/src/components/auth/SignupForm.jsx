import { useState } from 'react'
import { Lock, User, Phone, Mail, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function SignupForm({ onSubmit, onSendOtp, otpSent, loading }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (otpSent) {
      onSubmit(username, email, mobile, password, otp)
    } else {
      onSendOtp(username, email, mobile, password)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="username"
        label="Username"
        value={username}
        onChange={setUsername}
        placeholder="Enter username"
        icon={User}
        required
        disabled={otpSent}
      />

      <Input
        id="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="e.g. user@example.com"
        icon={Mail}
        required
        disabled={otpSent}
      />

      <Input
        id="mobile"
        label="Mobile Number (Optional)"
        value={mobile}
        onChange={setMobile}
        placeholder="e.g. +15551234567"
        icon={Phone}
        disabled={otpSent}
      />

      <div className="space-y-2 relative">
        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          icon={Lock}
          required
          disabled={otpSent}
        />
        {!otpSent && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 bottom-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {otpSent && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Input
            id="otp"
            label="Verification OTP Code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={setOtp}
            placeholder="Enter 6-digit OTP code"
            icon={ShieldAlert}
            required
            autoFocus
          />
          <p className="mt-1.5 text-xs text-fuchsia-600 dark:text-fuchsia-400">
            A 6-digit verification code has been sent to your email.
          </p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full mt-2">
        {otpSent ? 'Verify & Create Account' : 'Send OTP'}
        <ArrowRight size={16} className="ml-2" />
      </Button>
    </form>
  )
}
