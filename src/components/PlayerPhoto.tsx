import React, { useState } from 'react';
import { ASSETS } from '../constants';
import { Player } from '../types';
import { playerPhotoFraming } from '../playerPhotos';

export default function PlayerPhoto({ player, variant = 'avatar', className = '' }: {
  player: Player;
  variant?: 'avatar' | 'card';
  className?: string;
}) {
  const src = player.image || ASSETS.players.default;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const framing = !failed ? playerPhotoFraming(player) : undefined;
  const crop = framing?.[variant];
  const style: React.CSSProperties = framing && crop ? {
    position: 'absolute',
    maxWidth: 'none',
    width: `${framing.width / crop.width * 100}%`,
    height: `${framing.height / crop.height * 100}%`,
    left: `${-crop.x / crop.width * 100}%`,
    top: `${-crop.y / crop.height * 100}%`,
  } : { width: '100%', height: '100%', objectFit: variant === 'card' ? 'contain' : 'cover' };

  return <span className={`relative block w-full h-full overflow-hidden pointer-events-none ${className}`}
    data-player-photo={player.id} data-photo-variant={variant}>
    <img src={failed ? ASSETS.players.default : src} alt={`Foto de ${player.name}`}
      style={style} loading="lazy" decoding="async" referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)} />
  </span>;
}
