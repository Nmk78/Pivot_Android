# API Integration Documentation

This document describes the changes made to integrate the app with the new API endpoints as specified in `api_doc.md`.

## Overview

The app has been updated to use the new API endpoints instead of the AI SDK. The main changes include:

1. **New API Client** (`src/lib/api-client.ts`) - Implements all endpoints from the API documentation
2. **Chat Service** (`src/lib/chat-service.ts`) - Provides a clean interface for chat operations
3. **Custom Hook** (`src/hooks/useChatState.ts`) - Manages chat state using the new API
4. **Configuration** (`src/lib/config.ts`) - Centralizes environment variables and settings
5. **Voice Recording** (`src/hooks/useVoiceRecorder.ts`) - Handles audio recording with WAV output
6. **File Picker** (`src/hooks/useFilePicker.ts`) - Manages document selection and validation

## New Features Added

### 🎤 Voice Recording
- **High-quality audio recording** with pause/resume functionality
- **WAV format output** compatible with your API
- **Real-time duration display** and visual feedback
- **Permission handling** for microphone access
- **Error handling** for recording failures

### 📁 File Upload & Context
- **Document picker** supporting PDF, DOCX, and TXT files
- **File validation** for size and type restrictions
- **Context-aware chat** - placeholder changes when file is selected
- **File upload for RAG indexing** using `/file` endpoint
- **File-based queries** using `/text-with-file` endpoint

## API Endpoints Implemented

### File Endpoints
- `POST /file` - Upload and process files (PDF, DOCX, TXT)
- `GET /files` - List uploaded files (placeholder)
- `DELETE /file/{file_id}` - Delete specific files

### Text Endpoints
- `POST /text` - Handle text-based queries using RAG pipeline
- `POST /text-with-file` - Handle text queries with file context
- `GET /chat-history` - Get chat history (placeholder)

### Speech Endpoints
- `POST /speech` - Convert speech to text and process with RAG
- `POST /speech-stream` - Handle streaming speech (placeholder)

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_API_VERSION=v2
```

Replace `http://localhost:8000` with your actual API server URL.

### 2. API Server Requirements

Ensure your API server is running and accessible at the URL specified in `EXPO_PUBLIC_API_URL`. The server should implement all the endpoints described in `api_doc.md`.

### 3. Permissions

The app now requires the following permissions:

**Android:**
- `RECORD_AUDIO` - For voice recording
- `READ_EXTERNAL_STORAGE` - For file access
- `WRITE_EXTERNAL_STORAGE` - For file saving

**iOS:**
- Microphone access - For voice recording
- Document folder access - For file selection

## Usage

### Basic Text Chat

The app now uses the `/text` endpoint for basic chat functionality:

```typescript
import { useChatState } from '@/hooks/useChatState';

const { sendMessage, messages, isLoading } = useChatState();

// Send a message
await sendMessage("Hello, how are you?");
```

### Voice Recording

To record and process voice messages:

```typescript
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

const { startRecording, stopRecording, isRecording } = useVoiceRecorder();

// Start recording
await startRecording();

// Stop recording and get audio URI
const audioUri = await stopRecording();
```

### File Upload and Processing

To upload and process files:

```typescript
import { useFilePicker } from '@/hooks/useFilePicker';
import { uploadFile } from '@/lib/api-client';

// Pick a document
const { pickDocument } = useFilePicker();
const file = await pickDocument();

// Upload for context
const response = await uploadFile(file);
console.log(response.file_id); // Use this ID for future operations
```

### Text Query with File Context

To send a text query with a specific file:

```typescript
import { textQueryWithFile } from '@/lib/api-client';

// Send query with file context
const response = await textQueryWithFile("What is this document about?", file);
```

### Speech Processing

To process speech input:

```typescript
import { speechToText } from '@/lib/api-client';

// Process speech
const response = await speechToText(audioFile);
console.log(response.transcription); // Transcribed text
console.log(response.response); // AI response
```

## Configuration

The app configuration is centralized in `src/lib/config.ts`:

```typescript
export const config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
    api_version: process.env.EXPO_PUBLIC_API_VERSION || 'v2',
    timeout: 30000, // 30 seconds
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['pdf', 'docx', 'txt'],
    allowedAudioTypes: ['wav', 'mp3', 'm4a'],
  },
};
```

## UI Components

### Voice Recorder Button
- **Recording state** with pulse animation
- **Pause/Resume** functionality
- **Duration display** in MM:SS format
- **Error handling** with retry option

### File Picker Button
- **Document selection** with type filtering
- **File validation** with error messages
- **Selected file display** with remove option
- **Loading states** during file operations

### Enhanced Chat Input
- **Dynamic placeholder** based on selected file
- **Multiple input modes** (text, voice, file)
- **Send button states** (disabled when no content)
- **Real-time feedback** for all operations

## Error Handling

The API client includes comprehensive error handling:

- **Network errors** are caught and displayed to the user
- **API errors** (4xx, 5xx) include status codes and error messages
- **File upload errors** include validation for file type and size
- **Speech processing errors** are handled gracefully
- **Permission errors** are handled with user-friendly messages

## Migration Notes

### From AI SDK

The app previously used the AI SDK (`@ai-sdk/react`). The main changes:

1. **Removed AI SDK dependency** - No longer using `useChat` hook
2. **Custom state management** - Using `useChatState` hook instead
3. **Direct API calls** - Making direct HTTP requests to your API endpoints
4. **Simplified message format** - Using custom `ChatMessage` interface
5. **Added voice and file features** - New capabilities not available in AI SDK

### Backward Compatibility

Legacy functions are still available in `api-client.ts` for any existing code that might depend on them:

- `fetchApi()`
- `getChatsByUserId()`
- `getChatById()`

## Testing

To test the integration:

1. Start your API server
2. Set the correct `EXPO_PUBLIC_API_URL` in your `.env` file
3. Run the app: `npm start` or `expo start`
4. Test basic chat functionality
5. Test voice recording (grant microphone permission)
6. Test file upload (select a PDF, DOCX, or TXT file)
7. Test file-based queries (ask questions about uploaded documents)

## Troubleshooting

### Common Issues

1. **API URL not found** - Check your `.env` file and ensure `EXPO_PUBLIC_API_URL` is set correctly
2. **CORS errors** - Ensure your API server allows requests from your app's domain
3. **File upload fails** - Check file size and type restrictions in the config
4. **Speech processing fails** - Verify audio file format is supported
5. **Microphone permission denied** - Check app permissions in device settings
6. **File picker not working** - Ensure document picker permissions are granted

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
EXPO_PUBLIC_DEBUG=true
```

This will log API requests and responses to the console.

## Future Enhancements

Planned features based on the API documentation:

1. **File management UI** - List, view, and delete uploaded files
2. **Chat history** - Persistent chat history across sessions
3. **Speech streaming** - Real-time speech processing
4. **File context selection** - Choose which files to use for context
5. **Audio playback** - Play back recorded messages
6. **File preview** - Preview uploaded documents

## Support

For issues or questions about the API integration:

1. Check the API documentation in `api_doc.md`
2. Review the error messages in the console
3. Verify your API server is running and accessible
4. Test API endpoints directly using tools like Postman or curl
5. Check device permissions for microphone and file access
