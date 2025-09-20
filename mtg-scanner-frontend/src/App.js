import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

// Complete card database
const EDGE_OF_ETERNITIES_CARDS = {
  // COLORLESS (1-2)
  'colorless_1': 'Anticausal Vestige',
  'colorless_2': 'Tezzeret, Cruel Captain',

  // WHITE (3-45)
  'white_3': 'All-Fates Stalker',
  'white_4': 'Astelli Reclaimer',
  'white_5': 'Auxiliary Boosters',
  'white_6': 'Banishing Light',
  'white_7': 'Beyond the Quiet',
  'white_8': 'Brightspear Zealout',
  'white_9': 'Cosmogrand Zenith',
  'white_10': 'Dawnstrike Vanguard',
  'white_11': 'Dockworker Drone',
  'white_12': 'Dual-Sun Adepts',
  'white_13': 'Dual-Sun Technique',
  'white_14': 'Emergency Eject',
  'white_15': 'Exalted Sunborn',
  'white_16': 'Exosuit Savior',
  'white_17': 'Flight-Deck Coordinator',
  'white_18': 'Focus Fire',
  'white_19': 'Haliya, Guided by Light',
  'white_20': 'Hardlight Containment',
  'white_21': 'Honor',
  'white_22': 'Honored Knight-Captain',
  'white_23': 'Knight Luminary',
  'white_24': 'Lightstall Inquisitor',
  'white_25': 'Lumen-Class Frigate',
  'white_26': 'Luxknight Breacher',
  'white_27': 'Pinnacle Starcage',
  'white_28': 'Pulsar Squadron Ace',
  'white_29': 'Radiant Strike',
  'white_30': 'Rayblade Trooper',
  'white_31': 'Reroute Systems',
  'white_32': 'Rescue Skiff',
  'white_33': 'Scout for Survivors',
  'white_34': 'Seam Rip',
  'white_35': 'The Seriema',
  'white_36': 'Squire\'s Lightblade',
  'white_37': 'Starfield Shepherd',
  'white_38': 'Starfighter Pilot',
  'white_39': 'Starport Security',
  'white_40': 'Sunstar Chaplan',
  'white_41': 'Sunstar Expansionist',
  'white_42': 'Sunstar Lightsmith',
  'white_43': 'Wedgelight Rammer',
  'white_44': 'Weftblade Enhancer',
  'white_45': 'Zealous Display',

  // BLUE (46-86)  
  'blue_46': 'Annul',
  'blue_47': 'Atomic Microsizer',
  'blue_48': 'Cerebral Download',
  'blue_49': 'Cloudsculpt Technician',
  'blue_50': 'Codecracker Hound',
  'blue_51': 'Consult the Star Charts',
  'blue_52': 'Cryogen Relic',
  'blue_53': 'Cryoshatter',
  'blue_54': 'Desculpting Blast',
  'blue_55': 'Divert Disaster',
  'blue_56': 'Emissary Escort',
  'blue_57': 'Gigastorm Titan',
  'blue_58': 'Illvoi Galeblade',
  'blue_59': 'Illvoi Infiltraitor',
  'blue_60': 'Illvoi Light Jammer',
  'blue_61': 'Illvoi Operative',
  'blue_62': 'Lost in Space',
  'blue_63': 'Mechan Assembler',
  'blue_64': 'Mechan Navigator',
  'blue_65': 'Mechan Shieldmate',
  'blue_66': 'Mechanozoa',
  'blue_67': 'Mental Modulation',
  'blue_68': 'Mm\'menon, the Right Hand',
  'blue_69': 'Moonlit Meditation',
  'blue_70': 'Mouth of the Storm',
  'blue_71': 'Nanoform Sentinel',
  'blue_72': 'Quantum Riddler',
  'blue_73': 'Scour for Scrap',
  'blue_74': 'Selfcraft Mechan',
  'blue_75': 'Sinister Cryologist',
  'blue_76': 'Specimen Freighter',
  'blue_77': 'Starbreach Whale',
  'blue_78': 'Starfield Vocalist',
  'blue_79': 'Starwinder',
  'blue_80': 'Steelwarm Operator',
  'blue_81': 'Synthesizer Labship',
  'blue_82': 'Tractor Beam',
  'blue_83': 'Unravel',
  'blue_84': 'Uthros Psionicist',
  'blue_85': 'Uthros Scanship',
  'blue_86': 'Weftwalking',

  // BLACK (87-128)
  'black_87': 'Alpharael, Stonechosen',
  'black_88': 'Archenemy\'s Charm',
  'black_89': 'Beamsaw Protector',
  'black_90': 'Blade of the Swarm',
  'black_91': 'Chorale of the Void',
  'black_92': 'Comet Crawler',
  'black_93': 'Dark Endurance',
  'black_94': 'Decode Transmissions',
  'black_95': 'Depressurize',
  'black_96': 'Dubious Deliccacy',
  'black_97': 'Elegy Acolyte',
  'black_98': 'Embrace Oblivion',
  'black_99': 'Entropic Battlecruiser',
  'black_100': 'Faller\'s Faithful',
  'black_101': 'Fell Gravship',
  'black_102': 'Gravblade Heavy',
  'black_103': 'Gravkill',
  'black_104': 'Gravpack Monoist',
  'black_105': 'Hullcarver',
  'black_106': 'Hylderblade',
  'black_107': 'Hymn of the Faller',
  'black_108': 'Insatiable Skittermaw',
  'black_109': 'Lightless Evangel',
  'black_110': 'Monoist Circuit-Feeder',
  'black_111': 'Monoist Sentry',
  'black_112': 'Perigee Beckoner',
  'black_113': 'Requiem Monolith',
  'black_114': 'Scrounge for Eternity',
  'black_115': 'Sothera, the Supervoid',
  'black_116': 'Sunset Saboteur',
  'black_117': 'Susurian Dirgecraft',
  'black_118': 'Susurian Voidborn',
  'black_119': 'Swarm Culler',
  'black_120': 'Temporal Intervention',
  'black_121': 'Timeline Culler',
  'black_122': 'Tragic Tragectory',
  'black_123': 'Umbral Collar Zealout',
  'black_124': 'Virus Beetle',
  'black_125': 'Voidforged Titan',
  'black_126': 'Vote Out',
  'black_127': 'Xu-Ifit, Osteoharmonist',
  'black_128': 'Zero Point Ballad',

  // RED (129-170)
  'red_129': 'Bombard',
  'red_130': 'Cut Propulsion',
  'red_131': 'Debris Field Crusher',
  'red_132': 'Devastating Onslaught',
  'red_133': 'Drill Too Deep',
  'red_134': 'Frontline War-Rager',
  'red_135': 'Full Bore',
  'red_136': 'Galvanizing Sawship',
  'red_137': 'Invasive Maneuvers',
  'red_138': 'Kav Landseeker',
  'red_139': 'Kavaron Harrier',
  'red_140': 'Kavaron Skywarden',
  'red_141': 'Kavaron Turbodrone',
  'red_142': 'Lithobraking',
  'red_143': 'Melded Moxite',
  'red_144': 'Memorial Team Leader',
  'red_145': 'Memorial Vault',
  'red_146': 'Molecular Modifier',
  'red_147': 'Nebula Dragon',
  'red_148': 'Nova Hellkite',
  'red_149': 'Orbital Plunge',
  'red_150': 'Oreplate Pangolin',
  'red_151': 'Pain for All',
  'red_152': 'Plasma Bolt',
  'red_153': 'Possibility Technician',
  'red_154': 'Red Tiger Mechan',
  'red_155': 'Remant Elemental',
  'red_156': 'Rig for War',
  'red_157': 'Roving Actuator',
  'red_158': 'Ruinous Rampage',
  'red_159': 'Rust Harvester',
  'red_160': 'Slagdrill Scrapper',
  'red_161': 'Systems Override',
  'red_162': 'Tannuk, Steadfast Second',
  'red_163': 'Terminal Velocity',
  'red_164': 'Terrapact Intimidator',
  'red_165': 'Territorial Bruntar',
  'red_166': 'Vaultguard Trooper',
  'red_167': 'Warmaker Gunship',
  'red_168': 'Weapons Manufacturing',
  'red_169': 'Wefstalker Ardent',
  'red_170': 'Zookeeper Mechan',

  // GREEN (171-211)
  'green_171': 'Atmospheric Greenhouse',
  'green_172': 'Bioengineered Future',
  'green_173': 'Biosynthetic Burst',
  'green_174': 'Blooming Stinger',
  'green_175': 'Broodguard Elite',
  'green_176': 'Close Encounter',
  'green_177': 'Diplomatic Relations',
  'green_178': 'Drix Fatemaker',
  'green_179': 'Edge Rover',
  'green_180': 'Eumidian Terrabotanist',
  'green_181': 'Eusocial Enginerring',
  'green_182': 'Famished Worldsire',
  'green_183': 'Frenzied Baloth',
  'green_184': 'Fungal Colossus',
  'green_185': 'Galactic Wayfarer',
  'green_186': 'Gene Pollinator',
  'green_187': 'Germinating Wurm',
  'green_188': 'Glacier Godmaw',
  'green_189': 'Harmonious Grovestrider',
  'green_190': 'Hemosymbic Mite',
  'green_191': 'Icecave Crasher',
  'green_192': 'Icetill Explorer',
  'green_193': 'Intrepid Tenderfoot',
  'green_194': 'Larval Scoutlander',
  'green_195': 'Lashwhip Predator',
  'green_196': 'Loading Zone',
  'green_197': 'Meltstrider Eulogist',
  'green_198': 'Meltstrider\'s Gear',
  'green_199': 'Meltstrider\'s Resolve',
  'green_200': 'Mightform Harmonizer',
  'green_201': 'Ouroboroid',
  'green_202': 'Pull Through the Weft',
  'green_203': 'Sami\'s Curiosity',
  'green_204': 'Seedship Agrarian',
  'green_205': 'Seedship Impact',
  'green_206': 'Shattered Wings',
  'green_207': 'Skystinger',
  'green_208': 'Sledge-Class Seedship',
  'green_209': 'Tapestry Warden',
  'green_210': 'Terrasymbiosis',
  'green_211': 'Thawbringer',

  // MULTI (212-233)
  'multi_212': 'Alpharael, Dreaming Acolyte',
  'multi_213': 'Biomechan Engineer',
  'multi_214': 'Biotech Specialist',
  'multi_215': 'Dyardrine, Synthesis Amalgam',
  'multi_216': 'Genemorph Imago',
  'multi_217': 'Haliya, Ascendant Cadet',
  'multi_218': 'Infinite Guideline Station',
  'multi_219': 'Interceptor Mechan',
  'multi_220': 'Mm\'menon, Uthros Exile',
  'multi_221': 'Mutinous Massacre',
  'multi_222': 'Pinnacle Emissary',
  'multi_223': 'Ragost, Deft Gastronaut',
  'multi_224': 'Sami, Ship\'s Engineer',
  'multi_225': 'Sami, Wildcat Captain',
  'multi_226': 'Seedship Broodtender',
  'multi_227': 'Singularity Rupture',
  'multi_228': 'Space-Time Anomaly',
  'multi_229': 'Station Monitor',
  'multi_230': 'Syr Vondam, Sunstar Exemplar',
  'multi_231': 'Syr Vondam, the Lucent',
  'multi_232': 'Tannuk, Memorial Ensign',
  'multi_233': 'Tezzeret, Master of the Bridge',

  // ARTIFACT (234-249)
  'artifact_234': 'All-Fates Scroll',
  'artifact_235': 'Bygone Colossus',
  'artifact_236': 'Chrome Companion',
  'artifact_237': 'Dauntless Scrapbot',
  'artifact_238': 'Dawnsire, Sunstar Dreadnought',
  'artifact_239': 'The Dominion Bracelet',
  'artifact_240': 'The Endstone',
  'artifact_241': 'The Eternity Elevator',
  'artifact_242': 'Extinguisher Battleship',
  'artifact_243': 'Nutrient Block',
  'artifact_244': 'Pinnacle Kill-Ship',
  'artifact_245': 'Survey Mechan',
  'artifact_246': 'Thaumaton Torpedo',
  'artifact_247': 'Thrumming Hivepool',
  'artifact_248': 'Virulent Silencer',
  'artifact_249': 'Wurmwall Sweeper',

  // NONBASIC (250-261)
  'nonbasic_250': 'Adagia, Windswept Bastion',
  'nonbasic_251': 'Breeding Pool',
  'nonbasic_252': 'Command Bridge',
  'nonbasic_253': 'Evendo, Waking Haven',
  'nonbasic_254': 'Godless Shrine',
  'nonbasic_255': 'Kavaron, Memorial World',
  'nonbasic_256': 'Sacred Foundry',
  'nonbasic_257': 'Secluded Starforge',
  'nonbasic_258': 'Stomping Ground',
  'nonbasic_259': 'Susur Secundi, Void Altar',
  'nonbasic_260': 'Uthros, Titanic Godcore',
  'nonbasic_261': 'Watery Grave',

  // STELLAR SIGHTS SECTION 1 (1-31)
  'stellar_sights_1_1': 'Ancient Tomb',
  'stellar_sights_1_2': 'Blast Zone',
  'stellar_sights_1_3': 'Blinkmoth Nexus',
  'stellar_sights_1_4': 'Bonders\' Enclave',
  'stellar_sights_1_5': 'Cascading Cataracts',
  'stellar_sights_1_6': 'Cathedral of War',
  'stellar_sights_1_7': 'Celestial Colonnade',
  'stellar_sights_1_8': 'Contested War Zone',
  'stellar_sights_1_9': 'Creeping Tar Pit',
  'stellar_sights_1_10': 'Crystal Quarry',
  'stellar_sights_1_11': 'Deserted Temple',
  'stellar_sights_1_12': 'Dust Bowl',
  'stellar_sights_1_13': 'Echoing Deeps',
  'stellar_sights_1_14': 'Eldrazi Temple',
  'stellar_sights_1_15': 'Endless Sands',
  'stellar_sights_1_16': 'Gemstone Caverns',
  'stellar_sights_1_17': 'Grove of the Burnwillows',
  'stellar_sights_1_18': 'High Market',
  'stellar_sights_1_19': 'Hissing Quagmire',
  'stellar_sights_1_20': 'Inkmoth Nexus',
  'stellar_sights_1_21': 'Inventors\' Fair',
  'stellar_sights_1_22': 'Lavaclaw Reaches',
  'stellar_sights_1_23': 'Lotus Field',
  'stellar_sights_1_24': 'Lumbering Falls',
  'stellar_sights_1_25': 'Mana Confluence',
  'stellar_sights_1_26': 'Meteor Crater',
  'stellar_sights_1_27': 'Mirrorpool',
  'stellar_sights_1_28': 'Mutavault',
  'stellar_sights_1_29': 'Mistifying Maze',
  'stellar_sights_1_30': 'Needle Spires',
  'stellar_sights_1_31': 'Nesting Grounds',

  // STELLAR SIGHTS SECTION 2 (32-45)  
  'stellar_sights_2_32': 'Petrified Field',
  'stellar_sights_2_33': 'Plaza of Heroes',
  'stellar_sights_2_34': 'Power Depot',
  'stellar_sights_2_35': 'Raging Ravine',
  'stellar_sights_2_36': 'Reflecting Pool',
  'stellar_sights_2_37': 'Scavenger Grounds',
  'stellar_sights_2_38': 'Shambling Vent',
  'stellar_sights_2_39': 'Stirring Wildwood',
  'stellar_sights_2_40': 'Strip Mine',
  'stellar_sights_2_41': 'Sunken Citadel',
  'stellar_sights_2_42': 'Swarmyard',
  'stellar_sights_2_43': 'Terrain Generator',
  'stellar_sights_2_44': 'Thespian\'s Stage',
  'stellar_sights_2_45': 'Wandering Fumarole',

  // SPECIAL GUESTS (1-9)
  'special_guests_1': 'Warping Wail',
  'special_guests_2': 'Deafening Silence',
  'special_guests_3': 'Robe of Stars',
  'special_guests_4': 'Nexus of Fate',
  'special_guests_5': 'Paradox Haze',
  'special_guests_6': 'Darkness',
  'special_guests_7': 'Magus of the Moon',
  'special_guests_8': 'Burgeoning',
  'special_guests_9': 'Sliver Overlord',

  // BASIC LANDS (1-5)
  'basic_lands_1': 'Plains',
  'basic_lands_2': 'Island', 
  'basic_lands_3': 'Swamp',
  'basic_lands_4': 'Mountain',
  'basic_lands_5': 'Forest'
};

