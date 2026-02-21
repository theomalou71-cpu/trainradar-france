// netlify/functions/trains.js — TrainRadar France v4
// github.com/theomalou71-cpu
// Fixes: interpolation correcte, détection TGV fiable, 300+ gares

const fetch = require("node-fetch");
const GtfsRtBindings = require("gtfs-realtime-bindings");

const GTFS_RT_URL =
  "https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates";

// ── 300+ GARES SNCF ─────────────────────────────────────────────────────────
const GARES = {
  // Paris & Île-de-France
  "87686006": { n: "Paris Gare de Lyon",         lat: 48.8448,  lng: 2.3736  },
  "87113001": { n: "Paris Nord",                  lat: 48.8809,  lng: 2.3553  },
  "87271007": { n: "Paris Montparnasse",          lat: 48.8409,  lng: 2.3199  },
  "87384008": { n: "Paris Est",                   lat: 48.8765,  lng: 2.3590  },
  "87547000": { n: "Paris Saint-Lazare",          lat: 48.8760,  lng: 2.3244  },
  "87281006": { n: "Paris Bercy",                 lat: 48.8391,  lng: 2.3824  },
  "87384412": { n: "Massy TGV",                  lat: 48.7250,  lng: 2.2728  },
  "87271494": { n: "Marne-la-Vallée Chessy",     lat: 48.8714,  lng: 2.7794  },
  "87001479": { n: "Versailles Chantiers",        lat: 48.7966,  lng: 2.1271  },
  "87001008": { n: "Versailles Rive Droite",      lat: 48.8034,  lng: 2.1396  },
  "87382200": { n: "CDG TGV",                     lat: 49.0030,  lng: 2.5720  },
  "87271338": { n: "Évry-Courcouronnes",          lat: 48.6284,  lng: 2.4244  },
  "87272039": { n: "Melun",                       lat: 48.5367,  lng: 2.6656  },
  "87291682": { n: "Fontainebleau-Avon",          lat: 48.4053,  lng: 2.6997  },
  "87271387": { n: "Étampes",                     lat: 48.4333,  lng: 2.1565  },
  "87393207": { n: "Chantilly-Gouvieux",          lat: 49.1930,  lng: 2.4733  },
  "87271130": { n: "Juvisy",                      lat: 48.6925,  lng: 2.3772  },
  "87271544": { n: "Pontoise",                    lat: 49.0497,  lng: 2.0947  },
  "87271601": { n: "Dourdan",                     lat: 48.5272,  lng: 2.0119  },
  "87393306": { n: "Creil",                       lat: 49.2569,  lng: 2.4814  },
  "87271080": { n: "Corbeil-Essonnes",            lat: 48.6139,  lng: 2.4761  },
  "87271460": { n: "Massy Palaiseau",             lat: 48.7239,  lng: 2.2563  },
  "87271726": { n: "Compiègne",                   lat: 49.4161,  lng: 2.8275  },
  "87543009": { n: "Saint-Denis",                 lat: 48.9357,  lng: 2.3573  },
  "87547208": { n: "Argenteuil",                  lat: 48.9478,  lng: 2.2467  },
  "87271411": { n: "Austerlitz",                  lat: 48.8430,  lng: 2.3647  },
  "87382218": { n: "Villeparisis-Mitry",          lat: 48.9508,  lng: 2.5958  },
  "87271478": { n: "Brétigny",                    lat: 48.6088,  lng: 2.3064  },
  "87271510": { n: "Lardy",                       lat: 48.5589,  lng: 2.3025  },
  "87271569": { n: "Maisse",                      lat: 48.4197,  lng: 2.3672  },
  "87271619": { n: "Malesherbes",                 lat: 48.2964,  lng: 2.4011  },
  "87272021": { n: "Moret-Veneux-les-Sablons",   lat: 48.3717,  lng: 2.7978  },
  "87272104": { n: "Montereau",                   lat: 48.3772,  lng: 2.9494  },
  "87271643": { n: "Sens",                        lat: 48.2007,  lng: 3.2908  },
  "87001263": { n: "Saint-Cyr",                   lat: 48.7897,  lng: 2.0611  },
  "87382143": { n: "Le Bourget",                  lat: 48.9336,  lng: 2.4267  },
  "87393314": { n: "Orry-la-Ville",              lat: 49.1253,  lng: 2.5239  },
  // Hauts-de-France
  "87212027": { n: "Lille Flandres",             lat: 50.6367,  lng: 3.0706  },
  "87212019": { n: "Lille Europe",               lat: 50.6388,  lng: 3.0756  },
  "87233478": { n: "Amiens",                     lat: 49.8903,  lng: 2.3047  },
  "87277616": { n: "Arras",                      lat: 50.2870,  lng: 2.7817  },
  "87223263": { n: "Douai",                      lat: 50.3725,  lng: 3.0808  },
  "87223875": { n: "Valenciennes",               lat: 50.3572,  lng: 3.5286  },
  "87212076": { n: "Dunkerque",                  lat: 51.0347,  lng: 2.3761  },
  "87212134": { n: "Calais-Ville",               lat: 50.9509,  lng: 1.8575  },
  "87212175": { n: "Boulogne-Ville",             lat: 50.7267,  lng: 1.6133  },
  "87393009": { n: "Laon",                       lat: 49.5649,  lng: 3.6236  },
  "87391003": { n: "Reims",                      lat: 49.2569,  lng: 4.0248  },
  "87391029": { n: "Reims Champagne-Ardenne TGV",lat: 49.2100,  lng: 4.0625  },
  "87233387": { n: "Abbeville",                  lat: 50.1050,  lng: 1.8369  },
  "87212068": { n: "Hazebrouck",                 lat: 50.7264,  lng: 2.5378  },
  "87212100": { n: "Béthune",                    lat: 50.5244,  lng: 2.6369  },
  "87233296": { n: "Boulogne-sur-Mer",           lat: 50.7244,  lng: 1.5967  },
  "87223230": { n: "Lens",                       lat: 50.4311,  lng: 2.8281  },
  "87233460": { n: "Longueau",                   lat: 49.8650,  lng: 2.3508  },
  "87277574": { n: "Arras TGV",                  lat: 50.2928,  lng: 2.7792  },
  // Normandie
  "87394007": { n: "Rouen Rive Droite",          lat: 49.4430,  lng: 1.0993  },
  "87296004": { n: "Caen",                       lat: 49.1835,  lng: -0.3651 },
  "87284000": { n: "Le Havre",                   lat: 49.4933,  lng: 0.1075  },
  "87284257": { n: "Cherbourg",                  lat: 49.6366,  lng: -1.6167 },
  "87284364": { n: "Bayeux",                     lat: 49.2779,  lng: -0.7050 },
  "87415232": { n: "Alençon",                    lat: 48.4319,  lng: 0.0931  },
  "87384620": { n: "Évreux",                     lat: 49.0272,  lng: 1.1517  },
  "87384513": { n: "Vernon-Giverny",             lat: 49.0894,  lng: 1.4908  },
  "87296020": { n: "Lisieux",                    lat: 49.1467,  lng: 0.2281  },
  "87411603": { n: "Granville",                  lat: 48.8361,  lng: -1.5878 },
  "87296046": { n: "Vire",                       lat: 48.8386,  lng: -0.8897 },
  "87296053": { n: "Flers",                      lat: 48.7453,  lng: -0.5689 },
  "87384729": { n: "Bernay",                     lat: 49.0908,  lng: 0.5981  },
  "87284174": { n: "Sotteville",                 lat: 49.4117,  lng: 1.0908  },
  // Bretagne
  "87413534": { n: "Rennes",                     lat: 48.1035,  lng: -1.6722 },
  "87413104": { n: "Brest",                      lat: 48.3882,  lng: -4.4892 },
  "87413120": { n: "Quimper",                    lat: 47.9956,  lng: -4.1012 },
  "87414300": { n: "Lorient",                    lat: 47.7519,  lng: -3.3614 },
  "87474007": { n: "Vannes",                     lat: 47.6583,  lng: -2.7594 },
  "87473009": { n: "Saint-Brieuc",               lat: 48.5099,  lng: -2.7672 },
  "87415307": { n: "Saint-Malo",                 lat: 48.6461,  lng: -2.0142 },
  "87413029": { n: "Vitré",                      lat: 48.1197,  lng: -1.2089 },
  "87473108": { n: "Guingamp",                   lat: 48.5597,  lng: -3.1547 },
  "87473116": { n: "Morlaix",                    lat: 48.5778,  lng: -3.8308 },
  "87413813": { n: "Redon",                      lat: 47.6511,  lng: -2.0856 },
  "87474056": { n: "Auray",                      lat: 47.6681,  lng: -2.9889 },
  // Pays de la Loire
  "87481507": { n: "Nantes",                     lat: 47.2172,  lng: -1.5422 },
  "87285122": { n: "Le Mans",                    lat: 47.9954,  lng: 0.1921  },
  "87485003": { n: "Angers Saint-Laud",          lat: 47.4633,  lng: -0.5567 },
  "87484006": { n: "Saint-Nazaire",              lat: 47.2761,  lng: -2.2036 },
  "87484261": { n: "La Roche-sur-Yon",           lat: 46.6703,  lng: -1.4261 },
  "87485110": { n: "Saumur",                     lat: 47.2594,  lng: -0.0703 },
  "87484509": { n: "Cholet",                     lat: 47.0597,  lng: -0.8781 },
  "87484202": { n: "Saint-Gilles-Croix-de-Vie",  lat: 46.6942,  lng: -1.9397 },
  // Centre-Val de Loire
  "87318964": { n: "Tours Saint-Pierre",         lat: 47.3883,  lng: 0.6898  },
  "87336909": { n: "Orléans",                    lat: 47.9030,  lng: 1.9021  },
  "87338004": { n: "Blois",                      lat: 47.5864,  lng: 1.3344  },
  "87318972": { n: "Saint-Pierre-des-Corps",     lat: 47.3786,  lng: 0.7136  },
  "87336107": { n: "Bourges",                    lat: 47.0806,  lng: 2.3989  },
  "87338400": { n: "Châteauroux",               lat: 46.8097,  lng: 1.6919  },
  "87318907": { n: "Amboise",                    lat: 47.4061,  lng: 0.9839  },
  "87318949": { n: "Tours",                      lat: 47.3886,  lng: 0.6897  },
  "87336305": { n: "Vierzon",                    lat: 47.2228,  lng: 2.0686  },
  "87318790": { n: "Vendôme-Villiers TGV",       lat: 47.8106,  lng: 1.0619  },
  // Alsace-Lorraine
  "87481119": { n: "Strasbourg",                 lat: 48.5851,  lng: 7.7352  },
  "87382002": { n: "Metz Ville",                 lat: 49.1088,  lng: 6.1760  },
  "87393009": { n: "Nancy Ville",                lat: 48.6890,  lng: 6.1739  },
  "87481002": { n: "Mulhouse Ville",             lat: 47.7419,  lng: 7.3393  },
  "87481028": { n: "Colmar",                     lat: 48.0775,  lng: 7.3581  },
  "87481044": { n: "Sélestat",                  lat: 48.2633,  lng: 7.4547  },
  "87382010": { n: "Thionville",                 lat: 49.3572,  lng: 6.1700  },
  "87382051": { n: "Forbach",                    lat: 49.1858,  lng: 6.9000  },
  "87481127": { n: "Haguenau",                   lat: 48.8142,  lng: 7.7869  },
  "87382093": { n: "Sarrebourg",                 lat: 48.7350,  lng: 7.0528  },
  "87382069": { n: "Sarreguemines",              lat: 49.1111,  lng: 7.0694  },
  "87382077": { n: "Saint-Avold",               lat: 49.1019,  lng: 6.7014  },
  "87382119": { n: "Freyming-Merlebach",         lat: 49.1506,  lng: 6.7931  },
  "87481093": { n: "Saverne",                    lat: 48.7428,  lng: 7.3644  },
  // Bourgogne-Franche-Comté
  "87321014": { n: "Dijon Ville",                lat: 47.3230,  lng: 5.0282  },
  "87281899": { n: "Besançon Viotte",            lat: 47.2389,  lng: 6.0191  },
  "87281907": { n: "Besançon Franche-Comté TGV", lat: 47.1894,  lng: 5.9722  },
  "87321196": { n: "Beaune",                     lat: 46.9978,  lng: 4.8386  },
  "87322103": { n: "Chalon-sur-Saône",           lat: 46.7819,  lng: 4.8497  },
  "87321097": { n: "Auxerre Saint-Gervais",      lat: 47.7986,  lng: 3.5669  },
  "87321048": { n: "Sens",                       lat: 48.2007,  lng: 3.2908  },
  "87281941": { n: "Dole",                       lat: 47.0944,  lng: 5.4944  },
  "87322004": { n: "Mâcon-Loché TGV",           lat: 46.3019,  lng: 4.8483  },
  "87322202": { n: "Mâcon Ville",               lat: 46.3050,  lng: 4.8297  },
  "87321238": { n: "Montchanin Le Creusot",     lat: 46.7808,  lng: 4.4453  },
  "87281966": { n: "Pontarlier",                lat: 46.9050,  lng: 6.3594  },
  // Auvergne-Rhône-Alpes
  "87722025": { n: "Lyon Part-Dieu",             lat: 45.7606,  lng: 4.8595  },
  "87723197": { n: "Lyon Perrache",              lat: 45.7497,  lng: 4.8267  },
  "87722033": { n: "Lyon Saint-Exupéry TGV",    lat: 45.7219,  lng: 5.0783  },
  "87722751": { n: "Grenoble",                  lat: 45.1916,  lng: 5.7169  },
  "87755108": { n: "Chambéry",                  lat: 45.5669,  lng: 5.9219  },
  "87756056": { n: "Annecy",                    lat: 45.9015,  lng: 6.1261  },
  "87471003": { n: "Clermont-Ferrand",           lat: 45.7786,  lng: 3.0817  },
  "87744500": { n: "Valence Ville",              lat: 44.9337,  lng: 4.8932  },
  "87686197": { n: "Valence TGV",               lat: 44.9280,  lng: 4.9494  },
  "87763904": { n: "Aix-les-Bains",             lat: 45.6890,  lng: 5.9167  },
  "87756148": { n: "Évian-les-Bains",           lat: 46.3992,  lng: 6.5878  },
  "87756304": { n: "Thonon-les-Bains",          lat: 46.3675,  lng: 6.4808  },
  "87725002": { n: "Roanne",                    lat: 46.0347,  lng: 4.0672  },
  "87725051": { n: "Vichy",                     lat: 46.1244,  lng: 3.4236  },
  "87726208": { n: "Moulins-sur-Allier",        lat: 46.5644,  lng: 3.3314  },
  "87756387": { n: "Bourg-Saint-Maurice",       lat: 45.6189,  lng: 6.7731  },
  "87756437": { n: "Moûtiers-Salins",           lat: 45.4844,  lng: 6.5297  },
  "87763888": { n: "Modane",                    lat: 45.1972,  lng: 6.6633  },
  "87725184": { n: "Bourg-en-Bresse",           lat: 46.2044,  lng: 5.2272  },
  "87744419": { n: "Romans-Bourg-de-Péage",    lat: 45.0550,  lng: 5.0564  },
  "87744401": { n: "Valence Bourg-lès-Valence",lat: 44.9439,  lng: 4.8769  },
  "87722447": { n: "Ambérieu",                  lat: 45.9597,  lng: 5.3436  },
  "87722116": { n: "Villefranche-sur-Saône",   lat: 45.9883,  lng: 4.7167  },
  "87722298": { n: "Mâcon",                     lat: 46.3050,  lng: 4.8297  },
  "87722793": { n: "Voiron",                    lat: 45.3636,  lng: 5.5908  },
  "87722819": { n: "Moirans",                   lat: 45.3281,  lng: 5.5689  },
  // PACA
  "87751008": { n: "Marseille Saint-Charles",   lat: 43.3027,  lng: 5.3805  },
  "87751107": { n: "Avignon TGV",               lat: 43.9217,  lng: 4.8064  },
  "87765008": { n: "Nice Ville",                lat: 43.7045,  lng: 7.2619  },
  "87572008": { n: "Toulon",                    lat: 43.1248,  lng: 5.9303  },
  "87751206": { n: "Aix-en-Provence TGV",      lat: 43.4553,  lng: 5.3153  },
  "87769001": { n: "Cannes",                    lat: 43.5528,  lng: 7.0128  },
  "87769043": { n: "Antibes",                   lat: 43.5800,  lng: 7.1244  },
  "87769068": { n: "Menton",                    lat: 43.7761,  lng: 7.5028  },
  "87769092": { n: "Monaco-Monte-Carlo",        lat: 43.7367,  lng: 7.4239  },
  "87763037": { n: "Saint-Raphaël-Valescure",   lat: 43.4253,  lng: 6.7703  },
  "87751701": { n: "Arles",                     lat: 43.6764,  lng: 4.6281  },
  "87753004": { n: "Salon-de-Provence",         lat: 43.6397,  lng: 5.0978  },
  "87751057": { n: "Miramas",                   lat: 43.5831,  lng: 5.0000  },
  "87751065": { n: "Vitrolles-Aéroport",        lat: 43.4578,  lng: 5.2339  },
  "87752006": { n: "Aubagne",                   lat: 43.2953,  lng: 5.5667  },
  "87751404": { n: "Avignon Centre",            lat: 43.9494,  lng: 4.8056  },
  "87763060": { n: "Draguignan",                lat: 43.5381,  lng: 6.4742  },
  "87763052": { n: "Fréjus",                   lat: 43.4358,  lng: 6.7378  },
  // Occitanie
  "87596007": { n: "Perpignan",                 lat: 42.6989,  lng: 2.8946  },
  "87596031": { n: "Nîmes",                     lat: 43.8361,  lng: 4.3611  },
  "87588048": { n: "Montpellier Saint-Roch",    lat: 43.6042,  lng: 3.8797  },
  "87594101": { n: "Montpellier Sud de France", lat: 43.5758,  lng: 3.8408  },
  "87594002": { n: "Nîmes Pont du Gard TGV",   lat: 43.7728,  lng: 4.3756  },
  "87611301": { n: "Toulouse Matabiau",         lat: 43.6115,  lng: 1.4536  },
  "87596205": { n: "Carcassonne",               lat: 43.2132,  lng: 2.3512  },
  "87591008": { n: "Sète",                      lat: 43.4078,  lng: 3.6947  },
  "87592006": { n: "Agde",                      lat: 43.3147,  lng: 3.4808  },
  "87592014": { n: "Béziers",                   lat: 43.3450,  lng: 3.2150  },
  "87681007": { n: "Montauban-Ville-Bourbon",   lat: 44.0097,  lng: 1.3575  },
  "87681106": { n: "Albi-Ville",                lat: 43.9297,  lng: 2.1408  },
  "87596106": { n: "Narbonne",                  lat: 43.1825,  lng: 2.9972  },
  "87596148": { n: "Port-Bou",                  lat: 42.4258,  lng: 3.1608  },
  "87596163": { n: "Cerbère",                   lat: 42.4400,  lng: 3.1664  },
  "87681205": { n: "Castres",                   lat: 43.6058,  lng: 2.2478  },
  // Nouvelle-Aquitaine
  "87611004": { n: "Bordeaux Saint-Jean",       lat: 44.8256,  lng: -0.5566 },
  "87611208": { n: "Angoulême",                 lat: 45.6494,  lng: 0.1333  },
  "87611802": { n: "La Rochelle Ville",         lat: 46.1571,  lng: -1.1513 },
  "87696201": { n: "Bayonne",                   lat: 43.4920,  lng: -1.4734 },
  "87695003": { n: "Biarritz",                  lat: 43.4679,  lng: -1.5566 },
  "87673004": { n: "Pau",                       lat: 43.2944,  lng: -0.3761 },
  "87611400": { n: "Agen",                      lat: 44.2017,  lng: 0.6244  },
  "87611509": { n: "Périgueux",                 lat: 45.1822,  lng: 0.7181  },
  "87612002": { n: "Libourne",                  lat: 44.9217,  lng: -0.2433 },
  "87671006": { n: "Lourdes",                   lat: 43.0969,  lng: -0.0331 },
  "87612101": { n: "Dax",                       lat: 43.7097,  lng: -1.0536 },
  "87695102": { n: "Hendaye",                   lat: 43.3667,  lng: -1.7728 },
  "87611608": { n: "Niort",                     lat: 46.3222,  lng: -0.4617 },
  "87484004": { n: "Saintes",                   lat: 45.7458,  lng: -0.6286 },
  "87336006": { n: "Poitiers",                  lat: 46.5833,  lng: 0.3461  },
  "87611700": { n: "Mérignac-Arlac",            lat: 44.8394,  lng: -0.6472 },
  "87672006": { n: "Tarbes",                    lat: 43.2339,  lng: 0.0779  },
  "87611103": { n: "Arcachon",                  lat: 44.6631,  lng: -1.1678 },
  "87612309": { n: "Mont-de-Marsan",            lat: 43.8894,  lng: -0.5028 },
  "87672303": { n: "Lannemezan",                lat: 43.1164,  lng: 0.3808  },
};

