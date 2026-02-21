// app.js — TrainRadar France v4
// github.com/theomalou71-cpu
// Rails complets + traits orientés + logique robuste

const REFRESH_SEC = 120;

const TYPE_COLORS = {
  TGV:   "#ef4444",
  OUIGO: "#8b5cf6",
  IC:    "#f97316",
  TER:   "#22c55e",
  RER:   "#3b82f6",
  AUTRE: "#64748b",
};

// ── RÉSEAU FERROVIAIRE COMPLET (France métropolitaine) ───────────────────────
// Lignes principales : LGV + grandes lignes + lignes régionales majeures
// Format : tableau de segments [lat, lng]
const RAILS = [
  // ── LGV Nord (Paris–Lille–frontière) ─────────────────────────────────────
  [[48.881,2.355],[49.190,2.461],[49.410,2.812],[49.722,2.903],[50.012,2.864],[50.287,2.782],[50.451,2.854],[50.637,3.071]],
  // ── LGV Est (Paris–Strasbourg) ───────────────────────────────────────────
  [[48.877,2.359],[48.880,3.200],[49.050,3.700],[49.100,4.050],[49.257,4.025],[49.200,4.800],[49.109,6.176],[48.689,6.174],[48.600,6.900],[48.540,7.200],[48.585,7.735]],
  // ── LGV Sud-Est (Paris–Lyon) + LN1 ─────────────────────────────────────
  [[48.844,2.374],[48.728,2.272],[48.400,2.310],[47.900,3.150],[47.500,3.980],[47.323,5.028],[46.800,4.920],[46.302,4.848],[45.760,4.859]],
  // ── LGV Rhône-Alpes + LGV Méditerranée ───────────────────────────────────
  [[45.760,4.859],[45.280,4.870],[44.928,4.949],[44.400,4.750],[43.921,4.806],[43.600,4.650],[43.302,5.380]],
  // ── LGV Atlantique (Paris–Le Mans–Tours) ─────────────────────────────────
  [[48.841,2.320],[48.600,2.100],[48.200,1.700],[47.995,0.192],[47.388,0.690]],
  // ── Ligne classique Paris–Bordeaux ───────────────────────────────────────
  [[47.388,0.690],[46.900,0.500],[46.583,0.346],[45.900,0.250],[45.649,0.133],[45.100,-0.100],[44.826,-0.557]],
  // ── LGV SEA Bordeaux (Tours–Bordeaux) ────────────────────────────────────
  [[47.810,1.062],[47.388,0.690],[46.583,0.346],[45.649,0.133],[44.826,-0.557]],
  // ── Ligne Paris–Nantes ───────────────────────────────────────────────────
  [[48.841,2.320],[48.200,2.000],[47.900,1.500],[47.463,-0.557],[47.217,-1.542]],
  // ── Ligne Paris–Rennes–Brest ─────────────────────────────────────────────
  [[48.841,2.320],[48.200,1.500],[47.995,0.192],[48.100,-1.100],[48.104,-1.672],[48.370,-2.000],[48.510,-2.760],[48.388,-4.489]],
  // ── Rennes–Quimper ────────────────────────────────────────────────────────
  [[48.104,-1.672],[47.750,-2.760],[47.646,-2.759],[47.996,-4.101]],
  // ── Rennes–Saint-Malo ────────────────────────────────────────────────────
  [[48.104,-1.672],[48.300,-1.800],[48.646,-2.014]],
  // ── Nantes–La Rochelle–Bordeaux ──────────────────────────────────────────
  [[47.217,-1.542],[46.900,-1.500],[46.320,-1.500],[46.157,-1.151],[45.800,-0.900],[45.747,-0.629],[44.826,-0.557]],
  // ── Bordeaux–Bayonne–Hendaye ─────────────────────────────────────────────
  [[44.826,-0.557],[44.300,-1.000],[43.890,-1.395],[43.710,-1.054],[43.492,-1.473],[43.367,-1.773]],
  // ── Bordeaux–Pau–Tarbes–Lourdes ──────────────────────────────────────────
  [[44.826,-0.557],[44.200,0.624],[43.889,-0.503],[43.294,-0.376],[43.234,0.078],[43.097,-0.033]],
  // ── Toulouse–Bordeaux ────────────────────────────────────────────────────
  [[43.612,1.454],[44.010,1.358],[44.200,0.624],[44.826,-0.557]],
  // ── Toulouse–Carcassonne–Perpignan ───────────────────────────────────────
  [[43.612,1.454],[43.213,2.351],[43.182,2.997],[42.699,2.895]],
  // ── Montpellier–Perpignan ────────────────────────────────────────────────
  [[43.604,3.880],[43.500,3.600],[43.345,3.215],[43.182,2.997],[42.699,2.895]],
  // ── Marseille–Avignon–Lyon ───────────────────────────────────────────────
  [[43.302,5.380],[43.583,5.000],[43.836,4.361],[43.921,4.806],[44.200,4.800],[44.928,4.949],[45.280,4.870],[45.760,4.859]],
  // ── Marseille–Toulon–Nice–Monaco ─────────────────────────────────────────
  [[43.302,5.380],[43.200,5.700],[43.125,5.930],[43.300,6.300],[43.424,6.700],[43.425,6.771],[43.552,7.012],[43.705,7.262],[43.737,7.424]],
  // ── Avignon–Nîmes–Montpellier ────────────────────────────────────────────
  [[43.921,4.806],[43.836,4.361],[43.604,3.880]],
  // ── Lyon–Grenoble ────────────────────────────────────────────────────────
  [[45.760,4.859],[45.560,5.280],[45.330,5.440],[45.192,5.717]],
  // ── Lyon–Chambéry–Modane ─────────────────────────────────────────────────
  [[45.760,4.859],[45.760,5.200],[45.689,5.917],[45.567,5.922],[45.400,6.300],[45.197,6.663]],
  // ── Chambéry–Annecy ──────────────────────────────────────────────────────
  [[45.567,5.922],[45.700,6.000],[45.901,6.126]],
  // ── Lyon–Annecy (via Ambérieu) ───────────────────────────────────────────
  [[45.760,4.859],[45.960,5.340],[45.901,6.126]],
  // ── Lyon–Clermont-Ferrand ────────────────────────────────────────────────
  [[45.760,4.859],[45.600,3.800],[45.779,3.082]],
  // ── Paris–Vichy–Clermont-Ferrand ─────────────────────────────────────────
  [[48.841,2.320],[48.200,2.500],[47.600,3.000],[46.564,3.331],[46.124,3.424],[45.779,3.082]],
  // ── Paris–Le Havre (via Rouen) ───────────────────────────────────────────
  [[48.881,2.355],[49.100,1.600],[49.443,1.099],[49.493,0.108]],
  // ── Paris–Caen–Cherbourg ─────────────────────────────────────────────────
  [[48.841,2.320],[48.900,0.600],[49.184,-0.365],[49.300,-1.000],[49.637,-1.617]],
  // ── Paris–Amiens–Calais ───────────────────────────────────────────────────
  [[48.881,2.355],[49.250,2.300],[49.890,2.305],[50.130,1.850],[50.951,1.858]],
  // ── Lille–Valenciennes ────────────────────────────────────────────────────
  [[50.637,3.071],[50.357,3.529]],
  // ── Lille–Dunkerque ──────────────────────────────────────────────────────
  [[50.637,3.071],[50.800,2.700],[51.035,2.376]],
  // ── Dijon–Besançon–Mulhouse–Strasbourg ────────────────────────────────────
  [[47.323,5.028],[47.239,6.019],[47.300,6.700],[47.742,7.339],[48.077,7.358],[48.263,7.455],[48.585,7.735]],
  // ── Metz–Nancy–Dijon ─────────────────────────────────────────────────────
  [[49.109,6.176],[48.689,6.174],[48.300,5.700],[47.900,5.300],[47.323,5.028]],
  // ── Strasbourg–Mulhouse ───────────────────────────────────────────────────
  [[48.585,7.735],[48.263,7.455],[48.077,7.358],[47.742,7.339]],
  // ── Paris–Metz–Thionville ─────────────────────────────────────────────────
  [[48.877,2.359],[49.109,6.176],[49.358,6.170]],
  // ── Reims–Épernay–Châlons ────────────────────────────────────────────────
  [[49.257,4.025],[49.050,3.960],[48.960,4.360]],
  // ── Nantes–Angers–Tours ──────────────────────────────────────────────────
  [[47.217,-1.542],[47.463,-0.557],[47.260,-0.100],[47.388,0.690]],
  // ── Tours–Orléans–Paris ──────────────────────────────────────────────────
  [[47.388,0.690],[47.590,1.320],[47.903,1.902],[48.400,1.900],[48.841,2.320]],
  // ── Bordeaux–Angoulême–Poitiers–Tours ─────────────────────────────────────
  [[44.826,-0.557],[45.100,0.060],[45.649,0.133],[46.583,0.346],[47.388,0.690]],
  // ── Niort–Poitiers ────────────────────────────────────────────────────────
  [[46.322,-0.462],[46.583,0.346]],
  // ── La Rochelle–Saintes ───────────────────────────────────────────────────
  [[46.157,-1.151],[45.746,-0.629]],
  // ── Saintes–Bordeaux ──────────────────────────────────────────────────────
  [[45.746,-0.629],[45.200,-0.580],[44.826,-0.557]],
  // ── Angers–Nantes ────────────────────────────────────────────────────────
  [[47.463,-0.557],[47.217,-1.542]],
  // ── Le Mans–Nantes ────────────────────────────────────────────────────────
  [[47.995,0.192],[47.600,-0.200],[47.463,-0.557],[47.217,-1.542]],
  // ── Valence–Grenoble ─────────────────────────────────────────────────────
  [[44.934,4.893],[45.100,5.300],[45.192,5.717]],
  // ── Grenoble–Chambéry ────────────────────────────────────────────────────
  [[45.192,5.717],[45.350,5.850],[45.567,5.922]],
  // ── Clermont-Fd–Lyon ─────────────────────────────────────────────────────
  [[45.779,3.082],[45.600,3.800],[45.760,4.859]],
  // ── Perpignan–Port-Bou ────────────────────────────────────────────────────
  [[42.699,2.895],[42.440,3.166]],
  // ── Nîmes–Montpellier ────────────────────────────────────────────────────
  [[43.836,4.361],[43.604,3.880]],
  // ── Montpellier–Sète–Agde–Béziers–Narbonne–Perpignan ───────────────────
  [[43.604,3.880],[43.408,3.695],[43.315,3.481],[43.345,3.215],[43.183,3.000],[42.699,2.895]],
  // ── Narbonne–Toulouse ────────────────────────────────────────────────────
  [[43.183,3.000],[43.213,2.351],[43.612,1.454]],
  // ── Toulouse–Albi ─────────────────────────────────────────────────────────
  [[43.612,1.454],[43.700,1.900],[43.930,2.141]],
  // ── Toulouse–Montauban ────────────────────────────────────────────────────
  [[43.612,1.454],[44.010,1.358]],
  // ── Paris–Melun–Montereau–Sens ────────────────────────────────────────────
  [[48.844,2.374],[48.537,2.666],[48.377,2.795],[48.201,3.291]],
  // ── Brest–Quimper ─────────────────────────────────────────────────────────
  [[48.389,-4.489],[48.200,-4.200],[47.996,-4.101]],
  // ── Lorient–Vannes–Nantes ─────────────────────────────────────────────────
  [[47.752,-3.361],[47.658,-2.759],[47.413,-2.200],[47.217,-1.542]],
  // ── Saint-Brieuc–Rennes ───────────────────────────────────────────────────
  [[48.510,-2.760],[48.200,-2.100],[48.104,-1.672]],
  // ── Saint-Nazaire–Nantes ──────────────────────────────────────────────────
  [[47.276,-2.204],[47.217,-1.542]],
  // ── Rouen–Amiens ──────────────────────────────────────────────────────────
  [[49.443,1.099],[49.700,1.700],[49.890,2.305]],
  // ── Caen–Rennes ───────────────────────────────────────────────────────────
  [[49.184,-0.365],[48.500,-1.200],[48.104,-1.672]],
  // ── Cherbourg–Caen ────────────────────────────────────────────────────────
  [[49.637,-1.617],[49.300,-1.000],[49.184,-0.365]],
  // ── Paris–Strasbourg voie classique ─────────────────────────────────────
  [[48.877,2.359],[48.900,3.500],[49.200,4.000],[49.109,6.176],[48.585,7.735]],
  // ── Dole–Besançon ────────────────────────────────────────────────────────
  [[47.094,5.494],[47.239,6.019]],
  // ── Dijon–Dole ───────────────────────────────────────────────────────────
  [[47.323,5.028],[47.094,5.494]],
  // ── Évian–Thonon–Annecy ──────────────────────────────────────────────────
  [[46.399,6.588],[46.368,6.481],[45.901,6.126]],
  // ── Marseille–Vitrolles ───────────────────────────────────────────────────
  [[43.302,5.380],[43.458,5.234]],
  // ── Avignon TGV–Avignon Centre ───────────────────────────────────────────
  [[43.922,4.806],[43.949,4.806]],
  // ── Béziers–Clermont-l'Hérault ────────────────────────────────────────────
  [[43.345,3.215],[43.430,3.440],[43.604,3.380]],
  // ── Lignes secondaires régionales ─────────────────────────────────────────
  [[44.826,-0.557],[44.750,-0.900],[44.663,-1.168]], // Bordeaux–Arcachon
  [[44.826,-0.557],[45.000,-0.200],[45.182,0.718]],  // Bordeaux–Périgueux
  [[43.612,1.454],[43.930,2.141],[44.350,2.575]],    // Toulouse–Albi
  [[45.760,4.859],[45.990,5.000],[46.204,5.227]],    // Lyon–Bourg-en-Bresse
  [[45.779,3.082],[45.540,3.247],[45.294,3.378]],    // Clermont–Issoire
  [[43.705,7.262],[43.850,7.350],[44.100,7.570]],    // Nice–Tende (ligne des Alpes)
  [[43.710,-1.054],[43.889,-0.503]],                 // Dax–Mont-de-Marsan
  [[45.901,6.126],[46.100,6.170],[46.210,6.142]],    // Annecy–Genève
  [[48.585,7.735],[47.950,7.600],[47.562,7.576]],    // Strasbourg–Bâle
  [[47.742,7.339],[47.562,7.576]],                   // Mulhouse–Bâle
  [[43.294,-0.376],[43.007,-0.623]],                 // Pau–Bedous
  [[43.367,-1.773],[43.387,-1.659],[43.492,-1.473]], // Hendaye–Bayonne côtière
  [[43.302,5.380],[43.700,5.600],[44.897,6.633]],    // Marseille–Briançon
  [[45.192,5.717],[44.897,6.633]],                   // Grenoble–Briançon
  [[49.184,-0.365],[48.836,-1.588]],                 // Caen–Granville
  [[49.443,1.099],[49.924,1.079]],                   // Rouen–Dieppe
  [[49.890,2.305],[49.565,3.624]],                   // Amiens–Laon
  [[49.257,4.025],[49.565,3.624],[49.850,3.290]],    // Reims–Saint-Quentin
  [[43.345,3.215],[44.100,3.080]],                   // Béziers–Millau
  [[45.760,4.859],[45.050,4.380]],                   // Lyon–Saint-Étienne
  [[47.239,6.019],[46.905,6.359]],                   // Besançon–Pontarlier
  [[46.905,6.359],[46.520,6.634]],                   // Pontarlier–Lausanne
  [[43.612,1.454],[43.200,0.900],[43.097,-0.033]],   // Toulouse–Lourdes directe
  [[46.204,5.227],[46.900,5.600]],                   // Bourg-en-Bresse–Lons-le-Saunier
];

