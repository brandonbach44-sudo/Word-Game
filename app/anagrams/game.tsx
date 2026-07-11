// app/anagrams/game.tsx — Quick Play (practice) mode, unlimited replays.

import { router } from 'expo-router';
import React, { useState } from 'react';
import { generatePracticeAnagrams } from '../../src/anagrams/utils/generator';
import AnagramsPlayScreen from '../../src/anagrams/screens/AnagramsPlayScreen';

export default function AnagramsGameScreen() {
  const [puzzle, setPuzzle] = useState(() => generatePracticeAnagrams());
  const [key, setKey] = useState(0);

  return (
    <AnagramsPlayScreen
      key={key}
      puzzle={puzzle}
      mode="practice"
      onGoHome={() => router.back()}
      onPlayAgain={() => {
        setPuzzle(generatePracticeAnagrams());
        setKey((k) => k + 1);
      }}
    />
  );
}