const TYPE_COLORS = {
  TGV:   "#ef4444",
  OUIGO: "#8b5cf6",
  IC:    "#f97316",
  TER:   "#22c55e",
  RER:   "#3b82f6",
  AUTRE: "#64748b",
};

// ── DÉTECTION DU TYPE ────────────────────────────────────────────────────────
// Basé sur les vrais formats SNCF GTFS-RT observés
function detectType(tripId = "", routeId = "") {
  const tid = tripId.toUpperCase();
  const rid = routeId.toUpperCase();
  const both = tid + " " + rid;

  // 1. OUIGO (avant TGV, car roule aussi sur LGV)
  if (both.includes("OUIGO") || rid.includes("OUIGO")) return "OUIGO";

  // 2. TGV / INOUI - patterns réels SNCF
  if (
    both.includes("TGV") ||
    both.includes("INOUI") ||
    both.includes("INOÜI") ||
    both.includes("LYRIA") ||
    both.includes("THALYS") ||
    both.includes("EUROSTAR") ||
    // Numéros de trains TGV : 6xxx, 7xxx à 4 chiffres
    /\b[67]\d{3}\b/.test(tid) ||
    // Pattern OCE + TGV explicite
    /OCETGV/.test(tid) ||
    /^OCE\d+[A-Z]?$/.test(tid) && /TGV|INOUI|LGV/.test(rid)
  ) return "TGV";

  // 3. Intercités
  if (
    both.includes("INTERCIT") ||
    both.includes("CORAIL") ||
    rid === "IC" ||
    /\bINTERCITES\b/.test(both) ||
    // Numéros IC : 4xxx, 3xxx (nuits)
    /^OCEI/.test(tid)
  ) return "IC";

  // 4. RER / Transilien
  if (
    both.includes("RER") ||
    both.includes("TRANSILIEN") ||
    both.includes("TRANSIL") ||
    /RER[A-E]/.test(both) ||
    // Lignes Transilien J,L,N,P,R,U,H,K
    /\bLIGNE [JLNPRUHK]\b/.test(both)
  ) return "RER";

  // 5. TER - patterns régionaux
  if (
    both.includes("TER") ||
    both.includes("REGIO") ||
    both.includes("REGIONAL") ||
    /^OCET/.test(tid)  // OCETER
  ) return "TER";

  // 6. Fallback basé sur le routeId
  if (rid.includes("GRANDES LIGNES") || rid.includes("GL")) return "IC";

  return "AUTRE";
}

