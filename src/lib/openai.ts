import OpenAI from 'openai';
import { StoryAnalysis, SongPrompt, CoupleNames } from '@/types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable. Please add your OpenAI API key to .env.local');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language configuration for multilingual support
const LANGUAGE_CONFIG = {
  'en': { name: 'English', instruction: 'Generate all content in English.' },
  'pt-BR': { name: 'Brazilian Portuguese', instruction: 'Generate all content in Brazilian Portuguese (Português Brasileiro).' },
  'de': { name: 'German', instruction: 'Generate all content in German (Deutsch).' }
} as const;

type Locale = keyof typeof LANGUAGE_CONFIG;

export async function analyzeStory(story: string, coupleNames: CoupleNames, userGenres: string[], locale: string = 'en'): Promise<StoryAnalysis> {
  const language = LANGUAGE_CONFIG[locale as Locale] || LANGUAGE_CONFIG['en'];

  const prompt = `Analyze the following love story and create 1 beautiful song that captures the essence of their love journey.

IMPORTANT - LANGUAGE: ${language.instruction}

Love Story:
"${story}"

User's Favorite Music Genres: ${userGenres.join(', ')}

IMPORTANT: The user has selected these favorite genres: ${userGenres.join(', ')}. Please select the most appropriate genre from their preferences that best captures the emotional essence of this love story.

Please respond with a JSON object containing:
- id: unique identifier
- summary: brief summary of the love story (2-3 sentences)
- mood: overall mood of the story (happy, melancholic, romantic, dramatic, etc.)
- themes: array of 3-5 key themes from the story
- songs: array with exactly 1 song object containing:
  - id: unique identifier
  - title: song title that captures the essence of their love story
  - description: what this song represents in their journey
  - mood: mood for this song
  - genre: suggested music genre (MUST be from user's selected genres: ${userGenres.join(', ')})
  - prompt: detailed prompt for AI music generation that includes the genre style

Genre Selection Guidelines:
- Use ONLY the user's selected genres: ${userGenres.join(', ')}
- Choose the genre that best matches the overall emotional tone of the story
- Consider the dominant themes and mood when selecting the genre
- Ensure the genre enhances the emotional impact of the love story

Create a song that tells the complete love story in a compelling, emotionally resonant way.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert music producer and storyteller. Analyze love stories and create compelling song concepts. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const analysis = JSON.parse(content) as StoryAnalysis;

    // Generate lyrics for the song (we only have one now)
    const songsWithLyrics = await Promise.all(
      analysis.songs.map(async (song) => {
        const lyrics = await generateLyrics(song, coupleNames, true, userGenres, 0, locale);
        return {
          ...song,
          lyrics
        };
      })
    );

    return {
      ...analysis,
      songs: songsWithLyrics
    };
  } catch (error) {
    throw new Error('Failed to parse OpenAI response or generate lyrics');
  }
}

// COMMENTED OUT: Album cover generation temporarily disabled
/*
export async function generateAlbumCover(storyAnalysis: StoryAnalysis): Promise<string> {
  const prompt = `Create a romantic album cover for a love story album. 

Story summary: ${storyAnalysis.summary}
Mood: ${storyAnalysis.mood}
Themes: ${storyAnalysis.themes.join(', ')}

Style: Professional album cover, romantic and artistic, suitable for a music album. Include subtle text space for album title. High quality, aesthetic, and emotionally resonant.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'hd',
    n: 1,
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('No image generated from OpenAI');
  }

  return imageUrl;
}
*/