// ── MAP ──────────────────────────────────────────────────────────────────────
const map = L.map("map", {
  zoomControl: false,
  center: [46.8, 2.35],
  zoom: 6,
  preferCanvas: true,
});

const tileDark = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  { attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: "abcd", maxZoom: 20 }
);
const tileLight = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM contributors</a>', maxZoom: 19 }
);
tileDark.addTo(map);
let tileMode = "dark";

function swapTile() {
  if (tileMode === "dark") { map.removeLayer(tileDark); tileLight.addTo(map); tileMode = "light"; }
  else                     { map.removeLayer(tileLight); tileDark.addTo(map); tileMode = "dark"; }
}
function goFrance() { map.flyTo([46.8, 2.35], 6, { duration: 1.2 }); }

// ── RAILS ────────────────────────────────────────────────────────────────────
const railGroup = L.layerGroup();
let railsVisible = true;

function buildRails() {
  railGroup.clearLayers();
  for (const pts of RAILS) {
    if (pts.length < 2) continue;
    L.polyline(pts, {
      color: "#2a3f5f",
      weight: 1.8,
      opacity: 0.8,
    }).addTo(railGroup);
    // Hachures (effet "traverses")
    L.polyline(pts, {
      color: "#1a2d47",
      weight: 3.5,
      opacity: 0.3,
      dashArray: "1 8",
    }).addTo(railGroup);
  }
  railGroup.addTo(map);
}
buildRails();