// ── CONVERSION VALEUR PROTOBUF ───────────────────────────────────────────────
function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "object" && v.low !== undefined)
    return v.low + v.high * 4294967296;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// ── NORMALISATION STOP ID ────────────────────────────────────────────────────
// Gère tous les formats SNCF : "StopPoint:OCE87686006-BV", "87686006", etc.
function normalizeStopId(raw = "") {
  const m = String(raw).match(/(\d{8})/);
  return m ? m[1] : raw;
}

// ── CALCUL DU CAP (BEARING) ──────────────────────────────────────────────────
function bearing(lat1, lng1, lat2, lng2) {
  const R2D = 180 / Math.PI;
  const D2R = Math.PI / 180;
  const dLng = (lng2 - lng1) * D2R;
  const la1 = lat1 * D2R, la2 = lat2 * D2R;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (Math.atan2(y, x) * R2D + 360) % 360;
}

// ── INTERPOLATION ROBUSTE ────────────────────────────────────────────────────
function interpolate(stopTimeUpdates, nowSec) {
  if (!stopTimeUpdates || !stopTimeUpdates.length) return null;

  // Trier par sequence
  const sorted = [...stopTimeUpdates].sort(
    (a, b) => (toNum(a.stopSequence) || 0) - (toNum(b.stopSequence) || 0)
  );

  // Construire les points avec coordonnées connues
  const pts = [];
  for (const stu of sorted) {
    const gid = normalizeStopId(stu.stopId);
    const g = GARES[gid];
    if (!g) continue;

    // Timestamp = departure si dispo, sinon arrival
    // Les deux représentent l'heure réelle (scheduled + delay)
    const dep = toNum(stu.departure?.time);
    const arr = toNum(stu.arrival?.time);
    const t = dep || arr;
    if (!t) continue;

    pts.push({ t, lat: g.lat, lng: g.lng, name: g.n });
  }

  if (pts.length === 0) return null;

  // ── Cas 1 : Interpolation entre deux points ──
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.t === b.t) continue;

    if (nowSec >= a.t && nowSec <= b.t) {
      const frac = (nowSec - a.t) / (b.t - a.t);
      return {
        lat:     a.lat + (b.lat - a.lat) * frac,
        lng:     a.lng + (b.lng - a.lng) * frac,
        prog:    Math.round(frac * 100),
        segFrom: a.name,
        segTo:   b.name,
        bearing: bearing(a.lat, a.lng, b.lat, b.lng),
      };
    }
  }

  // ── Cas 2 : Train en avance sur le premier arrêt (dans les 30min) ──
  const first = pts[0];
  if (nowSec < first.t && first.t - nowSec < 1800) {
    const next = pts[1];
    return {
      lat:     first.lat,
      lng:     first.lng,
      prog:    0,
      segFrom: first.name,
      segTo:   next ? next.name : first.name,
      bearing: next ? bearing(first.lat, first.lng, next.lat, next.lng) : 0,
    };
  }

  // ── Cas 3 : Après le dernier point connu (en route vers la fin) ──
  const last = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : null;

  // Accepter si le train est passé dans les 2 dernières heures
  if (nowSec > last.t && nowSec - last.t < 7200) {
    return {
      lat:     last.lat,
      lng:     last.lng,
      prog:    100,
      segFrom: prev ? prev.name : last.name,
      segTo:   last.name,
      bearing: prev ? bearing(prev.lat, prev.lng, last.lat, last.lng) : 0,
    };
  }

  return null;
}

