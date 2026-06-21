// src/wordsearch/data/themes.ts
// Themed word lists for the Word Search game.
// Rules: single words only, max 10 letters, min 3 letters, ~20-25 per theme.

export type WordSearchThemeId =
  | 'animals'
  | 'sports'
  | 'countries'
  | 'space'
  | 'food'
  | 'music'
  | 'ocean'
  | 'weather'
  | 'nature'
  | 'holidays'
  | 'cities'
  | 'technology'
  | 'body'
  | 'movies';

export interface WordSearchTheme {
  id: WordSearchThemeId;
  name: string;
  emoji: string;
  words: string[];
}

export const WORD_SEARCH_THEMES: WordSearchTheme[] = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    words: [
      'LION', 'TIGER', 'ELEPHANT', 'GIRAFFE', 'PENGUIN',
      'DOLPHIN', 'GORILLA', 'CHEETAH', 'LEOPARD', 'KANGAROO',
      'FLAMINGO', 'CROCODILE', 'HAMSTER', 'PANTHER', 'JAGUAR',
      'BUFFALO', 'ANTELOPE', 'PLATYPUS', 'OCTOPUS', 'WALRUS',
      'PEACOCK', 'VULTURE', 'COYOTE', 'BABOON', 'NARWHAL',
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    words: [
      'SOCCER', 'TENNIS', 'BASEBALL', 'FOOTBALL', 'HOCKEY',
      'CRICKET', 'RUGBY', 'SWIMMING', 'CYCLING', 'BOXING',
      'ARCHERY', 'FENCING', 'SURFING', 'SKIING', 'SKATING',
      'LACROSSE', 'BADMINTON', 'GOLF', 'KARATE', 'JUDO',
      'HANDBALL', 'ROWING', 'DIVING', 'CLIMBING', 'TRIATHLON',
    ],
  },
  {
    id: 'countries',
    name: 'Countries',
    emoji: '🌍',
    words: [
      'FRANCE', 'BRAZIL', 'CANADA', 'JAPAN', 'GERMANY',
      'MEXICO', 'ITALY', 'EGYPT', 'INDIA', 'SPAIN',
      'CHINA', 'RUSSIA', 'KENYA', 'PERU', 'CHILE',
      'CUBA', 'GREECE', 'SWEDEN', 'TURKEY', 'NORWAY',
      'IRELAND', 'POLAND', 'VIETNAM', 'THAILAND', 'PORTUGAL',
    ],
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    words: [
      'MOON', 'MARS', 'VENUS', 'SATURN', 'JUPITER',
      'MERCURY', 'NEPTUNE', 'URANUS', 'COMET', 'ASTEROID',
      'GALAXY', 'NEBULA', 'PULSAR', 'QUASAR', 'ECLIPSE',
      'ORBIT', 'METEOR', 'CRATER', 'COSMOS', 'AURORA',
      'GRAVITY', 'HORIZON', 'ZENITH', 'SOLSTICE', 'EQUINOX',
    ],
  },
  {
    id: 'food',
    name: 'Food',
    emoji: '🍕',
    words: [
      'PIZZA', 'BURGER', 'SUSHI', 'TACO', 'PASTA',
      'RAMEN', 'WAFFLE', 'PANCAKE', 'BURRITO', 'LASAGNA',
      'RISOTTO', 'FALAFEL', 'HUMMUS', 'DUMPLING', 'PRETZEL',
      'BROWNIE', 'MUFFIN', 'CUPCAKE', 'SMOOTHIE', 'POPCORN',
      'NACHOS', 'OMELETTE', 'CROISSANT', 'SANDWICH', 'PAELLA',
    ],
  },
  {
    id: 'music',
    name: 'Music',
    emoji: '🎵',
    words: [
      'GUITAR', 'PIANO', 'VIOLIN', 'TRUMPET', 'DRUMS',
      'FLUTE', 'CELLO', 'CLARINET', 'TROMBONE', 'SAXOPHONE',
      'BANJO', 'UKULELE', 'HARP', 'BASS', 'ORGAN',
      'HARMONICA', 'MANDOLIN', 'OBOE', 'TAMBOURINE', 'ACCORDION',
      'MELODY', 'CHORUS', 'RHYTHM', 'TEMPO', 'SONATA',
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    words: [
      'SHARK', 'WHALE', 'CORAL', 'JELLYFISH', 'SEAHORSE',
      'STARFISH', 'LOBSTER', 'SEAWEED', 'BARNACLE', 'PLANKTON',
      'NAUTILUS', 'MANATEE', 'STINGRAY', 'BARRACUDA', 'MANTA',
      'BLOWFISH', 'HERRING', 'ANCHOVY', 'SARDINE', 'SWORDFISH',
      'TRENCH', 'CURRENT', 'KELP', 'TIDE', 'REEF',
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    emoji: '⛈️',
    words: [
      'THUNDER', 'HURRICANE', 'TORNADO', 'BLIZZARD', 'DRIZZLE',
      'SUNSHINE', 'RAINFALL', 'SNOWFALL', 'OVERCAST', 'HUMIDITY',
      'FORECAST', 'MONSOON', 'CYCLONE', 'TYPHOON', 'DROUGHT',
      'RAINBOW', 'FOGGY', 'CLOUDY', 'BREEZE', 'GUST',
      'FROST', 'SLEET', 'HAZE', 'STORM', 'LIGHTNING',
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    emoji: '🌲',
    words: [
      'MOUNTAIN', 'VOLCANO', 'CANYON', 'GLACIER', 'MEADOW',
      'FOREST', 'JUNGLE', 'SAVANNA', 'TUNDRA', 'DESERT',
      'PLATEAU', 'VALLEY', 'LAGOON', 'SWAMP', 'MARSH',
      'PRAIRIE', 'HIGHLAND', 'ESTUARY', 'DELTA', 'GORGE',
      'CAVERN', 'SUMMIT', 'RIDGE', 'WATERFALL', 'PENINSULA',
    ],
  },
  {
    id: 'holidays',
    name: 'Holidays',
    emoji: '🎉',
    words: [
      'CHRISTMAS', 'HALLOWEEN', 'EASTER', 'HANUKKAH', 'DIWALI',
      'RAMADAN', 'PASSOVER', 'CARNIVAL', 'SOLSTICE', 'BIRTHDAY',
      'FESTIVAL', 'JUBILEE', 'PARADE', 'FIREWORKS', 'LANTERN',
      'COSTUME', 'HARVEST', 'KWANZAA', 'ADVENT', 'MEMORIAL',
      'VALENTINE', 'CELEBRATE', 'BONFIRE', 'CONFETTI', 'WREATH',
    ],
  },
  {
    id: 'cities',
    name: 'World Cities',
    emoji: '🏙️',
    words: [
      'LONDON', 'PARIS', 'TOKYO', 'BERLIN', 'SYDNEY',
      'MOSCOW', 'DUBAI', 'CAIRO', 'ATHENS', 'ROME',
      'MADRID', 'LISBON', 'VIENNA', 'BANGKOK', 'NAIROBI',
      'OSLO', 'STOCKHOLM', 'DUBLIN', 'PRAGUE', 'WARSAW',
      'SEOUL', 'JAKARTA', 'MANILA', 'BRUSSELS', 'TORONTO',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    emoji: '💻',
    words: [
      'ROBOT', 'LAPTOP', 'TABLET', 'KEYBOARD', 'MONITOR',
      'SPEAKER', 'CAMERA', 'PRINTER', 'SCANNER', 'ROUTER',
      'SERVER', 'CODING', 'SOFTWARE', 'HARDWARE', 'BROWSER',
      'DATABASE', 'NETWORK', 'WIRELESS', 'BATTERY', 'CIRCUIT',
      'PROGRAM', 'PIXEL', 'SENSOR', 'DISPLAY', 'MODEM',
    ],
  },
  {
    id: 'body',
    name: 'Human Body',
    emoji: '🫀',
    words: [
      'BRAIN', 'HEART', 'LIVER', 'KIDNEY', 'STOMACH',
      'MUSCLE', 'SKELETON', 'ARTERY', 'NERVE', 'TENDON',
      'LIGAMENT', 'CORNEA', 'RETINA', 'PANCREAS', 'THYROID',
      'TRACHEA', 'FEMUR', 'TIBIA', 'FIBULA', 'PELVIS',
      'SHOULDER', 'EARDRUM', 'NOSTRIL', 'CARTILAGE', 'RIBCAGE',
    ],
  },
  {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    words: [
      'AVATAR', 'TITANIC', 'JAWS', 'ALIEN', 'GREASE',
      'ROCKY', 'PSYCHO', 'CASABLANCA', 'GLADIATOR', 'INCEPTION',
      'INTERSTELLAR', 'SPOTLIGHT', 'PARASITE', 'NOMADLAND', 'MOONLIGHT',
      'JOKER', 'DUNKIRK', 'GRAVITY', 'FROZEN', 'COCO',
      'UP', 'WALL', 'SHREK', 'BOLT', 'RATATOUILLE',
    ],
  },
];
