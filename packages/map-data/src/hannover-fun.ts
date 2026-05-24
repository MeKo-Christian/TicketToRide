import type { MapData, Route, Station } from '@ttr/engine';
import { hannoverMap } from './hannover.js';

/**
 * "Greater Hannover (Fun)" — a fictional variant of the Hannover map.
 *
 * Same station set as the faithful Stadtbahn map, but laid out closer to each
 * district's real geographic position and wired with a denser, more cyclic route
 * network designed for gameplay rather than realism: multiple alternate paths and
 * loops (so the centre isn't a single chokepoint), several long cross-map routes,
 * and a balanced spread of route lengths (1-6).
 *
 * Tickets are shared with the faithful map — the station set is identical, and the
 * denser graph keeps every endpoint reachable.
 */

const stations: Station[] = [
  // Central core (compact, like the real city centre)
  { id: 'hbf', name: 'Hauptbahnhof', x: 495, y: 400 },
  { id: 'kroepcke', name: 'Kröpcke', x: 505, y: 450 },
  { id: 'steintor', name: 'Steintor', x: 450, y: 425 },
  { id: 'aegi', name: 'Aegidientorplatz', x: 545, y: 480 },
  { id: 'koenigsworth', name: 'Königsworther Platz', x: 420, y: 445 },
  { id: 'waterloo', name: 'Waterloo', x: 475, y: 515 },

  // North
  { id: 'lister', name: 'Lister Platz', x: 580, y: 385 },
  { id: 'vahrenwalder', name: 'Vahrenwalder Platz', x: 485, y: 315 },
  { id: 'haltenhoff', name: 'Haltenhoffstraße', x: 405, y: 360 },
  { id: 'nordhafen', name: 'Nordhafen', x: 420, y: 285 },
  { id: 'stoecken', name: 'Stöcken', x: 330, y: 235 },
  { id: 'bothfeld', name: 'Bothfeld', x: 625, y: 285 },
  { id: 'alte_heide', name: 'Alte Heide', x: 575, y: 330 },
  { id: 'fasanenkrug', name: 'Fasanenkrug', x: 655, y: 200 },
  { id: 'altwarmbuechen', name: 'Altwarmbüchen', x: 735, y: 235 },
  { id: 'langenhagen', name: 'Langenhagen', x: 465, y: 145 },

  // West
  { id: 'garbsen', name: 'Garbsen', x: 165, y: 255 },
  { id: 'ahlem', name: 'Ahlem', x: 290, y: 445 },

  // South-west
  { id: 'linden', name: 'Lindener Marktplatz', x: 415, y: 545 },
  { id: 'empelde', name: 'Empelde', x: 315, y: 625 },
  { id: 'wettbergen', name: 'Wettbergen', x: 385, y: 650 },

  // South
  { id: 'allerweg', name: 'Allerweg', x: 495, y: 585 },
  { id: 'rethen', name: 'Rethen', x: 595, y: 725 },
  { id: 'sarstedt', name: 'Sarstedt', x: 565, y: 835 },

  // East
  { id: 'zoo', name: 'Zoo', x: 600, y: 505 },
  { id: 'med_hochschule', name: 'Medizinische Hochschule', x: 665, y: 460 },
  { id: 'roderbruch', name: 'Roderbruch', x: 725, y: 400 },
  { id: 'anderten', name: 'Anderten', x: 745, y: 565 },
  { id: 'messe_ost', name: 'Messe/Ost', x: 665, y: 625 },
  { id: 'misburg', name: 'Misburg', x: 805, y: 425 },
];

