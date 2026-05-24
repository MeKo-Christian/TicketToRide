import type { MapData, Route, Station, Ticket } from '@ttr/engine';

/**
 * "Niedersachsen" — an independent statewide map of Lower Saxony.
 *
 * Stations are real cities across the state, placed at roughly their geographic
 * positions (north = top, east = right). Routes are inter-city corridors tuned for
 * gameplay: a dense, cyclic web with several long cross-state runs and a balanced
 * spread of lengths. Not a transit-accurate network — it's a Ticket to Ride board.
 */

const stations: Station[] = [
  // North-west coast
  { id: 'emden', name: 'Emden', x: 120, y: 175 },
  { id: 'wilhelmshaven', name: 'Wilhelmshaven', x: 270, y: 120 },
  { id: 'cuxhaven', name: 'Cuxhaven', x: 430, y: 70 },
  { id: 'bremerhaven', name: 'Bremerhaven', x: 375, y: 155 },
  { id: 'leer', name: 'Leer', x: 150, y: 235 },
  { id: 'oldenburg', name: 'Oldenburg', x: 270, y: 235 },
  { id: 'bremen', name: 'Bremen', x: 400, y: 245 },
  { id: 'delmenhorst', name: 'Delmenhorst', x: 340, y: 275 },

  // West (Ems)
  { id: 'nordhorn', name: 'Nordhorn', x: 105, y: 400 },
  { id: 'lingen', name: 'Lingen', x: 175, y: 345 },
  { id: 'meppen', name: 'Meppen', x: 160, y: 295 },
  { id: 'osnabrueck', name: 'Osnabrück', x: 225, y: 460 },

  // North-central / north-east
  { id: 'stade', name: 'Stade', x: 495, y: 155 },
  { id: 'verden', name: 'Verden', x: 435, y: 305 },
  { id: 'nienburg', name: 'Nienburg', x: 390, y: 375 },
  { id: 'lueneburg', name: 'Lüneburg', x: 600, y: 215 },
  { id: 'uelzen', name: 'Uelzen', x: 605, y: 305 },
  { id: 'celle', name: 'Celle', x: 515, y: 365 },
  { id: 'gifhorn', name: 'Gifhorn', x: 605, y: 360 },

  // Central
  { id: 'hannover', name: 'Hannover', x: 465, y: 425 },
  { id: 'hildesheim', name: 'Hildesheim', x: 515, y: 480 },
  { id: 'peine', name: 'Peine', x: 565, y: 435 },

  // East / south-east
  { id: 'wolfsburg', name: 'Wolfsburg', x: 665, y: 375 },
  { id: 'braunschweig', name: 'Braunschweig', x: 640, y: 455 },
  { id: 'wolfenbuettel', name: 'Wolfenbüttel', x: 650, y: 495 },
  { id: 'salzgitter', name: 'Salzgitter', x: 595, y: 505 },
  { id: 'goslar', name: 'Goslar', x: 650, y: 560 },

  // South
  { id: 'hameln', name: 'Hameln', x: 415, y: 500 },
  { id: 'northeim', name: 'Northeim', x: 545, y: 565 },
  { id: 'goettingen', name: 'Göttingen', x: 545, y: 625 },
];