// ── GARES PRINCIPALES sur la carte ───────────────────────────────────────────
const GARES_MAP = [
  // Paris
  { n: "Paris Gare de Lyon",     lat: 48.8448, lng: 2.3736,  type: "tgv" },
  { n: "Paris Nord",             lat: 48.8809, lng: 2.3553,  type: "tgv" },
  { n: "Paris Montparnasse",     lat: 48.8409, lng: 2.3199,  type: "tgv" },
  { n: "Paris Est",              lat: 48.8765, lng: 2.3590,  type: "tgv" },
  { n: "Paris Saint-Lazare",     lat: 48.8760, lng: 2.3244,  type: "tgv" },
  // Grandes villes
  { n: "Lille Flandres",         lat: 50.6367, lng: 3.0706,  type: "tgv" },
  { n: "Lyon Part-Dieu",         lat: 45.7606, lng: 4.8595,  type: "tgv" },
  { n: "Marseille St-Charles",   lat: 43.3027, lng: 5.3805,  type: "tgv" },
  { n: "Bordeaux St-Jean",       lat: 44.8256, lng: -0.5566, type: "tgv" },
  { n: "Toulouse Matabiau",      lat: 43.6115, lng: 1.4536,  type: "tgv" },
  { n: "Nantes",                 lat: 47.2172, lng: -1.5422, type: "tgv" },
  { n: "Strasbourg",             lat: 48.5851, lng: 7.7352,  type: "tgv" },
  { n: "Nice Ville",             lat: 43.7045, lng: 7.2619,  type: "tgv" },
  { n: "Rennes",                 lat: 48.1035, lng: -1.6722, type: "tgv" },
  { n: "Grenoble",               lat: 45.1916, lng: 5.7169,  type: "tgv" },
  { n: "Montpellier",            lat: 43.6042, lng: 3.8797,  type: "tgv" },
  { n: "Dijon",                  lat: 47.3230, lng: 5.0282,  type: "tgv" },
  { n: "Metz",                   lat: 49.1088, lng: 6.1760,  type: "tgv" },
  { n: "Nancy",                  lat: 48.6890, lng: 6.1739,  type: "tgv" },
  { n: "Reims",                  lat: 49.2569, lng: 4.0248,  type: "tgv" },
  { n: "Toulon",                 lat: 43.1248, lng: 5.9303,  type: "tgv" },
  { n: "Le Mans",                lat: 47.9954, lng: 0.1921,  type: "tgv" },
  { n: "Clermont-Ferrand",       lat: 45.7786, lng: 3.0817,  type: "med" },
  { n: "Brest",                  lat: 48.3882, lng: -4.4892, type: "med" },
  { n: "Perpignan",              lat: 42.6989, lng: 2.8946,  type: "med" },
  { n: "Amiens",                 lat: 49.8903, lng: 2.3047,  type: "med" },
  { n: "Caen",                   lat: 49.1835, lng: -0.3651, type: "med" },
  { n: "Rouen",                  lat: 49.4430, lng: 1.0993,  type: "med" },
  { n: "Le Havre",               lat: 49.4933, lng: 0.1075,  type: "med" },
  { n: "Chambéry",               lat: 45.5669, lng: 5.9219,  type: "med" },
  { n: "Annecy",                 lat: 45.9015, lng: 6.1261,  type: "med" },
  { n: "Mulhouse",               lat: 47.7419, lng: 7.3393,  type: "med" },
  { n: "Besançon",               lat: 47.2389, lng: 6.0191,  type: "med" },
  { n: "Bayonne",                lat: 43.4920, lng: -1.4734, type: "med" },
  { n: "Pau",                    lat: 43.2944, lng: -0.3761, type: "med" },
  { n: "Lorient",                lat: 47.7519, lng: -3.3614, type: "sml" },
  { n: "Vannes",                 lat: 47.6583, lng: -2.7594, type: "sml" },
  { n: "Saint-Brieuc",           lat: 48.5099, lng: -2.7672, type: "sml" },
  { n: "Angoulême",              lat: 45.6494, lng: 0.1333,  type: "sml" },
  { n: "Poitiers",               lat: 46.5833, lng: 0.3461,  type: "sml" },
  { n: "Tours",                  lat: 47.3883, lng: 0.6898,  type: "sml" },
  { n: "Orléans",                lat: 47.9030, lng: 1.9021,  type: "sml" },
  { n: "Avignon TGV",            lat: 43.9217, lng: 4.8064,  type: "sml" },
  { n: "Nîmes",                  lat: 43.8361, lng: 4.3611,  type: "sml" },
  { n: "Valence TGV",            lat: 44.9280, lng: 4.9494,  type: "sml" },
  { n: "Cannes",                 lat: 43.5528, lng: 7.0128,  type: "sml" },
  { n: "Tarbes",                 lat: 43.2339, lng: 0.0779,  type: "sml" },
  { n: "Lourdes",                lat: 43.0969, lng: -0.0331, type: "sml" },
  { n: "Arras",                  lat: 50.2870, lng: 2.7817,  type: "sml" },
  { n: "Valenciennes",           lat: 50.3572, lng: 3.5286,  type: "sml" },
  // LGV TGV stations
  { n: "Massy TGV",             lat: 48.7250, lng: 2.2728,  type: "lgv" },
  { n: "CDG TGV",               lat: 49.0030, lng: 2.5720,  type: "lgv" },
  { n: "Aix-en-Prov. TGV",     lat: 43.4553, lng: 5.3153,  type: "lgv" },
  { n: "Lyon St-Exupéry TGV",  lat: 45.7219, lng: 5.0783,  type: "lgv" },
  { n: "Montpellier SDF TGV",  lat: 43.5758, lng: 3.8408,  type: "lgv" },
  { n: "Vendôme TGV",          lat: 47.8106, lng: 1.0619,  type: "lgv" },
  { n: "Reims Champ. TGV",     lat: 49.2100, lng: 4.0625,  type: "lgv" },
  { n: "Besançon FCC TGV",     lat: 47.1894, lng: 5.9722,  type: "lgv" },
  { n: "Valence TGV",          lat: 44.9280, lng: 4.9494,  type: "lgv" },
  { n: "Nîmes PdG TGV",        lat: 43.7728, lng: 4.3756,  type: "lgv" },
];