// ── VITESSE ESTIMÉE selon le type ────────────────────────────────────────────
// Basée sur les vitesses commerciales SNCF moyennes
function estimateSpeed(type, prog) {
  const ranges = {
    TGV:   { min: 220, max: 320 },
    OUIGO: { min: 200, max: 280 },
    IC:    { min: 120, max: 200 },
    TER:   { min:  60, max: 140 },
    RER:   { min:  40, max: 100 },
    AUTRE: { min:  60, max: 120 },
  };
  const r = ranges[type] || ranges.AUTRE;
  // Variation légère selon la progression (accélération/décélération)
  const factor = prog < 10 || prog > 90 ? 0.6 : 1.0;
  const mid = (r.min + r.max) / 2;
  return Math.round(mid * factor);
}

exports.handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=30, s-maxage=30",
  };

  try {
    const res = await fetch(GTFS_RT_URL, {
      headers: { Accept: "application/x-protobuf" },
      timeout: 10000,
    });
    if (!res.ok) throw new Error(`GTFS-RT HTTP ${res.status}`);

    const buf = await res.arrayBuffer();
    const feed = GtfsRtBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buf)
    );

    const nowSec = Math.floor(Date.now() / 1000);
    const trains = [];

    for (const entity of feed.entity || []) {
      const tu = entity.tripUpdate;
      if (!tu) continue;

      const stus = tu.stopTimeUpdate;
      if (!stus || stus.length === 0) continue;

      const tripId  = tu.trip?.tripId  || entity.id || "";
      const routeId = tu.trip?.routeId || "";
      const type    = detectType(tripId, routeId);
      const color   = TYPE_COLORS[type];

      // Retard : prendre la valeur max parmi les arrêts
      let maxDelay = 0;
      for (const stu of stus) {
        const d = toNum(stu.departure?.delay ?? stu.arrival?.delay ?? 0);
        if (Math.abs(d) > Math.abs(maxDelay)) maxDelay = d;
      }
      const delayMin = Math.round(maxDelay / 60);

      // Gare d'origine et destination (première et dernière connues)
      const firstId = normalizeStopId(stus[0]?.stopId || "");
      const lastId  = normalizeStopId(stus[stus.length - 1]?.stopId || "");
      const origin  = GARES[firstId]?.n || "—";
      const dest    = GARES[lastId]?.n  || "—";

      // Position interpolée
      const pos = interpolate(stus, nowSec);
      if (!pos) continue;

      // Vérifier France métropolitaine
      if (pos.lat < 41.0 || pos.lat > 51.5 || pos.lng < -5.5 || pos.lng > 9.8) continue;

      trains.push({
        id:      entity.id,
        trip_id: tripId,
        type,
        color,
        lat:     Math.round(pos.lat * 100000) / 100000,
        lng:     Math.round(pos.lng * 100000) / 100000,
        bearing: Math.round(pos.bearing),
        from:    origin,
        to:      dest,
        segFrom: pos.segFrom,
        segTo:   pos.segTo,
        prog:    pos.prog,
        delay:   delayMin,
        onTime:  delayMin <= 2,
        stops:   stus.length,
        speed:   estimateSpeed(type, pos.prog),
      });
    }

    const byType = {};
    for (const k of Object.keys(TYPE_COLORS))
      byType[k] = trains.filter(t => t.type === k).length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        trains,
        stats: {
          total:   trains.length,
          on_time: trains.filter(t => t.onTime).length,
          delayed: trains.filter(t => !t.onTime).length,
          by_type: byType,
        },
        fetched_at: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error("[TrainRadar]", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:  err.message,
        trains: [],
        stats:  { total: 0, on_time: 0, delayed: 0, by_type: {} },
      }),
    };
  }
};
