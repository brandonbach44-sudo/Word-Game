// Hangman word categories and words
export const WORD_CATEGORIES:  { [key: string]: string[] } = {
  'Animals':  [
    'elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo',
    'butterfly', 'alligator', 'hedgehog', 'flamingo', 'octopus',
    'cheetah', 'gorilla', 'raccoon', 'squirrel', 'armadillo',
    'zebra', 'leopard', 'pelican', 'hamster', 'parrot',
  ],
  'Countries':  [
    'australia', 'brazil', 'canada', 'denmark', 'ethiopia',
    'france', 'germany', 'hungary', 'indonesia', 'jamaica',
    'kenya', 'luxembourg', 'mexico', 'netherlands', 'portugal',
    'spain', 'sweden', 'thailand', 'vietnam', 'argentina',
  ],
  'Foods': [
    'hamburger', 'spaghetti', 'chocolate', 'pineapple', 'strawberry',
    'avocado', 'broccoli', 'mushroom', 'sandwich', 'pancakes',
    'croissant', 'burrito', 'lasagna', 'cheesecake', 'cucumber',
    'blueberry', 'watermelon', 'asparagus', 'cinnamon', 'macaroni',
  ],
  'Sports': [
    'basketball', 'football', 'swimming', 'volleyball', 'badminton',
    'gymnastics', 'wrestling', 'snowboard', 'surfing', 'baseball',
    'cricket', 'hockey', 'tennis', 'archery', 'cycling',
    'marathon', 'bowling', 'boxing', 'sailing', 'skiing',
  ],
  'Technology': [
    'computer', 'keyboard', 'smartphone', 'bluetooth', 'software',
    'internet', 'algorithm', 'database', 'hardware', 'encryption',
    'download', 'streaming', 'wireless', 'processor', 'interface',
    'monitor', 'browser', 'network', 'robotics', 'programming',
  ],
  'Movies': [
    'adventure', 'animation', 'thriller', 'documentary', 'fantasy',
    'romance', 'superhero', 'mystery', 'western', 'musical',
    'horror', 'science', 'action', 'drama', 'comedy',
    'biography', 'historical', 'detective', 'suspense', 'sequel',
  ],
  'Nature': [
    'mountain', 'waterfall', 'rainbow', 'volcano', 'hurricane',
    'lightning', 'earthquake', 'sunshine', 'blizzard', 'glacier',
    'desert', 'forest', 'island', 'canyon', 'meadow',
    'ocean', 'river', 'valley', 'jungle', 'prairie',
  ],
  'Professions': [
    'architect', 'scientist', 'engineer', 'musician', 'physician',
    'carpenter', 'detective', 'librarian', 'journalist', 'pharmacist',
    'accountant', 'electrician', 'professor', 'veterinarian', 'programmer',
    'firefighter', 'astronaut', 'chef', 'lawyer', 'dentist',
  ],
};

export const MAX_ATTEMPTS = 6;

export const getRandomWord = (): { word: string; category:  string } => {
  const categories = Object.keys(WORD_CATEGORIES);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const words = WORD_CATEGORIES[randomCategory];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  return { word: randomWord.toUpperCase(), category: randomCategory };
};