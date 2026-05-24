import type { MapData, Route, Station, Ticket } from '@ttr/engine';

/**
 * Hannover Stadtbahn map for Ticket to Ride.
 *
 * Stations are hand-curated termini, interchanges, and landmarks across the real
 * Stadtbahn lines 1-18. Edges follow real line topology; intermediate stops between
 * two curated stations collapse into a single edge whose length is the (clamped 1-6)
 * approximate count of collapsed stops.
 *
 * Layout coordinates are schematic SVG x/y (not lat/lon), tuned for readability —
 * city centre is expanded relative to the suburban arms.
 */

const stations: Station[] = [
  // Central interchange core
  { id: 'hbf', name: 'Hauptbahnhof', x: 500, y: 380 },
  { id: 'kroepcke', name: 'Kröpcke', x: 500, y: 460 },
  { id: 'steintor', name: 'Steintor', x: 430, y: 410 },
  { id: 'aegi', name: 'Aegidientorplatz', x: 560, y: 510 },
  { id: 'koenigsworth', name: 'Königsworther Platz', x: 360, y: 430 },
  { id: 'markthalle', name: 'Markthalle/Landtag', x: 460, y: 510 },
  { id: 'waterloo', name: 'Waterloo', x: 500, y: 570 },

  // North
  { id: 'vahrenwalder', name: 'Vahrenwalder Platz', x: 500, y: 280 },
  { id: 'lister', name: 'Lister Platz', x: 580, y: 320 },
  { id: 'haltenhoff', name: 'Haltenhoffstraße', x: 320, y: 340 },
  { id: 'bothfeld', name: 'Bothfeld', x: 640, y: 230 },
  { id: 'langenhagen', name: 'Langenhagen', x: 460, y: 130 },
  { id: 'nordhafen', name: 'Nordhafen', x: 380, y: 200 },
  { id: 'alte_heide', name: 'Alte Heide', x: 720, y: 280 },
  { id: 'altwarmbuechen', name: 'Altwarmbüchen', x: 760, y: 170 },
  { id: 'fasanenkrug', name: 'Fasanenkrug', x: 660, y: 130 },
  { id: 'stoecken', name: 'Stöcken', x: 240, y: 220 },

  // West
  { id: 'garbsen', name: 'Garbsen', x: 130, y: 290 },
  { id: 'ahlem', name: 'Ahlem', x: 180, y: 430 },
  { id: 'linden', name: 'Lindener Marktplatz', x: 360, y: 540 },
  { id: 'empelde', name: 'Empelde', x: 220, y: 600 },
  { id: 'wettbergen', name: 'Wettbergen', x: 280, y: 660 },

  // South
  { id: 'allerweg', name: 'Allerweg', x: 480, y: 660 },
  { id: 'hemmingen', name: 'Hemmingen', x: 380, y: 760 },
  { id: 'sarstedt', name: 'Sarstedt', x: 520, y: 820 },
  { id: 'rethen', name: 'Rethen', x: 600, y: 740 },

  // East
  { id: 'universitaet', name: 'Universität', x: 620, y: 470 },
  { id: 'zoo', name: 'Zoo', x: 680, y: 510 },
  { id: 'roderbruch', name: 'Roderbruch', x: 800, y: 470 },
  { id: 'anderten', name: 'Anderten', x: 800, y: 600 },
  { id: 'messe_ost', name: 'Messe/Ost', x: 700, y: 650 },
  { id: 'misburg', name: 'Misburg', x: 880, y: 380 },
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
  { id: 'aegi-waterloo-black-1', a: 'aegi', b: 'waterloo', length: 1, color: 'black', line: 1 },
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
    line: 17,
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
    id: 'vahrenwalder-nordhafen-green-3',
    a: 'vahrenwalder',
    b: 'nordhafen',
    length: 3,
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
  { id: 'lister-bothfeld-pink-3', a: 'lister', b: 'bothfeld', length: 3, color: 'pink', line: 9 },
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
    id: 'haltenhoff-koenigsworth-blue-1',
    a: 'haltenhoff',
    b: 'koenigsworth',
    length: 1,
    color: 'blue',
    line: 5,
  },
  {
    id: 'haltenhoff-stoecken-gray-4',
    a: 'haltenhoff',
    b: 'stoecken',
    length: 4,
    color: 'gray',
    line: 5,
  },
  {
    id: 'stoecken-nordhafen-white-2',
    a: 'stoecken',
    b: 'nordhafen',
    length: 2,
    color: 'white',
    line: 6,
  },
  {
    id: 'langenhagen-fasanenkrug-orange-4',
    a: 'langenhagen',
    b: 'fasanenkrug',
    length: 4,
    color: 'orange',
    line: 9,
  },
  {
    id: 'altwarmbuechen-fasanenkrug-pink-2',
    a: 'altwarmbuechen',
    b: 'fasanenkrug',
    length: 2,
    color: 'pink',
    line: 9,
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
  {
    id: 'haltenhoff-garbsen-yellow-6',
    a: 'haltenhoff',
    b: 'garbsen',
    length: 6,
    color: 'yellow',
    line: 4,
  },
  { id: 'garbsen-ahlem-black-4', a: 'garbsen', b: 'ahlem', length: 4, color: 'black', line: 10 },
  {
    id: 'koenigsworth-linden-gray-2',
    a: 'koenigsworth',
    b: 'linden',
    length: 2,
    color: 'gray',
    line: 9,
  },
  {
    id: 'markthalle-linden-green-2',
    a: 'markthalle',
    b: 'linden',
    length: 2,
    color: 'green',
    line: 3,
  },
  {
    id: 'linden-wettbergen-blue-3',
    a: 'linden',
    b: 'wettbergen',
    length: 3,
    color: 'blue',
    line: 7,
  },
  { id: 'linden-empelde-white-4', a: 'linden', b: 'empelde', length: 4, color: 'white', line: 9 },
  {
    id: 'empelde-wettbergen-orange-2',
    a: 'empelde',
    b: 'wettbergen',
    length: 2,
    color: 'orange',
    line: 7,
  },

  // South
  {
    id: 'waterloo-allerweg-pink-2',
    a: 'waterloo',
    b: 'allerweg',
    length: 2,
    color: 'pink',
    line: 3,
  },
  {
    id: 'allerweg-sarstedt-orange-6',
    a: 'allerweg',
    b: 'sarstedt',
    length: 6,
    color: 'orange',
    line: 1,
  },
  { id: 'waterloo-rethen-black-5', a: 'waterloo', b: 'rethen', length: 5, color: 'black', line: 2 },
  {
    id: 'allerweg-hemmingen-red-4',
    a: 'allerweg',
    b: 'hemmingen',
    length: 4,
    color: 'red',
    line: 13,
  },
  {
    id: 'wettbergen-hemmingen-gray-4',
    a: 'wettbergen',
    b: 'hemmingen',
    length: 4,
    color: 'gray',
    line: 13,
  },
  { id: 'rethen-sarstedt-pink-3', a: 'rethen', b: 'sarstedt', length: 3, color: 'pink', line: 1 },

  // East
  {
    id: 'aegi-universitaet-pink-1',
    a: 'aegi',
    b: 'universitaet',
    length: 1,
    color: 'pink',
    line: 4,
  },
  {
    id: 'universitaet-zoo-green-2',
    a: 'universitaet',
    b: 'zoo',
    length: 2,
    color: 'green',
    line: 11,
  },
  { id: 'aegi-zoo-gray-2', a: 'aegi', b: 'zoo', length: 2, color: 'gray', line: 11 },
  { id: 'zoo-anderten-blue-4', a: 'zoo', b: 'anderten', length: 4, color: 'blue', line: 5 },
  { id: 'zoo-roderbruch-white-3', a: 'zoo', b: 'roderbruch', length: 3, color: 'white', line: 4 },
  {
    id: 'roderbruch-misburg-red-5',
    a: 'roderbruch',
    b: 'misburg',
    length: 5,
    color: 'red',
    line: 7,
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
    line: 11,
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
  { id: 't-universitaet-hbf', from: 'universitaet', to: 'hbf', points: 7 },
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
  { id: 't-fasanenkrug-hemmingen', from: 'fasanenkrug', to: 'hemmingen', points: 20 },
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