const routes: Route[] = [
  // Central core — tight loop with one double-track spine
  {
    id: 'hbf-kroepcke-red-2',
    a: 'hbf',
    b: 'kroepcke',
    length: 2,
    color: 'red',
    line: 1,
    parallel: 'hbf-kroepcke-blue-2',
  },
  {
    id: 'hbf-kroepcke-blue-2',
    a: 'hbf',
    b: 'kroepcke',
    length: 2,
    color: 'blue',
    line: 1,
    parallel: 'hbf-kroepcke-red-2',
  },
  { id: 'hbf-steintor-orange-1', a: 'hbf', b: 'steintor', length: 1, color: 'orange', line: 10 },
  { id: 'steintor-kroepcke-yellow-1', a: 'steintor', b: 'kroepcke', length: 1, color: 'yellow', line: 5 },
  { id: 'kroepcke-aegi-green-2', a: 'kroepcke', b: 'aegi', length: 2, color: 'green', line: 6 },
  { id: 'steintor-koenigsworth-pink-1', a: 'steintor', b: 'koenigsworth', length: 1, color: 'pink', line: 4 },
  { id: 'koenigsworth-waterloo-white-3', a: 'koenigsworth', b: 'waterloo', length: 3, color: 'white', line: 9 },
  { id: 'kroepcke-waterloo-black-2', a: 'kroepcke', b: 'waterloo', length: 2, color: 'black', line: 3 },
  { id: 'aegi-waterloo-gray-2', a: 'aegi', b: 'waterloo', length: 2, color: 'gray', line: 1 },
  { id: 'aegi-zoo-red-2', a: 'aegi', b: 'zoo', length: 2, color: 'red', line: 11 },

  // North
  { id: 'hbf-lister-orange-2', a: 'hbf', b: 'lister', length: 2, color: 'orange', line: 2 },
  { id: 'hbf-vahrenwalder-yellow-3', a: 'hbf', b: 'vahrenwalder', length: 3, color: 'yellow', line: 1 },
  { id: 'steintor-haltenhoff-green-2', a: 'steintor', b: 'haltenhoff', length: 2, color: 'green', line: 11 },
  { id: 'haltenhoff-nordhafen-blue-2', a: 'haltenhoff', b: 'nordhafen', length: 2, color: 'blue', line: 6 },
  { id: 'vahrenwalder-nordhafen-pink-2', a: 'vahrenwalder', b: 'nordhafen', length: 2, color: 'pink', line: 6 },
  { id: 'nordhafen-stoecken-white-3', a: 'nordhafen', b: 'stoecken', length: 3, color: 'white', line: 6 },
  { id: 'stoecken-garbsen-black-6', a: 'stoecken', b: 'garbsen', length: 6, color: 'black', line: 4 },
  { id: 'vahrenwalder-langenhagen-gray-6', a: 'vahrenwalder', b: 'langenhagen', length: 6, color: 'gray', line: 1 },
  { id: 'lister-vahrenwalder-red-4', a: 'lister', b: 'vahrenwalder', length: 4, color: 'red', line: 2 },
  { id: 'lister-alte_heide-orange-2', a: 'lister', b: 'alte_heide', length: 2, color: 'orange', line: 2 },
  { id: 'alte_heide-bothfeld-yellow-2', a: 'alte_heide', b: 'bothfeld', length: 2, color: 'yellow', line: 9 },
  { id: 'lister-bothfeld-green-3', a: 'lister', b: 'bothfeld', length: 3, color: 'green', line: 8 },
  { id: 'bothfeld-fasanenkrug-blue-3', a: 'bothfeld', b: 'fasanenkrug', length: 3, color: 'blue', line: 9 },
  { id: 'bothfeld-altwarmbuechen-pink-4', a: 'bothfeld', b: 'altwarmbuechen', length: 4, color: 'pink', line: 3 },
  { id: 'fasanenkrug-altwarmbuechen-white-2', a: 'fasanenkrug', b: 'altwarmbuechen', length: 2, color: 'white', line: 9 },
  { id: 'alte_heide-roderbruch-black-5', a: 'alte_heide', b: 'roderbruch', length: 5, color: 'black', line: 3 },
  { id: 'langenhagen-fasanenkrug-gray-6', a: 'langenhagen', b: 'fasanenkrug', length: 6, color: 'gray', line: 9 },
  { id: 'langenhagen-stoecken-red-5', a: 'langenhagen', b: 'stoecken', length: 5, color: 'red', line: 4 },

  // West
  { id: 'koenigsworth-ahlem-orange-4', a: 'koenigsworth', b: 'ahlem', length: 4, color: 'orange', line: 10 },
  { id: 'ahlem-garbsen-yellow-6', a: 'ahlem', b: 'garbsen', length: 6, color: 'yellow', line: 10 },
  { id: 'ahlem-linden-green-5', a: 'ahlem', b: 'linden', length: 5, color: 'green', line: 7 },
  { id: 'koenigsworth-haltenhoff-blue-2', a: 'koenigsworth', b: 'haltenhoff', length: 2, color: 'blue', line: 4 },

  // South-west / south
  { id: 'waterloo-linden-pink-2', a: 'waterloo', b: 'linden', length: 2, color: 'pink', line: 9 },
  { id: 'linden-empelde-white-4', a: 'linden', b: 'empelde', length: 4, color: 'white', line: 9 },
  { id: 'linden-wettbergen-black-3', a: 'linden', b: 'wettbergen', length: 3, color: 'black', line: 7 },
  { id: 'empelde-wettbergen-gray-2', a: 'empelde', b: 'wettbergen', length: 2, color: 'gray', line: 7 },
  { id: 'waterloo-allerweg-red-2', a: 'waterloo', b: 'allerweg', length: 2, color: 'red', line: 3 },
  { id: 'linden-allerweg-orange-3', a: 'linden', b: 'allerweg', length: 3, color: 'orange', line: 7 },
  { id: 'allerweg-rethen-yellow-6', a: 'allerweg', b: 'rethen', length: 6, color: 'yellow', line: 1 },
  { id: 'allerweg-wettbergen-green-4', a: 'allerweg', b: 'wettbergen', length: 4, color: 'green', line: 7 },
  { id: 'rethen-sarstedt-blue-3', a: 'rethen', b: 'sarstedt', length: 3, color: 'blue', line: 1 },
  { id: 'rethen-messe_ost-pink-3', a: 'rethen', b: 'messe_ost', length: 3, color: 'pink', line: 6 },
  { id: 'wettbergen-sarstedt-white-6', a: 'wettbergen', b: 'sarstedt', length: 6, color: 'white', line: 13 },

  // East
  { id: 'aegi-med_hochschule-black-4', a: 'aegi', b: 'med_hochschule', length: 4, color: 'black', line: 4 },
  { id: 'zoo-med_hochschule-gray-2', a: 'zoo', b: 'med_hochschule', length: 2, color: 'gray', line: 4 },
  { id: 'lister-roderbruch-red-5', a: 'lister', b: 'roderbruch', length: 5, color: 'red', line: 4 },
  { id: 'med_hochschule-roderbruch-orange-3', a: 'med_hochschule', b: 'roderbruch', length: 3, color: 'orange', line: 4 },
  { id: 'roderbruch-misburg-yellow-3', a: 'roderbruch', b: 'misburg', length: 3, color: 'yellow', line: 7 },
  { id: 'med_hochschule-misburg-green-4', a: 'med_hochschule', b: 'misburg', length: 4, color: 'green', line: 7 },
  { id: 'zoo-anderten-blue-5', a: 'zoo', b: 'anderten', length: 5, color: 'blue', line: 5 },
  { id: 'anderten-messe_ost-pink-3', a: 'anderten', b: 'messe_ost', length: 3, color: 'pink', line: 6 },
  { id: 'aegi-messe_ost-white-6', a: 'aegi', b: 'messe_ost', length: 6, color: 'white', line: 6 },
  { id: 'anderten-misburg-black-5', a: 'anderten', b: 'misburg', length: 5, color: 'black', line: 5 },
  { id: 'zoo-messe_ost-gray-4', a: 'zoo', b: 'messe_ost', length: 4, color: 'gray', line: 6 },
];

export const hannoverFunMap: MapData = {
  stations,
  routes,
  tickets: hannoverMap.tickets,
};