const stationGroup = L.layerGroup().addTo(map);

// Lookup rapide par nom de gare
const GARES_BY_NAME = {};
for (const g of GARES_MAP) GARES_BY_NAME[g.n.toLowerCase()] = g;

function findGare(name) {
  if (!name || name === "—") return null;
  const key = name.toLowerCase();
  // Correspondance exacte
  if (GARES_BY_NAME[key]) return GARES_BY_NAME[key];
  // Correspondance partielle
  for (const [k, g] of Object.entries(GARES_BY_NAME)) {
    if (k.includes(key) || key.includes(k)) return g;
  }
  return null;
}

function buildStations() {
  stationGroup.clearLayers();
  for (const g of GARES_MAP) {
    const sizes  = { tgv: 8, med: 6, sml: 5, lgv: 7 };
    const colors = { tgv: "#f1f5f9", med: "#94a3b8", sml: "#475569", lgv: "#fbbf24" };
    const r   = sizes[g.type]  || 5;
    const col = colors[g.type] || "#64748b";

    // Cercle extérieur (halo)
    L.circleMarker([g.lat, g.lng], {
      radius: r + 3,
      fillColor: col,
      fillOpacity: 0.08,
      color: col,
      weight: 0,
    }).addTo(stationGroup);

    // Point central de la gare
    const circle = L.circleMarker([g.lat, g.lng], {
      radius: r,
      fillColor: col,
      fillOpacity: 1,
      color: "#080c18",
      weight: 1.5,
    });

    circle.bindTooltip(`<b>${g.name || g.n}</b>`, {
      permanent: false,
      direction: "top",
      offset: [0, -r - 2],
      className: "station-tooltip",
    });
    circle.addTo(stationGroup);
  }
}
buildStations();

