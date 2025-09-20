# AI Love Story Album Generator POC

## Overview
A proof of concept system where users tell their love story and AI creates a 5-song professional album with a custom cover.

## Tech Stack
- **Framework**: Next.js 14 with TypeScript (handles both frontend and backend via API routes)
- **Styling**: TailwindCSS
- **AI APIs**: 
  - OpenAI GPT-5 (story analysis)
  - Suno API (music generation)
  - OpenAI DALL-E/GPT-4o (album cover generation)

## Core Features

### 1. Story Input Form
- Simple textarea for users to input their love story
- Basic form validation and user-friendly interface

### 2. Story Analysis
- Use GPT-5 to analyze the love story
- Break story into 5 distinct song themes/chapters
- Generate appropriate prompts for each song

### 3. Music Generation
- Generate 5 songs using Suno API based on story chapters
- Each song represents different phases of the love story
- Handle API responses and audio file management

### 4. Album Cover Generation
- Generate AI album cover using OpenAI image generation
- Base cover on story themes and overall mood
- Ensure high-quality output suitable for album art

### 5. Results Display
- Show generated songs with audio players
- Display album cover prominently
- Provide download links for all generated content

## File Structure
```
/app (Next.js 14 app router)
  /api (backend API routes)
    /analyze-story/route.ts
    /generate-music/route.ts
    /generate-cover/route.ts
  /components (UI components)
    /StoryForm.tsx
    /SongPlayer.tsx
    /AlbumCover.tsx
  /results/page.tsx (display results)
  /page.tsx (main form)
/lib (utilities, API clients)
  /openai.ts
  /suno.ts
  /utils.ts
/types (TypeScript definitions)
  /index.ts
```

## User Flow
1. User enters love story in form
2. GPT-5 analyzes story → generates 5 song prompts with themes
3. Suno API generates 5 songs in parallel based on prompts
4. DALL-E generates album cover based on story summary
5. Display all results with audio players and download options

## Scope Limitations (POC)
- No cloud storage (files handled in memory/temporary)
- No user authentication
- No music distribution integration
- No database persistence
- Focus purely on AI generation functionality

## Success Criteria
- [ ] User can input a love story
- [ ] System generates 5 unique songs based on the story
- [ ] System generates a relevant album cover
- [ ] User can listen to generated songs
- [ ] User can download all generated content
- [ ] Clean, responsive UI throughout the process