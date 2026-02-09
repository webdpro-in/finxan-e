# Haru AI Teacher Platform

A long-term, platform-grade AI teaching system built with vendor-agnostic architecture for 10-20 year longevity.

## Architecture Principles

This platform follows strict architectural principles to ensure:
- **Vendor Independence**: Switch AI providers via environment variables only
- **Frontend/Backend Separation**: Complete decoupling via HTTP APIs
- **Contract-Based Design**: Stable interfaces that never change
- **Adapter Pattern**: Vendor-specific code isolated in replaceable adapters

## Project Structure

```
haru-platform/
├── frontend/              # React + Vite + Live2D
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # Frontend orchestration (FSM, gestures, sync)
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript types
│   └── public/
│       └── haru_greeter_pro_jp/  # Live2D character assets
│
├── backend/               # Express.js + Provider Abstraction
│   ├── src/
│   │   ├── contracts/     # 🔑 Stable interfaces (NEVER CHANGE)
│   │   ├── providers/     # Replaceable adapters
│   │   │   ├── aws/       # AWS Bedrock, Polly, Transcribe
│   │   │   └── registry.ts
│   │   ├── routes/        # HTTP API endpoints
│   │   └── services/      # Legacy (to be deprecated)
│   └── .env.example
│
└── .kiro/
    └── specs/             # Requirements, design, tasks
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**

   **Backend** (`backend/.env`):
   ```bash
   # Provider Selection (Gemini is PRIMARY)
   AI_PROVIDER=gemini
   TTS_PROVIDER=aws-polly
   STT_PROVIDER=aws-transcribe
   IMAGE_PROVIDER=aws-bedrock

   # Google Gemini Configuration (PRIMARY AI PROVIDER)
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-1.5-flash

   # AWS Configuration (OPTIONAL - for TTS/STT/Images only)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   S3_BUCKET_NAME=haru-ai-teacher-audio

   # External APIs
   UNSPLASH_ACCESS_KEY=your_key
   ```

   **Frontend** (`frontend/.env`):
   ```bash
   VITE_API_URL=http://localhost:3001/api
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:3001`

2. **Start Frontend Dev Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

3. **Open Browser**
   Navigate to `http://localhost:5173`

## Provider Configuration

The platform uses **Google Gemini** as the primary AI provider. Provider switching is environment-based:

```bash
# Use Gemini (PRIMARY - current)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Use AWS Bedrock (alternative)
AI_PROVIDER=aws-bedrock
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Use OpenAI (future)
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
```

**No code changes required!**

## Architecture Guarantees

- ✅ Frontend NEVER imports backend code
- ✅ Backend contracts NEVER change
- ✅ Provider switching = environment variables only
- ✅ Deterministic systems (FSM, gestures) NEVER change behavior
- ✅ Character rendering abstracted behind CharacterDriver interface
- ✅ AI output normalized before reaching motion/UI logic

## Development

### Frontend Structure
- `src/components/` - React UI components
- `src/services/` - Orchestration logic (MotionManager, GestureRouter, SynchronizationCoordinator)
- `src/store/` - Zustand state management
- `src/types/` - TypeScript type definitions

### Backend Structure
- `src/contracts/` - Stable provider interfaces (AIProvider, TTSProvider, STTProvider, ImageProvider)
- `src/providers/` - Adapter implementations
- `src/routes/` - Express.js API endpoints
- `src/services/` - Legacy services (being deprecated)

## Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

## Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

## Contributing

See `.kiro/specs/` for detailed requirements, design documents, and implementation tasks.

## License

MIT

## Long-Term Vision

This platform is designed to remain functional for 10-20 years by:
- Abstracting all vendor dependencies
- Using stable contract interfaces
- Supporting cloud, local, on-prem, and edge deployments
- Enabling future AI systems without refactoring core logic

**Gemini today → Claude tomorrow → OpenAI anytime → Your own model → Future AI compilers**

The contracts protect the core.