// ── TRAIT DE ROUTE (départ→arrivée) ─────────────────────────────────────────
let routeLayer  = null;   // La ligne jaune
let routeMarkers = [];    // Les marqueurs de gare mis en surbrillance

function clearRoute() {
  if (routeLayer)  { map.removeLayer(routeLayer); routeLayer = null; }
  for (const m of routeMarkers) map.removeLayer(m);
  routeMarkers = [];
}

function drawRoute(t) {
  clearRoute();

  const gFrom = findGare(t.from);
  const gTo   = findGare(t.to);
  if (!gFrom || !gTo) return;

  // Trait jaune animé départ → arrivée
  routeLayer = L.polyline([[gFrom.lat, gFrom.lng], [gTo.lat, gTo.lng]], {
    color: "#facc15",
    weight: 2.5,
    opacity: 0.85,
    dashArray: "8 6",
    className: "route-line",
  }).addTo(map);

  // Marqueur gare de départ (cercle vert pulsant)
  const mkFrom = L.circleMarker([gFrom.lat, gFrom.lng], {
    radius: 10,
    fillColor: "#22c55e",
    fillOpacity: 0.25,
    color: "#22c55e",
    weight: 2.5,
    className: "route-station-pulse",
  }).addTo(map);
  const mkFromInner = L.circleMarker([gFrom.lat, gFrom.lng], {
    radius: 5,
    fillColor: "#22c55e",
    fillOpacity: 1,
    color: "#080c18",
    weight: 1.5,
  }).bindTooltip(`🟢 Départ : ${t.from}`, { direction: "top", className: "station-tooltip" }).addTo(map);

  // Marqueur gare d'arrivée (cercle rouge)
  const mkTo = L.circleMarker([gTo.lat, gTo.lng], {
    radius: 10,
    fillColor: "#ef4444",
    fillOpacity: 0.25,
    color: "#ef4444",
    weight: 2.5,
  }).addTo(map);
  const mkToInner = L.circleMarker([gTo.lat, gTo.lng], {
    radius: 5,
    fillColor: "#ef4444",
    fillOpacity: 1,
    color: "#080c18",
    weight: 1.5,
  }).bindTooltip(`🔴 Arrivée : ${t.to}`, { direction: "top", className: "station-tooltip" }).addTo(map);

  // Marqueur position actuelle du train (losange jaune)
  const mkTrain = L.circleMarker([t.lat, t.lng], {
    radius: 7,
    fillColor: "#facc15",
    fillOpacity: 1,
    color: "#080c18",
    weight: 2,
  }).addTo(map);

  routeMarkers = [mkFrom, mkFromInner, mkTo, mkToInner, mkTrain];
}

