import type { MapData, Route, Station, Ticket } from '@ttr/engine';

/**
 * Hannover Stadtbahn map for Ticket to Ride.
 *
 * Stations are hand-curated termini, interchanges, and landmarks across the real
 * Stadtbahn lines 1-11 and 17. Coordinates are tuned so that the SVG distance
 * between any two connected stations roughly matches the visual length of that
 * route's wagon strip (≈ 27 · length + 25 SVG units), keeping the visual margin
 * between the last wagon and the station circle uniform across the board.
 *
 * Route topology favours real-network corridors where practical: every route
 * either follows an actual Stadtbahn line (with intermediate stops collapsed)
 * or is a short geographically plausible cross-line shortcut kept for game
 * balance. The clearly impossible long-range cross-network edges (e.g.
 * Roderbruch↔Misburg on different branches) have been removed.
 */

const stations: Station[] = [
  // Central interchange core (fish-eye expanded for readability)
  { id: 'hbf', name: 'Hauptbahnhof', x: 500, y: 380 },
  { id: 'kroepcke', name: 'Kröpcke', x: 500, y: 460 },
  { id: 'steintor', name: 'Steintor', x: 430, y: 415 },
  { id: 'aegi', name: 'Aegidientorplatz', x: 560, y: 515 },
  { id: 'koenigsworth', name: 'Königsworther Platz', x: 350, y: 425 },
  { id: 'markthalle', name: 'Markthalle/Landtag', x: 465, y: 530 },
  { id: 'waterloo', name: 'Waterloo', x: 470, y: 600 },

  // North
  { id: 'vahrenwalder', name: 'Vahrenwalder Platz', x: 500, y: 305 },
  { id: 'lister', name: 'Lister Platz', x: 580, y: 370 },
  { id: 'haltenhoff', name: 'Haltenhoffstraße', x: 320, y: 360 },
  { id: 'bothfeld', name: 'Bothfeld', x: 635, y: 285 },
  { id: 'langenhagen', name: 'Langenhagen', x: 485, y: 145 },
  { id: 'nordhafen', name: 'Nordhafen', x: 375, y: 250 },
  { id: 'alte_heide', name: 'Alte Heide', x: 710, y: 320 },
  { id: 'altwarmbuechen', name: 'Altwarmbüchen', x: 745, y: 220 },
  { id: 'fasanenkrug', name: 'Fasanenkrug', x: 665, y: 195 },
  { id: 'stoecken', name: 'Stöcken', x: 340, y: 290 },

  // West
  { id: 'garbsen', name: 'Garbsen', x: 180, y: 320 },
  { id: 'ahlem', name: 'Ahlem', x: 230, y: 510 },
  { id: 'linden', name: 'Lindener Marktplatz', x: 380, y: 615 },
  { id: 'empelde', name: 'Empelde', x: 260, y: 680 },
  { id: 'wettbergen', name: 'Wettbergen', x: 350, y: 695 },

  // South
  { id: 'allerweg', name: 'Allerweg', x: 475, y: 680 },
  { id: 'sarstedt', name: 'Sarstedt', x: 680, y: 770 },
  { id: 'rethen', name: 'Rethen', x: 595, y: 690 },

  // East — Medizinische Hochschule offset off the aegi↔zoo line so the L4 strip doesn't pass through it
  { id: 'med_hochschule', name: 'Medizinische Hochschule', x: 605, y: 485 },
  { id: 'zoo', name: 'Zoo', x: 700, y: 525 },
  { id: 'roderbruch', name: 'Roderbruch', x: 790, y: 480 },
  { id: 'anderten', name: 'Anderten', x: 760, y: 660 },
  { id: 'messe_ost', name: 'Messe/Ost', x: 645, y: 640 },
  { id: 'misburg', name: 'Misburg', x: 870, y: 580 },
];

