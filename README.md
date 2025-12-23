# 🌙 LunaCycle — Private Cycle Companion

LunaCycle is a privacy-first, aesthetic period tracker designed to put you in total control of your health data. All data is stored locally in your browser (Local-First Privacy Model).

## 🚀 Key Features
- **Zero-Sharing**: No accounts, no servers, no data brokering.
- **Privacy Lock**: Secure the app with a 4-digit PIN.
- **AI Daily Wisdom**: Phase-specific self-care tips powered by Gemini 3.
- **Support Portal**: Empathy-driven AI to help your partner support you.

---

## 🛠️ Deployment & Git Troubleshooting

### Solving the `rejected (fetch first)` or Rebase Conflict
If you hit a conflict while pushing:
1. **Pull and Rebase**: `git pull origin main --rebase`
2. **Resolve**: (The code provided by Luna AI resolves these files).
3. **Continue**: `git add .` then `git rebase --continue`
4. **Push**: `git push origin main`

### Setup API Key
1. Get a key from [Google AI Studio](https://aistudio.google.com/).
2. In GitHub: **Settings > Secrets and variables > Actions**.
3. Add a New Repository Secret named `API_KEY`.

---

## 📖 How to Use
1. **Log**: Tap "Log Today" to record flow, mood, and symptoms.
2. **Sync**: Enable "Live Sync" in Settings to save to a local folder (Google Drive/Dropbox compatible).
3. **Share**: Use the "Share Phase" link to let a partner see your status and talk to Luna AI.

*Your body, your data, your privacy.*