function toggleRails() {
  railsVisible = !railsVisible;
  const btn = document.getElementById("railBtn");
  if (railsVisible) {
    railGroup.addTo(map);
    btn.classList.add("active");
  } else {
    map.removeLayer(railGroup);
    btn.classList.remove("active");
  }
}
document.getElementById("railBtn").classList.add("active");

// ── STATE ────────────────────────────────────────────────────────────────────
let allTrains    = [];
let markers      = {};
let selId        = null;
let activeTypes  = new Set(Object.keys(TYPE_COLORS));
let activeStatus = new Set(["ok", "late"]);
let cdTimer      = null;
let cdVal        = REFRESH_SEC;

// ── FETCH ────────────────────────────────────────────────────────────────────
async function doFetch() {
  setStatus("wait", "Actualisation…");
  document.getElementById("btnRefresh").classList.add("spin");
  try {
    const res  = await fetch("/.netlify/functions/trains");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    allTrains = data.trains || [];
    updateStats(data.stats || {});
    applyFilters();
    setStatus("ok", `${allTrains.length} trains en direct`);
    setLastUpdate();
    resetCountdown();
  } catch (err) {
    console.error("[TrainRadar]", err);
    setStatus("err", "Erreur : " + String(err.message).slice(0, 40));
  } finally {
    document.getElementById("btnRefresh").classList.remove("spin");
  }
}

async function doFetchAlerts() {
  try {
    const res  = await fetch("/.netlify/functions/alerts");
    if (!res.ok) return;
    const data = await res.json();
    if (data.alerts?.length) {
      const el = document.getElementById("ascroll");
      el.textContent = data.alerts.map(a => "⚠ " + a.header).join("          ·          ");
      const bar = document.getElementById("abar");
      bar.style.display = "flex";
      document.getElementById("layout").classList.add("aon");
      // Calculer la durée selon la largeur réelle du texte
      // Vitesse constante : 80px par seconde
      requestAnimationFrame(() => {
        const textWidth = el.scrollWidth;
        const screenWidth = window.innerWidth;
        const totalDist = textWidth + screenWidth;
        const speed = 40; // px/s — vitesse lente et lisible
        const duration = Math.round(totalDist / speed);
        el.style.animation = `ticker ${duration}s linear infinite`;
      });
    }
  } catch (_) {}
}

