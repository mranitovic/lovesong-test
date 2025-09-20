# Suno API Integration Guide

This document describes the implementation of the real Suno API integration in the AI Love Story Album Generator.

## Implementation Overview

The Suno API integration has been updated from a mock implementation to use the real Suno API v4 endpoints.

### Key Changes Made

1. **Real API Endpoints**: Updated to use `https://api.sunoapi.org/api/v1/`
2. **Async Task Processing**: Implemented proper task polling for music generation
3. **Enhanced Error Handling**: Better error messages and fallback mechanisms
4. **Rate Limiting**: Respects Suno's 20 requests per 10 seconds limit

## API Integration Details

### Authentication
- Uses Bearer token authentication
- API key obtained from https://sunoapi.org/api-key
- API key is required - application will not start without it

### Music Generation Flow

1. **Submit Request**: POST to `/api/v1/generate` with song parameters
2. **Receive Task ID**: API returns a task ID for tracking
3. **Poll for Completion**: Check task status using `/api/v1/get/{task_id}`
4. **Retrieve Results**: Get audio URL when generation is complete

### Request Parameters

```typescript
interface SunoGenerateRequest {
  prompt: string;        // Song description
  style?: string;        // Music genre
  title?: string;        // Song title
  customMode?: boolean;  // Enable custom mode
  instrumental?: boolean; // Generate without vocals
  model?: string;        // Model version (V4, V3_5)
}
```

### Response Format

```typescript
interface SunoSong {
  id: string;
  title: string;
  audio_url: string;
  video_url?: string;
  image_url?: string;
  lyric?: string;
  created_at: string;
  status: string;
  duration?: number;
}
```

## Features Implemented

### 1. Task Polling System
- Polls every 2-10 seconds for completion
- Maximum 30 attempts (5-10 minutes total)
- Progressive backoff timing

### 2. Rate Limit Compliance
- 3-second delay between requests
- Sequential processing to avoid overwhelming the API
- Proper error handling for rate limit violations

### 3. Error Handling
- Clear error messages for missing API keys
- Detailed error logging for API failures
- Proper error propagation to user interface
- User-friendly error messages
- Timeout protection (15-minute max)

## Configuration

### Environment Variables
```bash
SUNO_API_KEY=your_api_key_here
```

### API Limits
- Concurrency: 20 requests per 10 seconds
- Generation time: 30-40 seconds for stream, 2-3 minutes for download
- Each request generates 2 songs (we use the first one)

## Usage Examples

### With API Key (Required)
```typescript
// Will use real Suno API
const songs = await sunoClient.generateMultipleSongs(songPrompts);
```

### Without API Key
```typescript
// Will throw error: "Missing SUNO_API_KEY environment variable"
// Application will not start without API key
```

## Testing

To test the integration:

1. **Set up API Keys**: Add both SUNO_API_KEY and OPENAI_API_KEY to `.env.local`
2. **Run Tests**: Use the application with real API keys for actual music generation

## Production Considerations

### Cost Management
- Each generation request costs credits
- Monitor usage through Suno dashboard
- Implement user limits if needed

### Performance Optimization
- Consider caching generated songs
- Implement background job processing for multiple songs
- Add user progress tracking

### Error Recovery
- Implement retry logic for transient failures
- Add user notification for failed generations
- Consider partial success handling

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API key is correct
   - Check if key has sufficient credits

2. **Timeout Issues**
   - Increase polling timeout for longer songs
   - Check network connectivity

3. **Rate Limiting**
   - Reduce concurrent requests
   - Implement exponential backoff

### Monitoring
- Check console logs for detailed error information
- Monitor API usage in Suno dashboard
- Track generation success/failure rates

## Future Enhancements

1. **Webhook Integration**: Use callbacks instead of polling
2. **Advanced Parameters**: Support more generation options
3. **Batch Processing**: Optimize multiple song generation
4. **User Feedback**: Real-time progress updates
5. **Audio Processing**: Post-generation audio enhancement