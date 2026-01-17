'use client';

import { AlbumCover as AlbumCoverType } from '@/types';
import { useState } from 'react';

interface AlbumCoverProps {
  cover: AlbumCoverType;
  albumTitle: string;
}

export default function AlbumCover({ cover, albumTitle }: AlbumCoverProps) {
  const [imageError, setImageError] = useState(false);

  const downloadCover = () => {
    if (!cover.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = cover.imageUrl;
    link.download = `${albumTitle}-cover.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cover.status === 'failed' || imageError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Cover generation failed</p>
          </div>
        </div>
      </div>
    );
  }

  if (cover.status === 'generating') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-2"></div>
            <p>Generating cover...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="relative group">
        <img
          src={cover.imageUrl}
          alt={albumTitle}
          className="w-full aspect-square object-cover rounded-lg"
          onError={() => setImageError(true)}
        />
        <button
          onClick={downloadCover}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
          title="Download cover"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
      
      <div className="mt-4">
        <h3 className="font-bold text-xl text-gray-900 mb-1">{albumTitle}</h3>
        <p className="text-gray-600 text-sm">AI Generated Album Cover</p>
      </div>
    </div>
  );
}