const routes: Route[] = [
  // Central core (parallel pair on the busiest segments)
  {
    id: 'hbf-kroepcke-red-1',
    a: 'hbf',
    b: 'kroepcke',
    length: 1,
    color: 'red',
    line: 1,
    parallel: 'hbf-kroepcke-blue-1',
  },
  {
    id: 'hbf-kroepcke-blue-1',
    a: 'hbf',
    b: 'kroepcke',
    length: 1,
    color: 'blue',
    line: 9,
    parallel: 'hbf-kroepcke-red-1',
  },
  {
    id: 'kroepcke-aegi-yellow-1',
    a: 'kroepcke',
    b: 'aegi',
    length: 1,
    color: 'yellow',
    line: 2,
    parallel: 'kroepcke-aegi-green-1',
  },
  {
    id: 'kroepcke-aegi-green-1',
    a: 'kroepcke',
    b: 'aegi',
    length: 1,
    color: 'green',
    line: 6,
    parallel: 'kroepcke-aegi-yellow-1',
  },
  {
    id: 'steintor-kroepcke-orange-1',
    a: 'steintor',
    b: 'kroepcke',
    length: 1,
    color: 'orange',
    line: 5,
  },
  { id: 'hbf-steintor-pink-1', a: 'hbf', b: 'steintor', length: 1, color: 'pink', line: 10 },
  {
    id: 'koenigsworth-steintor-white-1',
    a: 'koenigsworth',
    b: 'steintor',
    length: 1,
    color: 'white',
    line: 4,
  },
  { id: 'aegi-markthalle-black-2', a: 'aegi', b: 'markthalle', length: 2, color: 'black', line: 1 },
  {
    id: 'kroepcke-markthalle-blue-1',
    a: 'kroepcke',
    b: 'markthalle',
    length: 1,
    color: 'blue',
    line: 3,
  },
  {
    id: 'markthalle-waterloo-yellow-2',
    a: 'markthalle',
    b: 'waterloo',
    length: 2,
    color: 'yellow',
    line: 1,
    parallel: 'markthalle-waterloo-orange-2',
  },
  {
    id: 'markthalle-waterloo-orange-2',
    a: 'markthalle',
    b: 'waterloo',
    length: 2,
    color: 'orange',
    line: 9,
    parallel: 'markthalle-waterloo-yellow-2',
  },

  // North
  { id: 'hbf-vahrenwalder-gray-2', a: 'hbf', b: 'vahrenwalder', length: 2, color: 'gray', line: 1 },
  {
    id: 'vahrenwalder-langenhagen-red-5',
    a: 'vahrenwalder',
    b: 'langenhagen',
    length: 5,
    color: 'red',
    line: 1,
  },
  {
    id: 'steintor-nordhafen-green-5',
    a: 'steintor',
    b: 'nordhafen',
    length: 5,
    color: 'green',
    line: 6,
  },
  { id: 'hbf-lister-yellow-1', a: 'hbf', b: 'lister', length: 1, color: 'yellow', line: 2 },
  {
    id: 'lister-alte_heide-white-4',
    a: 'lister',
    b: 'alte_heide',
    length: 4,
    color: 'white',
    line: 2,
  },
  { id: 'lister-bothfeld-pink-3', a: 'lister', b: 'bothfeld', length: 3, color: 'pink', line: 8 },
  {
    id: 'bothfeld-altwarmbuechen-orange-3',
    a: 'bothfeld',
    b: 'altwarmbuechen',
    length: 3,
    color: 'orange',
    line: 3,
  },
  {
    id: 'bothfeld-fasanenkrug-black-3',
    a: 'bothfeld',
    b: 'fasanenkrug',
    length: 3,
    color: 'black',
    line: 9,
  },
  {
    id: 'haltenhoff-steintor-yellow-3',
    a: 'haltenhoff',
    b: 'steintor',
    length: 3,
    color: 'yellow',
    line: 11,
  },

  // West
  {
    id: 'koenigsworth-ahlem-red-4',
    a: 'koenigsworth',
    b: 'ahlem',
    length: 4,
    color: 'red',
    line: 10,
  },
  { id: 'garbsen-stoecken-black-5', a: 'garbsen', b: 'stoecken', length: 5, color: 'black', line: 4 },
  {
    id: 'stoecken-steintor-red-5',
    a: 'stoecken',
    b: 'steintor',
    length: 5,
    color: 'red',
    line: 5,
  },
  { id: 'linden-empelde-white-4', a: 'linden', b: 'empelde', length: 4, color: 'white', line: 9 },
  {
    id: 'waterloo-linden-green-3',
    a: 'waterloo',
    b: 'linden',
    length: 3,
    color: 'green',
    line: 9,
  },
  {
    id: 'allerweg-wettbergen-orange-4',
    a: 'allerweg',
    b: 'wettbergen',
    length: 4,
    color: 'orange',
    line: 7,
  },

  // South
  {
    id: 'waterloo-allerweg-pink-3',
    a: 'waterloo',
    b: 'allerweg',
    length: 3,
    color: 'pink',
    line: 3,
  },
  { id: 'aegi-rethen-black-5', a: 'aegi', b: 'rethen', length: 5, color: 'black', line: 1 },
  { id: 'rethen-sarstedt-pink-3', a: 'rethen', b: 'sarstedt', length: 3, color: 'pink', line: 1 },

  // East
  {
    id: 'aegi-med_hochschule-pink-1',
    a: 'aegi',
    b: 'med_hochschule',
    length: 1,
    color: 'pink',
    line: 4,
  },
  {
    id: 'med_hochschule-zoo-green-2',
    a: 'med_hochschule',
    b: 'zoo',
    length: 2,
    color: 'green',
    line: 11,
  },
  { id: 'aegi-zoo-gray-4', a: 'aegi', b: 'zoo', length: 4, color: 'gray', line: 11 },
  { id: 'zoo-anderten-blue-4', a: 'zoo', b: 'anderten', length: 4, color: 'blue', line: 5 },
  {
    id: 'med_hochschule-roderbruch-white-6',
    a: 'med_hochschule',
    b: 'roderbruch',
    length: 6,
    color: 'white',
    line: 4,
  },
  { id: 'aegi-messe_ost-yellow-5', a: 'aegi', b: 'messe_ost', length: 5, color: 'yellow', line: 6 },
  {
    id: 'messe_ost-anderten-green-3',
    a: 'messe_ost',
    b: 'anderten',
    length: 3,
    color: 'green',
    line: 6,
  },
  {
    id: 'anderten-misburg-black-4',
    a: 'anderten',
    b: 'misburg',
    length: 4,
    color: 'black',
    line: 7,
  },
];

