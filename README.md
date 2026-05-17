# Vitalis: Your Personal Health Sanctuary

Vitalis is a comprehensive, all-in-one personal health application designed to empower individuals on their wellness journey. It bridges the gap between raw health data and actionable insights using a secure, user-centric approach powered by AI.

## 🌟 Key Features

- **Personal Health Record (PHR):** Track vital signs including Blood Pressure, Heart Rate, Sleep, and Steps.
- **Intelligent Period Tracker:** Log menstrual cycles, symptoms, and moods with predictive insights.
- **Medication Reminders:** Never miss a dose with precise, customizable reminders and notifications.
- **Medical Document Vault:** Securely upload and manage medical documents (stored via Firebase/Session).
- **AI Health Guide:** A friendly chatbot powered by Gemini Pro to answer health-related questions.
- **AI Diet Planner:** Receive personalized nutrition guidance based on your profile, documents, and health logs.
- **Dark Mode Support:** A beautiful, responsive interface that respects your system theme.

## 🛠️ Tech Stack

### Frontend
- **React 19:** Modern, functional components with Hooks.
- **TypeScript:** Type-safe development for reliability.
- **Vite:** High-performance build tool and dev server.
- **Tailwind CSS:** Utility-first styling for a polished, responsive UI.
- **Lucide React:** Beautiful, consistent iconography.
- **Recharts:** Interactive health data visualizations.

### Backend & AI
- **Firebase:** Integrated for Authentication and Database.
  - **Firebase Authentication:** Secure login using Google Provider.
  - **Cloud Firestore:** Real-time, scalable NoSQL database for users, logs, and reminders.
  - **Cloud Firestore Security Rules:** Zero-trust security model protecting user PII.
- **Google Gemini API (@google/genai):** Powering the AI Health Guide and Diet Planner.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud Project with Gemini API enabled.
- A Firebase Project with Firestore and Google Auth enabled.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/vitalis.git
   cd vitalis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Firebase Configuration:**
   Download your `firebase-applet-config.json` from the Firebase Console and place it in the root or root-adjacent directory (as expected by `src/lib/firebase.ts`).

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🛡️ Security

Vitalis implements a **Zero-Trust** security architecture for health data:
- **Client-Side Auth:** Users are authenticated via Google.
- **Server-Side Security:** Firestore rules ensure that users can *only* read and write their own data.
- **Privacy First:** Medical data is partitioned by `userId`, preventing cross-user access.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Vitalis: Transforming complex health data into a more balanced life.*
