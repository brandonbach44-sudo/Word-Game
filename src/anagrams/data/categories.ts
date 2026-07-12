// src/anagrams/data/categories.ts
// Category word lists for Anagrams' "Categories" Quick Play mode — a themed
// alternative to Classic mode (which pulls from the fully general
// commonWords/VALID_WORDS pool). Each category has 100+ single words,
// 4-7 letters (matching ROUND_LENGTHS in ../utils/generator.ts), so a
// player can run a category repeatedly without seeing heavy repetition.
//
// Independent from Word Search's src/wordsearch/data/themes.ts on purpose —
// that list spans 3-12 letters and isn't validated for dictionary
// membership, so copying it directly would break Anagrams' answer checker.
// This file was seeded from the overlapping Word Search themes (Animals,
// Food, Countries, Space, Nature) then padded with additional real words
// pulled from src/shared/words.ts to clear 100 entries per category.
//
// IMPORTANT — dictionary membership: most words below ARE in VALID_WORDS
// (src/shared/words.ts), so Anagrams' "any valid anagram of the letters is
// accepted" checker (isValidAnagramGuess) recognizes them without any
// special-casing. A handful are NOT in the general English dictionary —
// proper nouns (all of Countries, plus space object/star names like HUBBLE,
// EUROPA, ORION, SIRIUS) and a few uncommon-but-real words (IGUANA, QUAIL,
// BLUEJAY, QUOKKA, TAGINE, QUINOA, TAQUITO, TOSTADA, FUSILLI, PLATEAU,
// ICECAP, VELDT, RIVULET). isValidAnagramGuess takes an optional
// categoryId param — when present it also accepts guesses matching that
// category's own word list, so these still validate correctly. See
// generateCategoryAnagrams and isValidAnagramGuess in ../utils/generator.ts.

export type AnagramsCategoryId = 'animals' | 'food' | 'countries' | 'space' | 'nature';

export interface AnagramsCategory {
  id: AnagramsCategoryId;
  name: string;
  emoji: string;
  words: string[]; // uppercase, 4-7 letters, deduped
}

const ANIMALS: string[] = [
  'LION', 'TIGER', 'ZEBRA', 'PANDA', 'KOALA', 'OTTER', 'CAMEL', 'SLOTH', 'FERRET', 'BADGER',
  'WEASEL', 'MARTEN', 'HYENA', 'JACKAL', 'DINGO', 'COYOTE', 'MOOSE', 'BISON', 'BOBCAT', 'COUGAR',
  'JAGUAR', 'OCELOT', 'LEMUR', 'TAPIR', 'WOMBAT', 'GIBBON', 'GOPHER', 'MARMOT', 'BEAVER', 'MUSKRAT',
  'OPOSSUM', 'POSSUM', 'RACCOON', 'SKUNK', 'MEERKAT', 'CARIBOU', 'GAZELLE', 'IMPALA', 'BUFFALO', 'WARTHOG',
  'HIPPO', 'RHINO', 'GIRAFFE', 'GORILLA', 'CHIMP', 'BABOON', 'DOLPHIN', 'WALRUS', 'NARWHAL', 'MANATEE',
  'WHALE', 'SHARK', 'CATFISH', 'SALMON', 'TROUT', 'HERRING', 'PIRANHA', 'OCTOPUS', 'SQUID', 'URCHIN',
  'LOBSTER', 'SHRIMP', 'PRAWN', 'SNAIL', 'SLUG', 'WORM', 'BEETLE', 'CRICKET', 'LOCUST', 'MANTIS',
  'FIREFLY', 'LADYBUG', 'HORNET', 'WASP', 'SPIDER', 'GECKO', 'IGUANA', 'LIZARD', 'TURTLE', 'PYTHON',
  'COBRA', 'VIPER', 'MAMBA', 'AXOLOTL', 'EAGLE', 'FALCON', 'HAWK', 'OSPREY', 'VULTURE', 'CONDOR',
  'BUZZARD', 'HERON', 'STORK', 'CRANE', 'PELICAN', 'PENGUIN', 'PUFFIN', 'SEAGULL', 'GULL', 'SWAN',
  'GOOSE', 'DUCK', 'MALLARD', 'TURKEY', 'PEACOCK', 'QUAIL', 'GROUSE', 'OSTRICH', 'KIWI', 'PARROT',
  'MACAW', 'TOUCAN', 'SPARROW', 'FINCH', 'ROBIN', 'BLUEJAY', 'CROW', 'RAVEN', 'MAGPIE', 'SWALLOW',
  'SWIFT', 'CANARY', 'BUDGIE', 'PIGEON', 'DOVE', 'MOLE', 'SHREW', 'GERBIL', 'HAMSTER', 'QUOKKA',
  'WALLABY', 'ECHIDNA', 'NEWT', 'TOAD', 'FROG',
];