// ── FILTERS ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const vis = allTrains.filter(t => {
    if (!activeTypes.has(t.type)) return false;
    if (!activeStatus.has(t.onTime ? "ok" : "late")) return false;
    if (q) {
      const s = (t.trip_id + " " + t.from + " " + t.to).toLowerCase();
      if (!s.includes(q)) return false;
    }
    return true;
  });
  renderMarkers(vis);
  renderList(vis);
  document.getElementById("listCount").textContent = vis.length;
}

// ── ICÔNE TRAIN (trait orienté avec flèche) ───────────────────────────────────
function makeIcon(t) {
  const angle = t.bearing || 0;
  const c = t.color;
  // Ombre colorée + flèche de direction
  const html = `<div style="
      transform:rotate(${angle}deg);
      position:relative;
      width:26px; height:8px;
      background:${c};
      border-radius:4px;
      box-shadow:0 0 10px ${c}cc, 0 0 4px ${c}88, 0 1px 3px rgba(0,0,0,.8);
      cursor:pointer;
    ">
    <div style="
      position:absolute; right:-6px; top:50%;
      transform:translateY(-50%);
      width:0; height:0;
      border-top:5px solid transparent;
      border-bottom:5px solid transparent;
      border-left:7px solid ${c};
      filter:drop-shadow(0 0 3px ${c});
    "></div>
  </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize:   [32, 8],
    iconAnchor: [16, 4],
  });
}

// ── MARKERS ──────────────────────────────────────────────────────────────────
function renderMarkers(vis) {
  const ids = new Set(vis.map(t => t.id));
  // Retirer les anciens
  for (const id in markers) {
    if (!ids.has(id)) { map.removeLayer(markers[id]); delete markers[id]; }
  }
  // Ajouter / mettre à jour
  for (const t of vis) {
    if (!t.lat || !t.lng) continue;
    if (markers[t.id]) {
      markers[t.id].setLatLng([t.lat, t.lng]);
      markers[t.id].setIcon(makeIcon(t));
    } else {
      const zOff = t.type === "TGV" ? 300 : t.type === "OUIGO" ? 200 : 0;
      const mk = L.marker([t.lat, t.lng], { icon: makeIcon(t), zIndexOffset: zOff });
      mk.bindPopup(() => popupHtml(t), { maxWidth: 260 });
      mk.on("click", () => {
        selId = t.id;
        showDetail(t);
        applyFilters();
      });
      mk.addTo(map);
      markers[t.id] = mk;
    }
  }
}

function popupHtml(t) {
  const dc = t.delay > 10 ? "r" : t.delay > 2 ? "o" : "g";
  const dl = t.delay <= 2 ? "À l'heure" : `+${t.delay} min`;
  return `<div class="pbx">
    <div class="pbxh">
      <div class="pbxid">${(t.trip_id||"").slice(0,16)}</div>
      <div class="pbadge" style="background:${t.color}">${t.type}</div>
    </div>
    <div class="pr"><span class="pk">De</span><span class="pv">${t.from}</span></div>
    <div class="pr"><span class="pk">Vers</span><span class="pv">${t.to}</span></div>
    <div class="pr"><span class="pk">Tronçon</span><span class="pv">${t.segFrom} → ${t.segTo}</span></div>
    <div class="pr"><span class="pk">Progression</span><span class="pv">${t.prog}%</span></div>
    <div class="pr"><span class="pk">Retard</span><span class="pv ${dc}">${dl}</span></div>
    <div class="pr"><span class="pk">Cap</span><span class="pv">${t.bearing}°</span></div>
    <div class="pr"><span class="pk">Vitesse est.</span><span class="pv">${t.speed} km/h</span></div>
    <button class="pdbtn" onclick="showDetailById('${t.id}')">Détails →</button>
  </div>`;
}

// ── LIST ──────────────────────────────────────────────────────────────────────
function renderList(vis) {
  const el = document.getElementById("tlist");
  if (!vis.length) {
    el.innerHTML = `<div class="empty"><div class="emico">🔍</div>Aucun résultat</div>`;
    return;
  }
  const sorted = [...vis].sort((a, b) => b.delay - a.delay);
  el.innerHTML = sorted.slice(0, 400).map(t => {
    const dc  = t.delay > 10 ? "dlat" : t.delay > 2 ? "dwrn" : "dok";
    const dl  = t.delay <= 2 ? "✓" : `+${t.delay}m`;
    const sel = t.id === selId ? " sel" : "";
    return `<div class="titem${sel}" onclick="clickItem('${t.id}')">
      <div class="ttag" style="background:${t.color}">${t.type}</div>
      <div class="tic">
        <div class="tic-rt">${t.from} → ${t.to}</div>
        <div class="tic-meta">
          <span style="color:${t.color}">●</span>
          <span>${(t.trip_id||"").slice(-10)}</span>
          <span class="dtag ${dc}">${dl}</span>
        </div>
        <div class="prog"><div class="prog-f" style="width:${t.prog}%;background:${t.color}"></div></div>
      </div>
    </div>`;
  }).join("");
}

function clickItem(id) {
  const t = allTrains.find(x => x.id === id);
  if (!t) return;
  selId = id;
  map.flyTo([t.lat, t.lng], 10, { duration: 1 });
  if (markers[id]) markers[id].openPopup();
  showDetail(t);
  applyFilters();
}

// ── DETAIL PANEL ─────────────────────────────────────────────────────────────
function showDetailById(id) {
  const t = allTrains.find(x => x.id === id);
  if (t) showDetail(t);
}

function showDetail(t) {
  document.getElementById("dpid").textContent = (t.trip_id || "").slice(0, 18);
  document.getElementById("dpid").style.color = t.color;
  document.getElementById("dproute").textContent = `${t.from} → ${t.to}`;

  const st = document.getElementById("dpstatus");
  if (t.onTime) {
    st.innerHTML = `<span style="color:var(--green)">✓ Train à l'heure</span>`;
    st.style.background = "var(--gbg)";
  } else {
    st.innerHTML = `<span style="color:var(--red)">⚠ Retard de +${t.delay} min</span>`;
    st.style.background = "var(--rbg)";
  }

  document.getElementById("dpgrid").innerHTML = `
    <div class="dpcell">
      <div class="dpcl">Type</div>
      <div class="dpcv" style="color:${t.color}">${t.type}</div>
    </div>
    <div class="dpcell">
      <div class="dpcl">Cap</div>
      <div class="dpcv">${t.bearing}°</div>
    </div>
    <div class="dpcell">
      <div class="dpcl">Vitesse est.</div>
      <div class="dpcv">${t.speed} km/h</div>
    </div>
    <div class="dpcell">
      <div class="dpcl">Retard</div>
      <div class="dpcv" style="color:${t.delay > 2 ? "var(--red)" : "var(--green)"}">
        ${t.delay <= 2 ? "0 min" : "+" + t.delay + " min"}
      </div>
    </div>
    <div class="dpcell">
      <div class="dpcl">Arrêts</div>
      <div class="dpcv">${t.stops}</div>
    </div>
    <div class="dpcell">
      <div class="dpcl">Progression</div>
      <div class="dpcv">${t.prog}%</div>
    </div>`;

  document.getElementById("dpstops").innerHTML = `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">Position calculée</div>
    <div class="sl"><div class="sb done"></div><div class="sn">${t.from}</div></div>
    <div class="sl"><div class="sb done"></div><div class="sn">${t.segFrom}</div></div>
    <div class="sl"><div class="sb cur"></div><div class="sn cur">▶ En transit · ${t.prog}%</div></div>
    <div class="sl"><div class="sb"></div><div class="sn">${t.segTo}</div></div>
    <div class="sl"><div class="sb end"></div><div class="sn">${t.to}</div></div>`;

  document.getElementById("dpanel").classList.add("open");

  // Tracer le trait jaune départ → arrivée
  drawRoute(t);
}