const routes: Route[] = [
  // North-west coast
  { id: 'emden-leer-red-2', a: 'emden', b: 'leer', length: 2, color: 'red', line: 1 },
  { id: 'leer-oldenburg-orange-4', a: 'leer', b: 'oldenburg', length: 4, color: 'orange', line: 1 },
  {
    id: 'emden-wilhelmshaven-yellow-5',
    a: 'emden',
    b: 'wilhelmshaven',
    length: 5,
    color: 'yellow',
    line: 1,
  },
  {
    id: 'wilhelmshaven-bremerhaven-green-4',
    a: 'wilhelmshaven',
    b: 'bremerhaven',
    length: 4,
    color: 'green',
    line: 1,
  },
  {
    id: 'bremerhaven-cuxhaven-blue-3',
    a: 'bremerhaven',
    b: 'cuxhaven',
    length: 3,
    color: 'blue',
    line: 1,
  },
  {
    id: 'wilhelmshaven-oldenburg-pink-4',
    a: 'wilhelmshaven',
    b: 'oldenburg',
    length: 4,
    color: 'pink',
    line: 1,
  },
  { id: 'oldenburg-bremen-white-4', a: 'oldenburg', b: 'bremen', length: 4, color: 'white', line: 1 },
  {
    id: 'oldenburg-delmenhorst-black-2',
    a: 'oldenburg',
    b: 'delmenhorst',
    length: 2,
    color: 'black',
    line: 1,
  },
  {
    id: 'delmenhorst-bremen-gray-2',
    a: 'delmenhorst',
    b: 'bremen',
    length: 2,
    color: 'gray',
    line: 1,
  },
  {
    id: 'bremerhaven-bremen-red-3',
    a: 'bremerhaven',
    b: 'bremen',
    length: 3,
    color: 'red',
    line: 1,
  },
  { id: 'cuxhaven-stade-orange-3', a: 'cuxhaven', b: 'stade', length: 3, color: 'orange', line: 1 },
  { id: 'bremen-verden-yellow-2', a: 'bremen', b: 'verden', length: 2, color: 'yellow', line: 3 },
  { id: 'stade-lueneburg-green-4', a: 'stade', b: 'lueneburg', length: 4, color: 'green', line: 3 },
  {
    id: 'bremerhaven-stade-blue-4',
    a: 'bremerhaven',
    b: 'stade',
    length: 4,
    color: 'blue',
    line: 1,
  },

  // West (Ems)
  { id: 'leer-meppen-pink-2', a: 'leer', b: 'meppen', length: 2, color: 'pink', line: 2 },
  { id: 'meppen-lingen-white-2', a: 'meppen', b: 'lingen', length: 2, color: 'white', line: 2 },
  { id: 'meppen-nordhorn-black-4', a: 'meppen', b: 'nordhorn', length: 4, color: 'black', line: 2 },
  { id: 'lingen-nordhorn-gray-3', a: 'lingen', b: 'nordhorn', length: 3, color: 'gray', line: 2 },
  {
    id: 'lingen-osnabrueck-red-4',
    a: 'lingen',
    b: 'osnabrueck',
    length: 4,
    color: 'red',
    line: 2,
  },
  {
    id: 'meppen-oldenburg-orange-4',
    a: 'meppen',
    b: 'oldenburg',
    length: 4,
    color: 'orange',
    line: 2,
  },
  {
    id: 'nordhorn-osnabrueck-yellow-5',
    a: 'nordhorn',
    b: 'osnabrueck',
    length: 5,
    color: 'yellow',
    line: 2,
  },
  {
    id: 'osnabrueck-nienburg-green-6',
    a: 'osnabrueck',
    b: 'nienburg',
    length: 6,
    color: 'green',
    line: 2,
  },

  // Central / north-east
  { id: 'verden-nienburg-blue-3', a: 'verden', b: 'nienburg', length: 3, color: 'blue', line: 3 },
  { id: 'nienburg-hannover-pink-3', a: 'nienburg', b: 'hannover', length: 3, color: 'pink', line: 3 },
  { id: 'bremen-nienburg-white-4', a: 'bremen', b: 'nienburg', length: 4, color: 'white', line: 3 },
  { id: 'verden-celle-black-3', a: 'verden', b: 'celle', length: 3, color: 'black', line: 3 },
  {
    id: 'celle-hannover-gray-2',
    a: 'celle',
    b: 'hannover',
    length: 2,
    color: 'gray',
    line: 4,
  },
  { id: 'celle-gifhorn-red-3', a: 'celle', b: 'gifhorn', length: 3, color: 'red', line: 4 },
  { id: 'celle-uelzen-orange-4', a: 'celle', b: 'uelzen', length: 4, color: 'orange', line: 4 },
  {
    id: 'lueneburg-uelzen-yellow-3',
    a: 'lueneburg',
    b: 'uelzen',
    length: 3,
    color: 'yellow',
    line: 4,
  },
  { id: 'uelzen-gifhorn-green-2', a: 'uelzen', b: 'gifhorn', length: 2, color: 'green', line: 4 },
  {
    id: 'gifhorn-wolfsburg-blue-2',
    a: 'gifhorn',
    b: 'wolfsburg',
    length: 2,
    color: 'blue',
    line: 4,
  },
  {
    id: 'wolfsburg-braunschweig-pink-3',
    a: 'wolfsburg',
    b: 'braunschweig',
    length: 3,
    color: 'pink',
    line: 6,
  },
  {
    id: 'gifhorn-braunschweig-white-3',
    a: 'gifhorn',
    b: 'braunschweig',
    length: 3,
    color: 'white',
    line: 6,
  },
  { id: 'hannover-peine-black-3', a: 'hannover', b: 'peine', length: 3, color: 'black', line: 5 },
  {
    id: 'peine-braunschweig-gray-2',
    a: 'peine',
    b: 'braunschweig',
    length: 2,
    color: 'gray',
    line: 6,
  },
  { id: 'peine-hildesheim-red-2', a: 'peine', b: 'hildesheim', length: 2, color: 'red', line: 5 },
  {
    id: 'hannover-hildesheim-orange-2',
    a: 'hannover',
    b: 'hildesheim',
    length: 2,
    color: 'orange',
    line: 5,
    parallel: 'hannover-hildesheim-green-2',
  },
  {
    id: 'hannover-hildesheim-green-2',
    a: 'hannover',
    b: 'hildesheim',
    length: 2,
    color: 'green',
    line: 5,
    parallel: 'hannover-hildesheim-orange-2',
  },
  { id: 'hannover-hameln-yellow-3', a: 'hannover', b: 'hameln', length: 3, color: 'yellow', line: 5 },
  {
    id: 'hameln-hildesheim-blue-3',
    a: 'hameln',
    b: 'hildesheim',
    length: 3,
    color: 'blue',
    line: 5,
  },
  { id: 'lueneburg-celle-pink-6', a: 'lueneburg', b: 'celle', length: 6, color: 'pink', line: 4 },

  // East / south-east
  {
    id: 'braunschweig-wolfenbuettel-white-1',
    a: 'braunschweig',
    b: 'wolfenbuettel',
    length: 1,
    color: 'white',
    line: 6,
  },
  {
    id: 'wolfenbuettel-salzgitter-black-2',
    a: 'wolfenbuettel',
    b: 'salzgitter',
    length: 2,
    color: 'black',
    line: 6,
  },
  {
    id: 'salzgitter-hildesheim-gray-3',
    a: 'salzgitter',
    b: 'hildesheim',
    length: 3,
    color: 'gray',
    line: 5,
  },
  { id: 'salzgitter-goslar-red-2', a: 'salzgitter', b: 'goslar', length: 2, color: 'red', line: 7 },
  {
    id: 'wolfenbuettel-goslar-orange-2',
    a: 'wolfenbuettel',
    b: 'goslar',
    length: 2,
    color: 'orange',
    line: 7,
  },
  {
    id: 'salzgitter-northeim-yellow-2',
    a: 'salzgitter',
    b: 'northeim',
    length: 2,
    color: 'yellow',
    line: 7,
  },
  {
    id: 'hildesheim-northeim-green-3',
    a: 'hildesheim',
    b: 'northeim',
    length: 3,
    color: 'green',
    line: 7,
  },
  {
    id: 'northeim-goettingen-blue-2',
    a: 'northeim',
    b: 'goettingen',
    length: 2,
    color: 'blue',
    line: 7,
  },
  { id: 'northeim-goslar-pink-4', a: 'northeim', b: 'goslar', length: 4, color: 'pink', line: 7 },
  {
    id: 'goettingen-goslar-white-4',
    a: 'goettingen',
    b: 'goslar',
    length: 4,
    color: 'white',
    line: 7,
  },
  { id: 'hameln-northeim-black-5', a: 'hameln', b: 'northeim', length: 5, color: 'black', line: 5 },
  { id: 'wolfsburg-uelzen-gray-3', a: 'wolfsburg', b: 'uelzen', length: 3, color: 'gray', line: 4 },
  {
    id: 'osnabrueck-hameln-red-6',
    a: 'osnabrueck',
    b: 'hameln',
    length: 6,
    color: 'red',
    line: 2,
  },
];