function MTGDecklistApp() {
  const [cards, setCards] = useState([]);
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize cards on first load
  React.useEffect(() => {
    const initCards = [];
    const sections = [
      'colorless', 'white', 'blue', 'black', 'red', 'green', 'multi', 
      'artifact', 'nonbasic', 'stellar_sights_1', 'stellar_sights_2', 
      'special_guests', 'basic_lands'
    ];
    
    sections.forEach(section => {
      Object.entries(EDGE_OF_ETERNITIES_CARDS)
        .filter(([key]) => key.startsWith(`${section}_`))
        .forEach(([key, name]) => {
          const setNumber = parseInt(key.split('_').pop());
          initCards.push({
            section,
            setNumber,
            name,
            played: 0
          });
        });
    });
    
    // Sort by section order and set number
    initCards.sort((a, b) => {
      if (a.section !== b.section) {
        return sections.indexOf(a.section) - sections.indexOf(b.section);
      }
      return a.setNumber - b.setNumber;
    });
    
    setCards(initCards);
  }, []);

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setIsAnalyzing(true);
      setError(null);
      setDebugInfo(null);

      // Call API
      const formData = new FormData();
      formData.append('image', file);

      fetch('https://mtg-draft-scanner-production.up.railway.app/api/analyze-decklist', {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        setDebugInfo({
          totalFields: Object.keys(result.analyzeResult?.documents?.[0]?.fields || {}).length
        });

        // Parse results
        const fields = result.analyzeResult?.documents?.[0]?.fields || {};
        const updatedCards = [...cards];

        Object.entries(fields).forEach(([fieldName, fieldData]) => {
          const match = fieldName.match(/^(\w+)_played_(\d+)$/);
          if (match && fieldData.valueString && fieldData.valueString !== '(Not found)') {
            const [, section, setNumber] = match;
            
            let quantity = String(fieldData.valueString || '');
            quantity = quantity.replace(/[li|I]/g, '1');
            quantity = quantity.replace(/[Oo]/g, '0');
            quantity = quantity.replace(/[Ss]/g, '5');
            
            const cardIndex = updatedCards.findIndex(card => 
              card.section === section && card.setNumber === parseInt(setNumber)
            );
            
            if (cardIndex !== -1) {
              updatedCards[cardIndex].played = parseInt(quantity) || 0;
            }
          }
        });

        setCards(updatedCards);
      })
      .catch(err => {
        setError(`Failed to analyze image: ${err.message}`);
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
    }
  };

  // Update card quantity
  const updateCardQuantity = (index, value) => {
    const newCards = [...cards];
    newCards[index].played = Math.max(0, parseInt(value) || 0);
    setCards(newCards);
  };

  // Update card name
  const updateCardName = (index, value) => {
    const newCards = [...cards];
    newCards[index].name = value;
    setCards(newCards);
  };

  // Reset all
  const resetAll = () => {
    const resetCards = cards.map(card => ({ ...card, played: 0 }));
    setCards(resetCards);
    setImage(null);
    setError(null);
    setDebugInfo(null);
  };

  // Get card color
  const getCardColor = (section) => {
    const colors = {
      white: 'text-yellow-700',
      blue: 'text-blue-700',
      black: 'text-gray-900',
      red: 'text-red-700', 
      green: 'text-green-700',
      colorless: 'text-gray-600',
      multi: 'text-purple-700',
      artifact: 'text-amber-700',
      nonbasic: 'text-stone-700',
      stellar_sights_1: 'text-indigo-700',
      stellar_sights_2: 'text-indigo-700',
      special_guests: 'text-pink-700',
      basic_lands: 'text-green-600'
    };
    return colors[section] || 'text-gray-700';
  };

  // Calculate total
  const totalMainboard = cards.reduce((sum, card) => sum + card.played, 0);

  // Group cards by section
  const sections = [
    { name: 'COLORLESS', key: 'colorless' },
    { name: 'WHITE', key: 'white' },
    { name: 'BLUE', key: 'blue' },
    { name: 'BLACK', key: 'black' },
    { name: 'RED', key: 'red' },
    { name: 'GREEN', key: 'green' },
    { name: 'MULTICOLOR', key: 'multi' },
    { name: 'ARTIFACTS', key: 'artifact' },
    { name: 'NONBASIC LANDS', key: 'nonbasic' },
    { name: 'STELLAR SIGHTS 1', key: 'stellar_sights_1' },
    { name: 'STELLAR SIGHTS 2', key: 'stellar_sights_2' },
    { name: 'SPECIAL GUESTS', key: 'special_guests' },
    { name: 'BASIC LANDS', key: 'basic_lands' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Scan Section */}
          <div className="col-span-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
              {!image ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white py-2 px-4 rounded text-sm flex items-center gap-2 hover:bg-blue-700"
                >
                  <Upload size={16} />
                  Scan Decklist
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <img src={image} alt="Preview" className="w-12 h-12 object-contain rounded border" />
                  <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-700">
                    Change Image
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isAnalyzing && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-xs text-gray-600">Analyzing...</span>
                </div>
              )}

              {debugInfo && (
                <div className="text-xs text-gray-600">
                  Found {debugInfo.totalFields} fields
                </div>
              )}

              {error && (
                <div className="flex items-center gap-1 text-red-700">
                  <AlertCircle size={14} />
                  <span className="text-xs">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mainboard Count */}
          <div className="col-span-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Mainboard</div>
                <div className="text-2xl font-bold text-blue-600">{totalMainboard}</div>
              </div>
              <div className="text-xs text-gray-500">
                MTG Draft Pool Scanner - Edge of Eternities
              </div>
            </div>
          </div>
        </div>

        {/* Card List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-auto" style={{ height: 'calc(100vh - 140px)' }}>
            <div className="p-2">
              {sections.map(section => {
                const sectionCards = cards.filter(card => card.section === section.key);
                if (sectionCards.length === 0) return null;

                return (
                  <div key={section.key} className="mb-4">
                    {/* Section Header */}
                    <div className="bg-gray-800 text-white px-2 py-1 text-xs font-bold uppercase mb-1">
                      {section.name}
                    </div>
                    
                    {/* Cards Grid - 4 columns */}
                    <div className="grid grid-cols-4 gap-x-3 gap-y-0.5">
                      {sectionCards.map((card, cardIndex) => {
                        const globalIndex = cards.findIndex(c => c === card);
                        return (
                          <div key={`${card.section}_${card.setNumber}`} className="flex items-center gap-1 text-xs py-0.5">
                            {/* Count input */}
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={card.played}
                              onChange={(e) => updateCardQuantity(globalIndex, e.target.value)}
                              className="w-7 text-center border border-gray-300 rounded px-0.5 py-0.5 focus:ring-1 focus:ring-blue-500"
                            />
                            
                            {/* Card name */}
                            <input
                              type="text"
                              value={card.name}
                              onChange={(e) => updateCardName(globalIndex, e.target.value)}
                              className={`flex-1 border-none bg-transparent font-medium ${getCardColor(card.section)} focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-xs`}
                              style={{ minWidth: '100px' }}
                            />
                          </div>
                        );
                      })}
                      
                      {/* Fill empty cells */}
                      {sectionCards.length % 4 !== 0 && Array.from({ length: 4 - (sectionCards.length % 4) }).map((_, i) => (
                        <div key={`empty-${i}`} className="text-xs py-0.5"></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MTGDecklistApp;