const FOOD: string[] = [
  'PIZZA', 'PASTA', 'SUSHI', 'RAMEN', 'CURRY', 'BACON', 'TOAST', 'BAGEL', 'WAFFLE', 'BURRITO',
  'LASAGNA', 'RISOTTO', 'FALAFEL', 'HUMMUS', 'PRETZEL', 'BROWNIE', 'MUFFIN', 'CUPCAKE', 'POPCORN', 'NACHOS',
  'PAELLA', 'QUICHE', 'GNOCCHI', 'SAMOSA', 'KEBAB', 'POUTINE', 'TEMPURA', 'TAGINE', 'GOULASH', 'STRUDEL',
  'SORBET', 'CHURRO', 'MACARON', 'BRISKET', 'SAUSAGE', 'CHOWDER', 'NAAN', 'PITA', 'BRIOCHE', 'BREAD',
  'CHEESE', 'BUTTER', 'YOGURT', 'CEREAL', 'NOODLE', 'BURGER', 'FRIES', 'KETCHUP', 'MUSTARD', 'RELISH',
  'PICKLE', 'OLIVE', 'LEMON', 'LIME', 'MANGO', 'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MELON',
  'PEACH', 'CHERRY', 'APRICOT', 'PAPAYA', 'GUAVA', 'LYCHEE', 'COCONUT', 'PUMPKIN', 'SQUASH', 'POTATO',
  'CARROT', 'ONION', 'GARLIC', 'GINGER', 'PEPPER', 'TOMATO', 'CABBAGE', 'LETTUCE', 'SPINACH', 'CELERY',
  'RADISH', 'TURNIP', 'BEANS', 'LENTIL', 'QUINOA', 'BARLEY', 'WHEAT', 'RICE', 'MILLET', 'SORGHUM',
  'LEEK', 'SHALLOT', 'CHIVES', 'BASIL', 'THYME', 'CUMIN', 'PAPRIKA', 'VANILLA', 'HONEY', 'SYRUP',
  'JELLY', 'CANDY', 'TOFFEE', 'FUDGE', 'CARAMEL', 'PRALINE', 'TRUFFLE', 'BISCUIT', 'COOKIE', 'CRACKER',
  'PASTRY', 'CREPE', 'DONUT', 'ECLAIR', 'TART', 'COBBLER', 'SUNDAE', 'CUSTARD', 'PUDDING', 'MOUSSE',
  'SOUFFLE', 'NOUGAT', 'TAFFY', 'BRITTLE', 'SCONE', 'TAQUITO', 'FAJITA', 'FAJITAS', 'TOSTADA', 'CEVICHE',
  'SALSA', 'CHUTNEY', 'ALFREDO', 'RAVIOLI', 'FUSILLI', 'PENNE', 'HOTDOG',
];

const COUNTRIES: string[] = [
  'FRANCE', 'BRAZIL', 'CANADA', 'JAPAN', 'GERMANY', 'MEXICO', 'ITALY', 'EGYPT', 'INDIA', 'SPAIN',
  'CHINA', 'RUSSIA', 'KENYA', 'PERU', 'CHILE', 'CUBA', 'GREECE', 'SWEDEN', 'TURKEY', 'NORWAY',
  'IRELAND', 'POLAND', 'VIETNAM', 'DENMARK', 'FINLAND', 'UKRAINE', 'ROMANIA', 'HUNGARY', 'AUSTRIA', 'BELGIUM',
  'MOROCCO', 'NIGERIA', 'GHANA', 'SENEGAL', 'ECUADOR', 'BOLIVIA', 'URUGUAY', 'MYANMAR', 'NEPAL', 'JORDAN',
  'LEBANON', 'GEORGIA', 'ARMENIA', 'ICELAND', 'CROATIA', 'SERBIA', 'MOLDOVA', 'ALBANIA', 'IRAN', 'IRAQ',
  'CHAD', 'MALI', 'TOGO', 'LAOS', 'OMAN', 'YEMEN', 'QATAR', 'NAURU', 'PALAU', 'FIJI',
  'TONGA', 'SAMOA', 'BENIN', 'NIGER', 'GABON', 'ANGOLA', 'ZAMBIA', 'MALAWI', 'UGANDA', 'RWANDA',
  'LIBERIA', 'GUINEA', 'GAMBIA', 'SUDAN', 'LIBYA', 'TUNISIA', 'ALGERIA', 'SOMALIA', 'ERITREA', 'COMOROS',
  'BELIZE', 'PANAMA', 'GUYANA', 'BAHAMAS', 'JAMAICA', 'HAITI', 'BHUTAN', 'BRUNEI', 'MALTA', 'MONACO',
  'ANDORRA', 'KOSOVO', 'ESTONIA', 'LATVIA', 'BELARUS', 'CYPRUS', 'BAHRAIN', 'KUWAIT', 'NAMIBIA', 'TAIWAN',
  'VANUATU', 'GRENADA', 'ANTIGUA', 'LESOTHO', 'CZECHIA',
];