function closeDetail() {
  document.getElementById("dpanel").classList.remove("open");
  clearRoute();
  selId = null;
  applyFilters();
}

// ── CHIPS ─────────────────────────────────────────────────────────────────────
function toggleChip(el) {
  el.classList.toggle("on");
  const t = el.dataset.t, s = el.dataset.s;
  if (t) { activeTypes.has(t)  ? activeTypes.delete(t)  : activeTypes.add(t); }
  if (s) { activeStatus.has(s) ? activeStatus.delete(s) : activeStatus.add(s); }
  applyFilters();
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats(stats) {
  document.getElementById("sTotal").textContent = stats.total   ?? "—";
  document.getElementById("sOk").textContent    = stats.on_time ?? "—";
  document.getElementById("sDel").textContent   = stats.delayed ?? "—";
  for (const k of Object.keys(TYPE_COLORS)) {
    const el = document.getElementById("c" + k);
    if (el) el.textContent = stats.by_type?.[k] || "";
  }
}

// ── UI HELPERS ────────────────────────────────────────────────────────────────
function setStatus(mode, msg) {
  const dot = document.getElementById("ldot");
  dot.className = "ldot";
  if (mode === "err")  dot.classList.add("err");
  if (mode === "wait") dot.classList.add("wait");
  document.getElementById("llabel").textContent = msg || "";
}

function setLastUpdate() {
  document.getElementById("lupd").textContent =
    "MAJ " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("off");
}

// ── COUNTDOWN ─────────────────────────────────────────────────────────────────
function resetCountdown() {
  cdVal = REFRESH_SEC;
  clearInterval(cdTimer);
  cdTimer = setInterval(() => {
    cdVal--;
    document.getElementById("rbar").style.width = (cdVal / REFRESH_SEC * 100) + "%";
    document.getElementById("cdLabel").textContent = `↻ ${cdVal}s`;
    if (cdVal <= 0) doFetch();
  }, 1000);
}

// ── HORLOGE ───────────────────────────────────────────────────────────────────
setInterval(() => {
  document.getElementById("sClock").textContent =
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}, 1000);

// ── CLAVIER ───────────────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDetail();
  if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) doFetch();
});

// ── INIT ──────────────────────────────────────────────────────────────────────
(async () => {
  await doFetch();
  await doFetchAlerts();
})();
