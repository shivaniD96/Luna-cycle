# 🌙 LunaCycle — Private Cycle Companion

LunaCycle is a privacy-first, aesthetic period tracker designed to put you in total control of your health data. Unlike mainstream apps that monetize sensitive information, LunaCycle uses a **Local-First Privacy Model**. Your data never touches our servers.

## ✨ Why LunaCycle?

Most period trackers share or sell user data to advertisers or third parties. LunaCycle was built to solve this by ensuring your cycle history remains exclusively yours, while still providing modern features like AI insights and partner support.

## 🚀 Key Features

### 🔒 Privacy-First Architecture
- **Local Storage**: All data is stored directly in your browser's persistent storage.
- **Privacy Lock**: Secure the app with a 4-digit PIN or link it to your Google Account as a biometric-style lock.
- **Live Cloud Sync**: Use the File System Access API to sync your data to a private file in your Google Drive or Dropbox folder. You own the file; we just help you write to it.

### 🧠 AI-Powered Insights (Gemini API)
- **Daily Wisdom**: Receive phase-specific self-care tips focusing on nutrition, mood, and movement.
- **Partner Support**: A dedicated "Partner Portal" allows your loved ones to chat with an AI assistant to learn how to best support you during your current cycle phase.
- **AI Formatter**: Instantly convert your cycle history into a beautiful Markdown table ready for Notion, Evernote, or Apple Notes.

### 🎨 Aesthetic "Soft-Pop" UI
- **Animated Backgrounds**: Calming, floating aesthetic blobs.
- **Phase-Specific Themes**: Dynamic UI changes (colors, icons, and descriptions) based on your current cycle phase (Menstrual, Follicular, Ovulation, Luteal).
- **Tactile Feedback**: "Squishy" buttons and ultra-rounded corners for a friendly, approachable wellness experience.

### 🤝 Partner Portal
- Generate a secure, encrypted sharing link for your partner.
- No account creation required for them; they see your current status and can ask the AI for advice on how to be a better support system.

## 🛠️ Technology Stack

- **Frontend**: React 19, Tailwind CSS
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Date Handling**: `date-fns` for precise cycle calculations
- **State Persistence**: LocalStorage + File System Access API
- **Design**: Google Fonts (Playfair Display, Quicksand)

## 📖 How to Use

1. **Check In**: Use the "Log Today" button to record your flow or your mood and body signals.
2. **Setup Sync**: Go to Settings and enable "Live Sync". Choose a file inside your local Cloud storage (like Google Drive) to ensure your data is backed up but remains private.
3. **Share the Love**: Click the "Share" icon to give your partner a peek into your cycle so they can understand your needs better.
4. **Export**: Need to share with a doctor? Use the "AI Formatter" in Settings to generate a clean report.

---

*Built with love for privacy, autonomy, and wellness.*