const tickets: Ticket[] = [
  // Short hops (3-6 pts)
  { id: 't-ns-emden-leer', from: 'emden', to: 'leer', points: 3 },
  { id: 't-ns-oldenburg-bremen', from: 'oldenburg', to: 'bremen', points: 5 },
  { id: 't-ns-delmenhorst-bremen', from: 'delmenhorst', to: 'bremen', points: 3 },
  { id: 't-ns-braunschweig-wolfenbuettel', from: 'braunschweig', to: 'wolfenbuettel', points: 3 },
  { id: 't-ns-celle-hannover', from: 'celle', to: 'hannover', points: 4 },
  { id: 't-ns-peine-hildesheim', from: 'peine', to: 'hildesheim', points: 4 },
  { id: 't-ns-northeim-goettingen', from: 'northeim', to: 'goettingen', points: 4 },
  { id: 't-ns-salzgitter-goslar', from: 'salzgitter', to: 'goslar', points: 5 },
  { id: 't-ns-hameln-hannover', from: 'hameln', to: 'hannover', points: 5 },
  { id: 't-ns-oldenburg-wilhelmshaven', from: 'oldenburg', to: 'wilhelmshaven', points: 6 },

  // Medium runs (7-12 pts)
  { id: 't-ns-hannover-braunschweig', from: 'hannover', to: 'braunschweig', points: 8 },
  { id: 't-ns-bremen-hannover', from: 'bremen', to: 'hannover', points: 9 },
  { id: 't-ns-osnabrueck-meppen', from: 'osnabrueck', to: 'meppen', points: 7 },
  { id: 't-ns-lueneburg-celle', from: 'lueneburg', to: 'celle', points: 9 },
  { id: 't-ns-hildesheim-goettingen', from: 'hildesheim', to: 'goettingen', points: 8 },
  { id: 't-ns-celle-wolfsburg', from: 'celle', to: 'wolfsburg', points: 8 },
  { id: 't-ns-stade-bremen', from: 'stade', to: 'bremen', points: 8 },
  { id: 't-ns-emden-oldenburg', from: 'emden', to: 'oldenburg', points: 8 },
  { id: 't-ns-bremerhaven-hannover', from: 'bremerhaven', to: 'hannover', points: 12 },
  { id: 't-ns-hameln-goslar', from: 'hameln', to: 'goslar', points: 11 },

  // Long cross-state runs (13-22 pts)
  { id: 't-ns-emden-hannover', from: 'emden', to: 'hannover', points: 16 },
  { id: 't-ns-cuxhaven-goettingen', from: 'cuxhaven', to: 'goettingen', points: 22 },
  { id: 't-ns-nordhorn-braunschweig', from: 'nordhorn', to: 'braunschweig', points: 20 },
  { id: 't-ns-wilhelmshaven-goslar', from: 'wilhelmshaven', to: 'goslar', points: 19 },
  { id: 't-ns-osnabrueck-wolfsburg', from: 'osnabrueck', to: 'wolfsburg', points: 18 },
  { id: 't-ns-lueneburg-goettingen', from: 'lueneburg', to: 'goettingen', points: 18 },
  { id: 't-ns-stade-osnabrueck', from: 'stade', to: 'osnabrueck', points: 19 },
  { id: 't-ns-emden-goslar', from: 'emden', to: 'goslar', points: 22 },
  { id: 't-ns-nordhorn-lueneburg', from: 'nordhorn', to: 'lueneburg', points: 21 },
  { id: 't-ns-oldenburg-braunschweig', from: 'oldenburg', to: 'braunschweig', points: 15 },
  { id: 't-ns-goettingen-bremen', from: 'goettingen', to: 'bremen', points: 17 },
  { id: 't-ns-wilhelmshaven-hannover', from: 'wilhelmshaven', to: 'hannover', points: 13 },
  { id: 't-ns-cuxhaven-hildesheim', from: 'cuxhaven', to: 'hildesheim', points: 17 },
  { id: 't-ns-meppen-celle', from: 'meppen', to: 'celle', points: 16 },
];

export const niedersachsenMap: MapData = {
  stations,
  routes,
  tickets,
};
