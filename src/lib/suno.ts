import { SongPrompt, GeneratedSong, TaskPollResponse } from '@/types';
import { generateId, sleep } from './utils';

// Genre mapping function to convert our genres to Suno-compatible styles
const mapGenreToSunoStyle = (genre: string): string => {
  const genreLower = genre.toLowerCase();

  switch (genreLower) {
    case 'rock':
      return 'rock, electric guitar, drums, energetic';
    case 'pop':
      return 'pop, catchy, upbeat, contemporary';
    case 'jazz':
      return 'jazz, smooth, sophisticated, swing';
    case 'electronic':
      return 'electronic, synthesizer, digital, dance';
    case 'country':
      return 'country, acoustic guitar, storytelling, folk';
    case 'classical':
      return 'classical, orchestral, piano, elegant';
    case 'hip-hop':
      return 'hip hop, rap, urban, rhythmic';
    case 'r&b':
      return 'r&b, soul, smooth, vocal';
    case 'folk':
      return 'folk, acoustic, storytelling, traditional';
    case 'indie':
      return 'indie, alternative, creative, artistic';
    default:
      return 'pop, contemporary, melodic';
  }
};

interface SunoGenerateRequest {
  prompt: string;
  style?: string;
  title?: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
}

interface SunoTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    status?: string;
  };
}

interface SunoSong {
  id: string;
  title: string;
  audioUrl: string;
  sourceAudioUrl?: string;
  imageUrl?: string;
  prompt?: string;
  modelName?: string;
  tags?: string;
  createTime?: number;
  duration?: number;
}

interface SunoTaskResult {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    status: string;
    errorMessage?: string;
    response?: {
      sunoData: SunoSong[];
    };
  };
}

