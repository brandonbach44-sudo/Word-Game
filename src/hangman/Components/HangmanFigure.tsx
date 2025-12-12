import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

type HangmanFigureProps = {
  incorrectGuesses:  number; // 0-6 incorrect guesses
  maxAttempts:  number;
  isWon?:  boolean;
  isLost?:  boolean;
};

export const HangmanFigure: React. FC<HangmanFigureProps> = ({
  incorrectGuesses,
  maxAttempts,
  isWon = false,
  isLost = false,
}) => {
  const { background } = useTheme();

  // Determine colors based on game state
  const getFigureColor = () => {
    if (isWon) return COLORS.accent;
    if (isLost) return COLORS.danger;
    return background.textColor;
  };

  const figureColor = getFigureColor();
  const gallowsColor = background.secondaryText;

  // Parts to show based on incorrect guesses
  const showHead = incorrectGuesses >= 1;
  const showBody = incorrectGuesses >= 2;
  const showLeftArm = incorrectGuesses >= 3;
  const showRightArm = incorrectGuesses >= 4;
  const showLeftLeg = incorrectGuesses >= 5;
  const showRightLeg = incorrectGuesses >= 6;

  // SVG dimensions
  const width = 200;
  const height = 240;

  // Gallows coordinates
  const gallows = {
    baseX1: 20,
    baseX2: 100,
    baseY:  220,
    postX: 40,
    postTopY: 20,
    beamX2: 130,
    beamY: 20,
    ropeX: 130,
    ropeY2: 50,
  };

  // Figure coordinates (hanging from rope)
  const figure = {
    headCenterX: 130,
    headCenterY:  70,
    headRadius: 20,
    neckY: 90,
    bodyY2: 140,
    armY: 105,
    armLength: 30,
    armAngle: 40,
    legY: 140,
    legLength: 35,
    legAngle: 30,
  };

  // Calculate arm endpoints
  const leftArmEnd = {
    x: figure.headCenterX - Math.sin((figure.armAngle * Math.PI) / 180) * figure.armLength,
    y: figure.armY + Math.cos((figure.armAngle * Math.PI) / 180) * figure.armLength,
  };

  const rightArmEnd = {
    x: figure.headCenterX + Math.sin((figure.armAngle * Math.PI) / 180) * figure.armLength,
    y: figure.armY + Math.cos((figure.armAngle * Math. PI) / 180) * figure.armLength,
  };

  // Calculate leg endpoints
  const leftLegEnd = {
    x: figure.headCenterX - Math.sin((figure.legAngle * Math.PI) / 180) * figure.legLength,
    y: figure.legY + Math.cos((figure. legAngle * Math.PI) / 180) * figure.legLength,
  };

  const rightLegEnd = {
    x: figure.headCenterX + Math.sin((figure.legAngle * Math.PI) / 180) * figure.legLength,
    y: figure.legY + Math.cos((figure. legAngle * Math.PI) / 180) * figure.legLength,
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* ===== GALLOWS ===== */}
        <G>
          {/* Base */}
          <Line
            x1={gallows.baseX1}
            y1={gallows.baseY}
            x2={gallows.baseX2}
            y2={gallows.baseY}
            stroke={gallowsColor}
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Vertical Post */}
          <Line
            x1={gallows.postX}
            y1={gallows.baseY}
            x2={gallows.postX}
            y2={gallows.postTopY}
            stroke={gallowsColor}
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Horizontal Beam */}
          <Line
            x1={gallows.postX}
            y1={gallows.beamY}
            x2={gallows.beamX2}
            y2={gallows. beamY}
            stroke={gallowsColor}
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Support Bracket (diagonal) */}
          <Line
            x1={gallows.postX}
            y1={gallows.postTopY + 40}
            x2={gallows.postX + 35}
            y2={gallows.beamY}
            stroke={gallowsColor}
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Rope */}
          <Line
            x1={gallows. ropeX}
            y1={gallows.beamY}
            x2={gallows.ropeX}
            y2={gallows.ropeY2}
            stroke={gallowsColor}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>

        {/* ===== HANGMAN FIGURE ===== */}
        <G>
          {/* Head */}
          {showHead && (
            <Circle
              cx={figure.headCenterX}
              cy={figure.headCenterY}
              r={figure.headRadius}
              stroke={figureColor}
              strokeWidth={4}
              fill="transparent"
            />
          )}

          {/* Body */}
          {showBody && (
            <Line
              x1={figure.headCenterX}
              y1={figure.neckY}
              x2={figure.headCenterX}
              y2={figure.bodyY2}
              stroke={figureColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* Left Arm */}
          {showLeftArm && (
            <Line
              x1={figure.headCenterX}
              y1={figure.armY}
              x2={leftArmEnd.x}
              y2={leftArmEnd. y}
              stroke={figureColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* Right Arm */}
          {showRightArm && (
            <Line
              x1={figure.headCenterX}
              y1={figure.armY}
              x2={rightArmEnd.x}
              y2={rightArmEnd.y}
              stroke={figureColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* Left Leg */}
          {showLeftLeg && (
            <Line
              x1={figure. headCenterX}
              y1={figure.legY}
              x2={leftLegEnd.x}
              y2={leftLegEnd.y}
              stroke={figureColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* Right Leg */}
          {showRightLeg && (
            <Line
              x1={figure.headCenterX}
              y1={figure.legY}
              x2={rightLegEnd.x}
              y2={rightLegEnd. y}
              stroke={figureColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default HangmanFigure;