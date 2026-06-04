// app/wordsearch/game.tsx

import { useLocalSearchParams } from 'expo-router';
// Update the import path below to the correct location of PlayScreen
// For example, if PlayScreen is in app/wordsearch/PlayScreen.tsx:
import PlayScreen from '../../src/wordsearch/PlayScreen';
// Or, if it's in app/components/PlayScreen.tsx:
// import PlayScreen from '../components/PlayScreen';

export default function WordSearchGameRoute() {
  const params = useLocalSearchParams();

  const themeId = params.themeId as string | undefined;
  const difficulty = params.difficulty as string | undefined;
  const puzzleData = params.puzzleData as string | undefined;

  if (!themeId || !difficulty || !puzzleData) {
    return null; // or show error
  }

  const puzzle = JSON.parse(puzzleData as string);

  return (
    <PlayScreen 
      themeId={themeId as any} 
      difficulty={difficulty} 
      puzzleData={puzzle} 
    />
  );
}
