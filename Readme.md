# MavPrep 🎓

**Your intelligent companion for academic success.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Amplify-orange?logo=amazonaws)](https://aws.amazon.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

MavPrep is a comprehensive educational platform that helps students excel through collaborative study tools, real-time communication, and intelligent exam preparation. Built by students, for students.

🌐 **[Live Demo](https://main.d1tuwgozwz7swd.amplifyapp.com)**

---

## ✨ Features

### 🔐 **Authentication**

- Secure sign up/sign in with email verification
- Custom usernames with real-time availability check
- Password reset functionality

### 💬 **Text Channels**

- Real-time messaging organized by courses
- Message replies, edits, and reactions
- Emoji support
- Public and private channels

### 🎙️ **Voice & Video**

- Live audio streaming
- Video calling with camera toggle
- Mute/unmute and deafen controls
- Discord-like interface

### 📄 **Exam Papers Repository**

- Upload and share past exam papers (PDF)
- Filter by course, semester, year, professor, and exam type
- Secure S3 storage with presigned URLs
- Download tracking

### 👤 **User Profiles**

- Customizable usernames
- Profile settings and management
- Avatar support

### 📚 **Study Tools** _(Coming Soon)_

- Practice tests with explanations
- Custom study plans
- Progress analytics
- AI-powered flashcards
- Video lessons

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS Account (Cognito, DynamoDB, S3)

### Installation

```bash
# Clone the repository
git clone https://github.com/zaineel/Cloud_Migration.git
cd Cloud_Migration/mavprep-landing

# Install dependencies
npm install

# Configure environment variables (see .env.example)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

---

## 🛠 Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
**Backend:** AWS Cognito, DynamoDB, S3, Amplify
**Real-time:** Socket.IO, WebRTC (SimplePeer)

---

## 📋 Roadmap

### ✅ Completed

- Landing page and authentication
- Text channels with real-time messaging
- Voice/video calling with WebRTC
- Message replies, edits, and reactions
- User profiles and settings
- **Past exam papers repository**

### 🔄 In Progress

- Practice test engine
- Progress analytics dashboard

### 📅 Planned

- AI-powered flashcards with spaced repetition
- Video content integration
- Mobile application
- Multi-university support

---

## 👥 Team

**Maintainers:**
[@zaineel](https://github.com/zaineel) • [@aroudrasthakur](https://github.com/aroudrasthakur) • [@TanzidAzad](https://github.com/TanzidAzad) • [@soumiksen](https://github.com/soumiksen) • [@hm-22](https://github.com/hm-22) • [@rachelle9026](https://github.com/rachelle9026)

**Project Leadership:** Tobi and Prajit Viswanadha

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Contact

- **Discord:** ACM Projects Discord
- **Issues:** [GitHub Issues](https://github.com/zaineel/Cloud_Migration/issues)
- **Discussions:** [GitHub Discussions](https://github.com/zaineel/Cloud_Migration/discussions)

---

## 🙏 Acknowledgments

**Powered by:** Next.js • AWS • Socket.IO • Tailwind CSS • SimplePeer

---

<div align="center">

**MavPrep** — Empowering students to succeed together 📚

[Website](https://main.d1tuwgozwz7swd.amplifyapp.com) • [Setup Guide](SETUP.md) • [Discord](https://discord.gg/acm)

</div>