const SPACE: string[] = [
  'MOON', 'MARS', 'VENUS', 'SATURN', 'JUPITER', 'MERCURY', 'NEPTUNE', 'URANUS', 'COMET', 'GALAXY',
  'NEBULA', 'PULSAR', 'QUASAR', 'ECLIPSE', 'ORBIT', 'METEOR', 'CRATER', 'COSMOS', 'AURORA', 'GRAVITY',
  'HORIZON', 'ZENITH', 'EQUINOX', 'PHOTON', 'NEUTRON', 'PROTON', 'PLASMA', 'FUSION', 'SHUTTLE', 'CAPSULE',
  'BOOSTER', 'HUBBLE', 'VOYAGER', 'APOLLO', 'GEMINI', 'CASSINI', 'PLUTO', 'TITAN', 'EUROPA', 'CEPHEID',
  'APOGEE', 'PERIGEE', 'ORION', 'LUNAR', 'SOLAR', 'STELLAR', 'COSMIC', 'ASTRO', 'ROCKET', 'LAUNCH',
  'PAYLOAD', 'MODULE', 'STATION', 'OBSERVE', 'RADIANT', 'BINARY', 'CLUSTER', 'CORONA', 'ZODIAC', 'BLAZAR',
  'IMPACT', 'DEBRIS', 'AZIMUTH', 'PARSEC', 'AXIS', 'TILT', 'PHASE', 'UMBRA', 'SYZYGY', 'TRANSIT',
  'NADIR', 'CERES', 'CHARON', 'TRITON', 'PHOBOS', 'DEIMOS', 'MIMAS', 'IAPETUS', 'OBERON', 'MIRANDA',
  'ARIEL', 'TITANIA', 'NOVA', 'FLARE', 'SUNSPOT', 'SIRIUS', 'VEGA', 'POLARIS', 'RIGEL', 'ALTAIR',
  'ANTARES', 'CANOPUS', 'SPICA', 'REGULUS', 'CAPELLA', 'DENEB', 'CASTOR', 'POLLUX', 'LYRA', 'CYGNUS',
  'URSA', 'AQUILA', 'TAURUS', 'VIRGO', 'LIBRA', 'ARIES', 'PISCES', 'CANCER',
];

const NATURE: string[] = [
  'VOLCANO', 'CANYON', 'GLACIER', 'MEADOW', 'FOREST', 'JUNGLE', 'SAVANNA', 'TUNDRA', 'DESERT', 'PLATEAU',
  'VALLEY', 'LAGOON', 'SWAMP', 'MARSH', 'PRAIRIE', 'ESTUARY', 'DELTA', 'GORGE', 'CAVERN', 'SUMMIT',
  'RIDGE', 'ATOLL', 'FJORD', 'STEPPE', 'MOOR', 'ISLAND', 'HEATH', 'WETLAND', 'TAIGA', 'BASIN',
  'BUTTE', 'MESA', 'BLUFF', 'CLIFF', 'DUNE', 'GEYSER', 'ICECAP', 'ICEBERG', 'RAPIDS', 'INLET',
  'COVE', 'ISTHMUS', 'CAPE', 'STRAIT', 'SOUND', 'CHANNEL', 'KNOLL', 'TARN', 'OASIS', 'MORAINE',
  'HILLOCK', 'SANDBAR', 'REEF', 'GLADE', 'GROVE', 'THICKET', 'COPSE', 'FELL', 'CRAG', 'SCREE',
  'ARROYO', 'SHOAL', 'BAYOU', 'SLOUGH', 'PAMPAS', 'VELDT', 'OUTBACK', 'PLAIN', 'WOODS', 'TIMBER',
  'CANOPY', 'PEAK', 'SLOPE', 'RIDGES', 'GORGES', 'DELTAS', 'INLETS', 'COVES', 'CAPES', 'ATOLLS',
  'REEFS', 'ISLE', 'ISLES', 'SPRINGS', 'CAVE', 'CAVES', 'GROTTO', 'CREVICE', 'CHASM', 'ABYSS',
  'CLIFFS', 'BLUFFS', 'BROOK', 'STREAM', 'CREEK', 'RIVULET', 'CASCADE', 'POND', 'SWAMPS', 'BOGS',
];

export const ANAGRAMS_CATEGORIES: AnagramsCategory[] = [
  { id: 'animals', name: 'Animals', emoji: '🦁', words: ANIMALS },
  { id: 'food', name: 'Food', emoji: '🍕', words: FOOD },
  { id: 'countries', name: 'Countries', emoji: '🌍', words: COUNTRIES },
  { id: 'space', name: 'Space', emoji: '🚀', words: SPACE },
  { id: 'nature', name: 'Nature', emoji: '⛰️', words: NATURE },
];

export function getAnagramsCategory(id: AnagramsCategoryId): AnagramsCategory {
  const category = ANAGRAMS_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown Anagrams category: ${id}`);
  return category;
}

/** Words in this category, grouped by length, for building rounds of specific lengths. */
export function getCategoryWordsByLength(id: AnagramsCategoryId, length: number): string[] {
  return getAnagramsCategory(id).words.filter((w) => w.length === length);
}