export class SunoClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      throw new Error('Missing SUNO_API_KEY environment variable. Please add your Suno API key to .env.local');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.sunoapi.org'; // Official Suno API URL
  }

  async generateSong(songPrompt: SongPrompt): Promise<GeneratedSong> {
    try {
      const requestBody: SunoGenerateRequest = {
        prompt: songPrompt.lyrics, // Use generated lyrics as the main prompt
        title: songPrompt.title,
        style: mapGenreToSunoStyle(songPrompt.genre), // Map genre to Suno style
        customMode: true, // Enable custom mode for lyrics-based generation
        instrumental: false,
        model: 'V4',
        callBackUrl: 'https://webhook.site/unique-id' // Placeholder callback URL
      };

      console.log('Generating song with Suno API:', songPrompt.title);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('API URL:', `${this.baseUrl}/api/v1/generate`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API error response:', errorText);
        throw new Error(`Suno API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SunoGenerateResponse = await response.json();
      console.log('Suno API response:', JSON.stringify(data, null, 2));

      if (data.code !== 200 || !data.data?.taskId) {
        console.error('Invalid Suno response structure:', data);
        throw new Error(data.msg || 'Failed to start song generation');
      }

      // Poll for completion
      const result = await this.pollForCompletion(data.data.taskId);

      // Handle single result (for backwards compatibility)
      if (!Array.isArray(result)) {
        return {
          id: result.id,
          title: songPrompt.title,
          audioUrl: result.audioUrl,
          status: 'completed',
          duration: result.duration,
          lyrics: result.prompt, // Include lyrics
        };
      } else {
        // Return the first song if multiple are returned
        const song = result[0];
        return {
          id: song.id,
          title: songPrompt.title,
          audioUrl: song.audioUrl,
          status: 'completed',
          duration: song.duration,
          lyrics: song.prompt, // Include lyrics
        };
      }
    } catch (error) {
      console.error('Error generating song with Suno:', error);
      throw error;
    }
  }


  private async pollForCompletion(taskId: string, maxAttempts: number = 30): Promise<SunoSong | SunoSong[]> {
    console.log(`Starting to poll for completion of taskId: ${taskId}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const pollUrl = `${this.baseUrl}/api/v1/generate/record-info?taskId=${taskId}`;
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts} - URL: ${pollUrl}`);

        const response = await fetch(pollUrl, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        console.log(`Polling response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`Failed to get task status: ${response.statusText}`);
        }

        const result: SunoTaskResult = await response.json();
        console.log(`Polling response data:`, JSON.stringify(result, null, 2));

        if (result.code !== 200) {
          throw new Error(result.msg || 'Failed to get task result');
        }

        // Check the actual response structure: data.response.sunoData[]
        const taskStatus = result.data?.status;
        const songs = result.data?.response?.sunoData || [];

        console.log(`Task status: ${taskStatus}, Songs found: ${songs.length}`);

        if (taskStatus === 'FAILED' || result.data?.errorMessage) {
          throw new Error(result.data?.errorMessage || 'Song generation failed');
        }

        if (taskStatus === 'SUCCESS' && songs.length > 0) {
          // Check if songs have audio URLs (they should when status is SUCCESS)
          const completedSongs = songs.filter((song: any) => song.audioUrl);

          console.log(`Completed songs with audio URLs: ${completedSongs.length}`);

          if (completedSongs.length > 0) {
            // Convert to our expected format
            const formattedSongs = completedSongs.map((song: any, index: number) => ({
              id: song.id,
              title: song.title,
              audioUrl: song.audioUrl, // Use the correct field name
              status: 'completed',
              duration: song.duration,
              lyrics: song.prompt, // Include lyrics from the prompt field
            }));

            // Return all completed songs
            return formattedSongs.length === 1 ? formattedSongs[0] : formattedSongs;
          }
        }

        // If status is TEXT_SUCCESS or still processing, continue polling
        if (taskStatus === 'TEXT_SUCCESS' || taskStatus === 'PENDING') {
          console.log(`Still processing (${taskStatus}), continuing to poll...`);
        }

        // Wait 10 seconds before next poll
        await sleep(10000);
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Song generation timed out');
  }

  async generateMultipleSongs(songPrompts: SongPrompt[]): Promise<GeneratedSong[]> {
    const songs: GeneratedSong[] = [];
    
    // Generate songs sequentially to respect rate limits (20 requests per 10 seconds)
    for (const prompt of songPrompts) {
      try {
        const song = await this.generateSong(prompt);
        songs.push(song);
        
        // Add delay between requests to respect rate limits
        await sleep(3000);
      } catch (error) {
        console.error(`Failed to generate song: ${prompt.title}`, error);
        songs.push({
          id: generateId(),
          title: prompt.title,
          audioUrl: '',
          status: 'failed',
        });
      }
    }
    
    return songs;
  }

  async generateSingleSong(songPrompt: SongPrompt): Promise<GeneratedSong[]> {
    try {
      const requestBody: SunoGenerateRequest = {
        prompt: songPrompt.lyrics, // Use generated lyrics as the main prompt
        title: songPrompt.title,
        style: mapGenreToSunoStyle(songPrompt.genre), // Map genre to Suno style
        customMode: true, // Enable custom mode for lyrics-based generation
        instrumental: false,
        model: 'V4',
        callBackUrl: 'https://webhook.site/unique-id' // Placeholder callback URL
      };

      console.log('Generating single song with Suno API:', songPrompt.title);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('API URL:', `${this.baseUrl}/api/v1/generate`);

      const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API error response:', errorText);
        throw new Error(`Suno API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SunoGenerateResponse = await response.json();
      console.log('Suno API response:', JSON.stringify(data, null, 2));

      if (data.code !== 200 || !data.data?.taskId) {
        console.error('Invalid Suno response structure:', data);
        throw new Error(data.msg || 'Failed to start song generation');
      }

      // Poll for completion
      const result = await this.pollForCompletion(data.data.taskId);

      // Since Suno API returns 2 songs per request, we need to handle both
      const songs: GeneratedSong[] = [];

      // Poll should return an array of songs, but let's handle both cases
      if (Array.isArray(result)) {
        result.forEach((song, index) => {
          songs.push({
            id: song.id,
            title: songPrompt.title,
            audioUrl: song.audioUrl,
            status: 'completed',
            duration: song.duration,
            version: index === 0 ? 'A' : 'B', // First song is version A, second is version B
            lyrics: song.prompt, // Include lyrics
          });
        });
      } else {
        // If only one song is returned, treat it as version A
        songs.push({
          id: result.id,
          title: songPrompt.title,
          audioUrl: result.audioUrl,
          status: 'completed',
          duration: result.duration,
          version: 'A',
          lyrics: result.prompt, // Include lyrics
        });
      }

      return songs;
    } catch (error) {
      console.error('Error generating single song with Suno:', error);
      throw error;
    }
  }

  // New method: Start generation and return taskId immediately
  async startSongGeneration(songPrompt: SongPrompt): Promise<string> {
    try {
      const requestBody: SunoGenerateRequest = {
        prompt: songPrompt.lyrics, // Use generated lyrics as the main prompt
        title: songPrompt.title,
        style: mapGenreToSunoStyle(songPrompt.genre), // Map genre to Suno style
        customMode: true, // Enable custom mode for lyrics-based generation
        instrumental: false,
        model: 'V4',
        callBackUrl: 'https://webhook.site/unique-id' // Placeholder callback URL
      };

      console.log('Starting song generation with Suno API:', songPrompt.title);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API error response:', errorText);
        throw new Error(`Suno API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SunoGenerateResponse = await response.json();
      console.log('Suno API response:', JSON.stringify(data, null, 2));

      if (data.code !== 200 || !data.data?.taskId) {
        console.error('Invalid Suno response structure:', data);
        throw new Error(data.msg || 'Failed to start song generation');
      }

      return data.data.taskId;
    } catch (error) {
      console.error('Error starting song generation with Suno:', error);
      throw error;
    }
  }

  // New method: Poll task status once (single poll, not continuous)
  async pollTaskStatus(taskId: string): Promise<TaskPollResponse> {
    try {
      const pollUrl = `${this.baseUrl}/api/v1/generate/record-info?taskId=${taskId}`;
      console.log(`Polling task status - URL: ${pollUrl}`);

      const response = await fetch(pollUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      console.log(`Polling response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Failed to get task status: ${response.statusText}`);
      }

      const result: SunoTaskResult = await response.json();
      console.log(`Polling response data:`, JSON.stringify(result, null, 2));

      if (result.code !== 200) {
        throw new Error(result.msg || 'Failed to get task result');
      }

      // Check the actual response structure: data.response.sunoData[]
      const taskStatus = result.data?.status;
      const songs = result.data?.response?.sunoData || [];

      console.log(`Task status: ${taskStatus}, Songs found: ${songs.length}`);

      if (taskStatus === 'FAILED' || result.data?.errorMessage) {
        return {
          taskId,
          status: 'failed',
          error: result.data?.errorMessage || 'Song generation failed',
        };
      }

      if (taskStatus === 'SUCCESS' && songs.length > 0) {
        // Check if songs have audio URLs (they should when status is SUCCESS)
        const completedSongs = songs.filter((song: any) => song.audioUrl);

        if (completedSongs.length > 0) {
          // Convert to our expected format
          const formattedSongs = completedSongs.map((song: any, index: number) => ({
            id: song.id,
            title: song.title,
            audioUrl: song.audioUrl,
            status: 'completed' as const,
            duration: song.duration,
            lyrics: song.prompt,
            version: index === 0 ? 'A' as const : 'B' as const, // First song is version A, second is version B
          }));

          return {
            taskId,
            status: 'completed',
            songs: formattedSongs,
          };
        }
      }

      // If status is TEXT_SUCCESS or still processing, continue polling
      return {
        taskId,
        status: 'generating',
      };
    } catch (error) {
      console.error(`Error polling task status for ${taskId}:`, error);
      return {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to poll task status',
      };
    }
  }
}

export const sunoClient = new SunoClient();