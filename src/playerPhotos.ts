import { Player } from './types';

type Crop = { x: number; y: number; width: number; height: number };
export type PlayerPhoto = {
  src: string;
  previousImage: string;
  width: number;
  height: number;
  avatar: Crop;
  card: Crop;
};

// Photos are attached to player IDs, so a future jersey change keeps the right photo.
// Coordinates describe the viewport over the original photo; the file is preserved.
const photo = (file: number, previousImage: string, width: number, height: number,
  avatar: [number, number, number], card: [number, number, number]): PlayerPhoto => ({
  src: `/images/players/foto-${String(file).padStart(2, '0')}.jpg`, previousImage, width, height,
  avatar: { x: avatar[0], y: avatar[1], width: avatar[2], height: avatar[2] },
  card: { x: card[0], y: card[1], width: card[2], height: card[2] * 5 / 4 },
});

const mundialito = (file: string) => `https://mundialitouy.com/wp-content/uploads/${file}.jpg`;
export const PLAYER_PHOTOS: Record<string, PlayerPhoto> = {
  '15': photo(1, mundialito('4-25-22'), 1080, 720, [500, 133, 170], [345, 130, 440]), // 19 · Enzo Rubín
  '18': photo(2, mundialito('8-4-6'), 1079, 716, [284, 30, 300], [210, 0, 560]), // 44 · Andrés Quintero
  '11': photo(3, mundialito('8-10-5'), 1080, 720, [410, 30, 170], [260, 15, 540]), // 12 · Agustín Werosch
  '6': photo(4, mundialito('1-12-43'), 1080, 720, [365, 40, 210], [200, 15, 540]), // 7 · Guillermo Cengeri
  '13': photo(5, mundialito('1-46-27'), 1080, 720, [360, 45, 230], [280, 20, 460]), // 16 · Gastón Curbelo
  '14': photo(6, mundialito('1-14-99'), 1080, 720, [420, 70, 180], [280, 25, 480]), // 18 · Santiago De Gouveia
  '10': photo(7, mundialito('1-43-25'), 850, 567, [370, 50, 160], [215, 20, 400]), // 11 · Guillermo Figueredo
  '12': photo(8, 'https://mundialitouy.com/wp-content/uploads/3-10-2-scaled.jpg', 1440, 960, [565, 145, 240], [400, 150, 600]), // 13 · Agustín Rocha
  '16': photo(9, mundialito('1-17-140'), 1280, 1706, [582, 245, 320], [200, 220, 1000]), // 22 · Sebastián Sosa
  '1': photo(10, mundialito('1-25-141'), 1280, 1706, [405, 380, 320], [300, 325, 760]), // 1 · Matías De Gouveia
  '5': photo(11, 'https://ui-avatars.com/api/?background=C2185B&color=fff&size=512&font-size=0.4', 1080, 720, [460, 95, 270], [330, 65, 520]), // 6 · Leandro Passerini
  '7': photo(12, mundialito('1-22-141'), 1080, 720, [433, 105, 235], [280, 95, 480]), // 8 · Gonzalo Ramos
  '2': photo(13, mundialito('8-24-5'), 1080, 720, [490, 110, 170], [335, 90, 480]), // 2 · Guillermo Fontes
  '8': photo(14, mundialito('7-19-80'), 1080, 720, [500, 140, 250], [340, 80, 480]), // 9 · Julián Rocha
  '19': photo(15, mundialito('8-28-5'), 1080, 720, [475, 50, 190], [355, 25, 480]), // 80 · Matias Perez
  'a975d4b4-0e00-4b1e-bae6-02cb579436ec': photo(16, '', 613, 408, [250, 10, 115], [80, 0, 320]), // 5 · Leandro Bonjour
  '17': photo(17, mundialito('1-36-86'), 1079, 716, [630, 25, 195], [385, 15, 540]), // 30 · Gonzalo Jacques
  '20': photo(18, mundialito('8-1-6'), 651, 432, [235, 20, 120], [130, 15, 300]), // 99 · Nahuel Martínez
};

export function withClubPhoto(player: Player): Player {
  const assigned = PLAYER_PHOTOS[player.id];
  // A photo subsequently chosen by the club administrator takes precedence.
  if (!assigned || (player.image && player.image !== assigned.previousImage)) return player;
  return { ...player, image: new URL(assigned.src, window.location.origin).href };
}

export function playerPhotoFraming(player: Player): PlayerPhoto | undefined {
  const assigned = PLAYER_PHOTOS[player.id];
  if (!assigned || !player.image) return undefined;
  const url = new URL(player.image, window.location.origin);
  return url.origin === window.location.origin && url.pathname === assigned.src ? assigned : undefined;
}