export async function generateLyrics(
  songPrompt: SongPrompt,
  coupleNames: CoupleNames,
  isFirstSong: boolean = false,
  userGenres: string[] = [],
  songIndex: number = 0,
  locale: string = 'en'
): Promise<string> {
  const language = LANGUAGE_CONFIG[locale as Locale] || LANGUAGE_CONFIG['en'];
  // Progressive name usage strategy based on song position
  const getNameInclusion = (index: number): string => {
    switch (index) {
      case 0: // First song - names in opening only
        return `IMPORTANT: This is the first song of the album. Include both names "${coupleNames.person1}" and "${coupleNames.person2}" prominently in the first verse/opening section ONLY. After the opening, use pronouns like "you", "we", "he", "she" instead of repeating the names.`;

      case 1: // Second song - light references
        return `This is the second song. Use light name references - occasionally use one name (either "${coupleNames.person1}" or "${coupleNames.person2}") sparingly, but primarily rely on pronouns like "you", "my love", "darling", "we", "us".`;

      default: // Songs 3-5 - minimal to no names
        return `This is song ${index + 1} of the album. AVOID using the specific names "${coupleNames.person1}" and "${coupleNames.person2}". Instead, use universal terms of endearment and pronouns: "you", "my love", "darling", "baby", "we", "us", "my heart". Focus on emotions and universal love language that any couple could relate to.`;
    }
  };

  const nameInclusion = getNameInclusion(songIndex);

  // Genre-specific structure templates
  const getGenreStructure = (genre: string) => {
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case 'hip-hop':
        return {
          structure: '[Intro]\n[Verse 1]\n[Hook]\n[Verse 2]\n[Hook]\n[Bridge/Breakdown]\n[Hook]\n[Outro]',
          guidelines: '- Use strong rhythm and rhyme schemes\n- Include contemporary slang and expressions\n- Focus on storytelling in verses\n- Make hooks catchy and memorable\n- Use internal rhymes and wordplay'
        };
      case 'country':
        return {
          structure: '[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Bridge]\n[Chorus]\n[Tag/Outro]',
          guidelines: '- Tell a clear story with relatable imagery\n- Use simple, heartfelt language\n- Include references to small-town life, nature, or family\n- Make choruses singable and memorable\n- Use conversational tone'
        };
      case 'electronic':
        return {
          structure: '[Intro/Build]\n[Drop/Chorus]\n[Verse 1]\n[Build-up]\n[Drop/Chorus]\n[Verse 2]\n[Final Build]\n[Drop/Chorus]\n[Outro]',
          guidelines: '- Use repetitive, rhythmic phrases\n- Build tension with pre-drops\n- Keep lyrics simple but impactful\n- Focus on energy and movement\n- Use modern, digital-age language'
        };
      case 'r&b':
        return {
          structure: '[Verse 1]\n[Pre-Chorus]\n[Chorus]\n[Verse 2]\n[Pre-Chorus]\n[Chorus]\n[Bridge]\n[Chorus]\n[Outro]',
          guidelines: '- Use smooth, soulful language\n- Include vocal runs and ad-libs opportunities\n- Focus on emotional intimacy\n- Use sophisticated vocabulary\n- Create space for vocal showcases'
        };
      case 'rock':
        return {
          structure: '[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Guitar Solo/Bridge]\n[Chorus]\n[Outro]',
          guidelines: '- Use powerful, anthemic language\n- Create strong, memorable choruses\n- Use driving rhythm in lyrics\n- Include emotional intensity\n- Build to climactic moments'
        };
      case 'folk':
        return {
          structure: '[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Verse 3]\n[Chorus]\n[Tag]',
          guidelines: '- Use simple, acoustic-friendly structures\n- Tell stories with vivid imagery\n- Use traditional poetic devices\n- Keep language accessible\n- Focus on universal themes'
        };
      case 'classical':
        return {
          structure: '[Movement I - Exposition]\n[Movement II - Development]\n[Movement III - Recapitulation]\n[Coda]',
          guidelines: '- Use sophisticated, poetic language\n- Create emotional crescendos\n- Use metaphor and symbolism\n- Allow for instrumental breaks\n- Focus on artistic expression'
        };
      case 'jazz':
        return {
          structure: '[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Scat/Instrumental Section]\n[Chorus]\n[Tag]',
          guidelines: '- Use sophisticated chord progressions in mind\n- Include opportunities for improvisation\n- Use jazz terminology and feel\n- Create swing-friendly rhythms\n- Include complex rhyme schemes'
        };
      case 'indie':
        return {
          structure: '[Intro]\n[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Bridge/Experimental Section]\n[Chorus]\n[Outro]',
          guidelines: '- Use creative, unconventional approaches\n- Include artistic and abstract imagery\n- Mix emotional vulnerability with cleverness\n- Use unique metaphors\n- Allow for experimental elements'
        };
      default: // Pop and others
        return {
          structure: '[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Bridge]\n[Chorus]\n[Outro]',
          guidelines: '- Use catchy, memorable hooks\n- Keep language accessible and universal\n- Create radio-friendly structures\n- Focus on mass appeal\n- Use contemporary language'
        };
    }
  };

  const genreStructure = getGenreStructure(songPrompt.genre);

  const prompt = `Generate professional song lyrics for a love story song with the following details:

IMPORTANT - LANGUAGE: ${language.instruction} All lyrics, section headers, and content must be in ${language.name}.

Song Title: "${songPrompt.title}"
Song Description: ${songPrompt.description}
Mood: ${songPrompt.mood}
Genre: ${songPrompt.genre}
Music Generation Prompt: ${songPrompt.prompt}
Couple Names: ${coupleNames.person1} and ${coupleNames.person2}
User's Selected Genres: ${userGenres.join(', ')}

${nameInclusion}

GENRE-SPECIFIC STRUCTURE (${songPrompt.genre.toUpperCase()}):
${genreStructure.structure}

GENRE-SPECIFIC GUIDELINES:
${genreStructure.guidelines}

Create complete song lyrics following the ${songPrompt.genre} structure above.

General Guidelines:
- Use professional songwriting format with section labels
- Make lyrics emotionally resonant and fitting the song's mood
- Ensure lyrics flow well with the ${songPrompt.genre} genre
- Match the narrative arc described in the song description
- Use rhyming schemes appropriate for ${songPrompt.genre}
- Create an emotional connection through relatable language and universal themes
- IMPORTANT: Follow the ${songPrompt.genre}-specific structure and guidelines provided above
- Adapt your language, rhythm, and style to fit the ${songPrompt.genre} aesthetic
- Ensure the lyrics would work well when set to ${songPrompt.genre} music

Return only the formatted lyrics with section headers as specified in the genre structure.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a professional songwriter and lyricist. You create emotionally compelling, well-structured song lyrics that tell stories and evoke deep feelings. Always format lyrics with proper section headers and maintain consistent rhyme schemes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1000
  });

  const lyrics = response.choices[0].message.content;
  if (!lyrics) {
    throw new Error('No lyrics generated from OpenAI');
  }

  return lyrics.trim();
}