const tickets: Ticket[] = [
  // Short city hops (3-6 pts)
  { id: 't-hbf-kroepcke', from: 'hbf', to: 'kroepcke', points: 3 },
  { id: 't-kroepcke-aegi', from: 'kroepcke', to: 'aegi', points: 3 },
  { id: 't-steintor-markthalle', from: 'steintor', to: 'markthalle', points: 4 },
  { id: 't-hbf-lister', from: 'hbf', to: 'lister', points: 4 },
  { id: 't-koenigsworth-linden', from: 'koenigsworth', to: 'linden', points: 5 },
  { id: 't-aegi-zoo', from: 'aegi', to: 'zoo', points: 5 },
  { id: 't-waterloo-allerweg', from: 'waterloo', to: 'allerweg', points: 5 },

  // Medium intra-city runs (7-11 pts)
  { id: 't-vahrenwalder-waterloo', from: 'vahrenwalder', to: 'waterloo', points: 8 },
  { id: 't-haltenhoff-aegi', from: 'haltenhoff', to: 'aegi', points: 7 },
  { id: 't-lister-linden', from: 'lister', to: 'linden', points: 8 },
  { id: 't-bothfeld-aegi', from: 'bothfeld', to: 'aegi', points: 9 },
  { id: 't-markthalle-zoo', from: 'markthalle', to: 'zoo', points: 8 },
  { id: 't-koenigsworth-waterloo', from: 'koenigsworth', to: 'waterloo', points: 8 },
  { id: 't-med_hochschule-hbf', from: 'med_hochschule', to: 'hbf', points: 7 },
  { id: 't-nordhafen-hbf', from: 'nordhafen', to: 'hbf', points: 8 },

  // Suburban-to-centre (10-15 pts)
  { id: 't-langenhagen-hbf', from: 'langenhagen', to: 'hbf', points: 10 },
  { id: 't-altwarmbuechen-kroepcke', from: 'altwarmbuechen', to: 'kroepcke', points: 12 },
  { id: 't-stoecken-kroepcke', from: 'stoecken', to: 'kroepcke', points: 11 },
  { id: 't-garbsen-kroepcke', from: 'garbsen', to: 'kroepcke', points: 13 },
  { id: 't-ahlem-hbf', from: 'ahlem', to: 'hbf', points: 10 },
  { id: 't-misburg-kroepcke', from: 'misburg', to: 'kroepcke', points: 14 },
  { id: 't-sarstedt-kroepcke', from: 'sarstedt', to: 'kroepcke', points: 13 },
  { id: 't-wettbergen-hbf', from: 'wettbergen', to: 'hbf', points: 11 },
  { id: 't-rethen-hbf', from: 'rethen', to: 'hbf', points: 12 },
  { id: 't-empelde-aegi', from: 'empelde', to: 'aegi', points: 11 },

  // Long cross-network runs (15-22 pts)
  { id: 't-langenhagen-sarstedt', from: 'langenhagen', to: 'sarstedt', points: 20 },
  { id: 't-garbsen-misburg', from: 'garbsen', to: 'misburg', points: 22 },
  { id: 't-altwarmbuechen-wettbergen', from: 'altwarmbuechen', to: 'wettbergen', points: 19 },
  { id: 't-stoecken-anderten', from: 'stoecken', to: 'anderten', points: 18 },
  { id: 't-fasanenkrug-wettbergen', from: 'fasanenkrug', to: 'wettbergen', points: 20 },
  { id: 't-ahlem-misburg', from: 'ahlem', to: 'misburg', points: 17 },
  { id: 't-empelde-roderbruch', from: 'empelde', to: 'roderbruch', points: 18 },
  { id: 't-langenhagen-messe_ost', from: 'langenhagen', to: 'messe_ost', points: 15 },
  { id: 't-rethen-stoecken', from: 'rethen', to: 'stoecken', points: 17 },
  { id: 't-fasanenkrug-empelde', from: 'fasanenkrug', to: 'empelde', points: 19 },
];

export const hannoverMap: MapData = {
  stations,
  routes,
  tickets,
};
