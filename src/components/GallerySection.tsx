import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants';
import { Search, X, ZoomIn } from 'lucide-react';

const GallerySection: React.FC = () => {
  // Mock Data mimicking the file structure requested
  const photos = [
    { id: '1', url: ASSETS.teamPhoto, match: 'Mundialito Final', title: 'Campeones 2024' },
    { id: '1b', url: ASSETS.teamPhotoCelebration, match: 'Mundialito Final', title: 'Festejo del Campeonato' },
    { id: '1c', url: ASSETS.gallery.campeonMundialito, match: 'Mundialito Final', title: 'Campeon Mundialito' },
    { id: '2', url: ASSETS.players.nicolas, match: 'vs Los Galacticos', title: 'Nico Goal Celebration' },
    { id: '3', url: ASSETS.players.julian, match: 'vs Los Galacticos', title: 'Julian Aerial' },
    { id: '4', url: ASSETS.players.guilleF, match: 'vs Deportivo Birra', title: 'Guille Defense' },
  ];

  const [filter, setFilter] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, title: string, match: string} | null>(null);

  const filteredPhotos = photos.filter(p => p.match.toLowerCase().includes(filter.toLowerCase()) || p.title.toLowerCase().includes(filter.toLowerCase()));

  // Handle Escape Key & Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      // Prevent scrolling the background when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  return (
    <div className="bg-black py-16 px-4">
       <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <h2 className="font-display text-5xl text-white">GALERÍA <span className="text-clan-red">EPICA</span></h2>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por partido..." 
                className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:border-clan-magenta transition-colors placeholder:text-gray-600"
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo.id} 
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-video overflow-hidden rounded-xl bg-neutral-900 border border-white/10 cursor-pointer"
              >
                <img 
                  src={photo.url} 
                  alt={photo.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="absolute top-4 right-4 bg-clan-magenta p-2 rounded-full transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <ZoomIn size={20} className="text-white" />
                  </div>
                  <span className="text-clan-magenta text-xs font-bold uppercase tracking-wider mb-1">{photo.match}</span>
                  <h3 className="text-white font-display text-2xl uppercase leading-none">{photo.title}</h3>
                </div>
              </div>
            ))}
          </div>
       </div>

       {/* LIGHTBOX MODAL */}
       {selectedPhoto && (
         <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedPhoto(null)}
         >
            {/* Close Button - Fixed Position & High Visibility */}
            <button 
              className="fixed top-6 right-6 z-[110] bg-black/50 hover:bg-clan-red text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 shadow-lg group"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
            >
              <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            
            <div 
              className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center pointer-events-none" 
            >
              {/* Image Container - Enable pointer events here */}
              <div 
                className="relative pointer-events-auto"
                onClick={(e) => e.stopPropagation()} // Stop propagation so clicking image doesn't close
              >
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.title} 
                  className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Caption - Enable pointer events here */}
              <div 
                className="mt-6 text-center pointer-events-auto bg-black/60 px-8 py-4 rounded-2xl backdrop-blur-sm border border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                 <h3 className="text-white font-display text-4xl uppercase tracking-wide leading-none">{selectedPhoto.title}</h3>
                 <span className="text-clan-magenta uppercase text-sm font-bold tracking-[0.2em] mt-2 block">{selectedPhoto.match}</span>
              </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default GallerySection;
