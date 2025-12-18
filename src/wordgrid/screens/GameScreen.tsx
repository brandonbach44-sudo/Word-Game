// src/wordgrid/screens/GameScreen.tsx
import React, { useState } from 'react';
import { Button, View } from 'react-native';
import GridWithGesture from '../components/GridWithGesture';
import Scoreboard from '../components/Scoreboard';
import WordList from '../components/WordList';
import { generateGrid } from '../utils/gridGenerator';
import { Position } from '../utils/pathFinder';

export default function GameScreen() {
  const [score, setScore] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<string[][]>(generateGrid(4));

  const handleWordSubmit = (word: string) => {
    // simple scoring placeholder
    const wordScore = word.length * 100;
    setScore(prev => prev + wordScore);
    setWords(prev => [...prev, word]);
  };

  const handlePathComplete = (path: Position[]) => {
    if (path.length === 0) return { success: false };

    const word = path.map(p => grid[p.row][p.col]).join('');
    // TODO: validate against dictionary here
    handleWordSubmit(word);
    return { success: true };
  };

  return (
    <View style={{ flex: 1 }}>
      <Scoreboard score={score} />
      <GridWithGesture grid={grid} onPathComplete={handlePathComplete} />
      <WordList words={words} />
      <Button title="New Grid" onPress={() => setGrid(generateGrid(4))} />
    </View>
  );
}
