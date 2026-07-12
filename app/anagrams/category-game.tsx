// app/anagrams/category-game.tsx — Categories Quick Play mode, unlimited
// replays, same 5-round structure as Classic (app/anagrams/game.tsx) but
// every round's word comes from a single chosen category
// (src/anagrams/data/categories.ts) instead of the general word pool.

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { generateCategoryAnagrams } from '../../src/anagrams/utils/generator';
import { ANAGRAMS_CATEGORIES, AnagramsCategoryId } from '../../src/anagrams/data/categories';
import AnagramsPlayScreen from '../../src/anagrams/screens/AnagramsPlayScreen';

function resolveCategoryId(raw: string | string[] | undefined): AnagramsCategoryId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const match = ANAGRAMS_CATEGORIES.find((c) => c.id === value);
  // Falls back to the first category rather than crashing if somehow no
  // (or an invalid) category param is passed in.
  return (match ?? ANAGRAMS_CATEGORIES[0]).id;
}

export default function AnagramsCategoryGameScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryId = resolveCategoryId(params.category);

  const [puzzle, setPuzzle] = useState(() => generateCategoryAnagrams(categoryId));
  const [key, setKey] = useState(0);

  return (
    <AnagramsPlayScreen
      key={key}
      puzzle={puzzle}
      mode="practice"
      categoryId={categoryId}
      onGoHome={() => router.back()}
      onPlayAgain={() => {
        setPuzzle(generateCategoryAnagrams(categoryId));
        setKey((k) => k + 1);
      }}
    />
  );
}
