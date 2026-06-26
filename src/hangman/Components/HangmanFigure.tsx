import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { FigureSkinId, GallowsSkinId } from '../cosmetics/types';
import { GALLOWS_SKINS } from '../cosmetics/skins';

type HangmanFigureProps = {
  incorrectGuesses: number;
  maxAttempts: number;
  isWon?: boolean;
  isLost?: boolean;
  figureSkin?: FigureSkinId;
  gallowsSkin?: GallowsSkinId;
};

const W = 200;
const H = 240;

// ─── SVG gallows placeholder ──────────────────────────────────────────────────

function renderSvgGallows(color: string, strokeWidth: number, skinId: GallowsSkinId) {
  const g = {
    baseX1: 20, baseX2: 100, baseY: 220,
    postX: 40, postTopY: 20,
    beamX2: 130, beamY: 20,
    ropeX: 130, ropeY2: 50,
  };

  const sw = strokeWidth;
  const isNeon = skinId === 'neon';

  return (
    <G>
      <Line x1={g.baseX1} y1={g.baseY} x2={g.baseX2} y2={g.baseY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={g.postX} y1={g.baseY} x2={g.postX} y2={g.postTopY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={g.postX} y1={g.beamY} x2={g.beamX2} y2={g.beamY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={g.postX} y1={g.postTopY + 40} x2={g.postX + 35} y2={g.beamY} stroke={color} strokeWidth={sw - 2 > 0 ? sw - 2 : 1} strokeLinecap="round" />
      <Line x1={g.ropeX} y1={g.beamY} x2={g.ropeX} y2={g.ropeY2} stroke={color} strokeWidth={3} strokeLinecap="round" />
      {/* Neon joint dots */}
      {isNeon && (
        <G>
          <Circle cx={g.postX} cy={g.beamY} r={4} fill={color} />
          <Circle cx={g.beamX2} cy={g.beamY} r={4} fill={color} />
          <Circle cx={g.postX} cy={g.baseY} r={4} fill={color} />
        </G>
      )}
    </G>
  );
}

// ─── Classic stick figure ─────────────────────────────────────────────────────

function renderFigure(
  color: string,
  incorrectGuesses: number,
  hx = 130,
  hy = 70,
  ropeColor?: string,
  ropeTopY?: number,
) {
  const armAngle = 40;
  const legAngle = 30;
  const armLength = 30;
  const legLength = 35;
  const hr = 20;
  const neckY = hy + hr, bodyY2 = neckY + 50;
  const armY = hy + hr + 15, legY = bodyY2;

  const lAx = hx - Math.sin((armAngle * Math.PI) / 180) * armLength;
  const lAy = armY + Math.cos((armAngle * Math.PI) / 180) * armLength;
  const rAx = hx + Math.sin((armAngle * Math.PI) / 180) * armLength;
  const rAy = lAy;
  const lLx = hx - Math.sin((legAngle * Math.PI) / 180) * legLength;
  const lLy = legY + Math.cos((legAngle * Math.PI) / 180) * legLength;
  const rLx = hx + Math.sin((legAngle * Math.PI) / 180) * legLength;
  const rLy = lLy;

  return (
    <G>
      {/* Rope line — only drawn for PNG skins where the PNG has no noose */}
      {ropeTopY !== undefined && (
        <Line x1={hx} y1={ropeTopY} x2={hx} y2={hy - hr} stroke={ropeColor ?? color} strokeWidth={3} strokeLinecap="round" />
      )}
      {incorrectGuesses >= 1 && <Circle cx={hx} cy={hy} r={hr} stroke={color} strokeWidth={4} fill="transparent" />}
      {incorrectGuesses >= 2 && <Line x1={hx} y1={neckY} x2={hx} y2={bodyY2} stroke={color} strokeWidth={4} strokeLinecap="round" />}
      {incorrectGuesses >= 3 && <Line x1={hx} y1={armY} x2={lAx} y2={lAy} stroke={color} strokeWidth={4} strokeLinecap="round" />}
      {incorrectGuesses >= 4 && <Line x1={hx} y1={armY} x2={rAx} y2={rAy} stroke={color} strokeWidth={4} strokeLinecap="round" />}
      {incorrectGuesses >= 5 && <Line x1={hx} y1={legY} x2={lLx} y2={lLy} stroke={color} strokeWidth={4} strokeLinecap="round" />}
      {incorrectGuesses >= 6 && <Line x1={hx} y1={legY} x2={rLx} y2={rLy} stroke={color} strokeWidth={4} strokeLinecap="round" />}
    </G>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const HangmanFigure: React.FC<HangmanFigureProps> = ({
  incorrectGuesses,
  maxAttempts,
  isWon = false,
  isLost = false,
  figureSkin = 'classic',
  gallowsSkin = 'classic',
}) => {
  const { background } = useTheme();

  const figureColor = isWon
    ? COLORS.accent
    : isLost
    ? COLORS.danger
    : background.textColor;

  const skin = GALLOWS_SKINS.find(s => s.id === gallowsSkin) ?? GALLOWS_SKINS[0];
  const gallowsColor = skin.color || background.secondaryText;

  return (
    <View style={styles.container}>
      {skin.image ? (
        // PNG gallows — render as image behind SVG figure
        // backgroundColor matches app bg to hide any baked-in image background
        <View style={[styles.pngContainer, { backgroundColor: background.backgroundColor }]}>
          <Image
            source={skin.image}
            style={styles.gallowsImage}
            resizeMode="contain"
          />
          <Svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={StyleSheet.absoluteFill}
          >
            {renderFigure(figureColor, incorrectGuesses, skin.headX ?? 130, skin.headY ?? 90, gallowsColor, skin.ropeTopY)}
          </Svg>
        </View>
      ) : (
        // SVG placeholder gallows + figure
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {renderSvgGallows(gallowsColor, skin.strokeWidth, gallowsSkin)}
          {renderFigure(figureColor, incorrectGuesses)}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pngContainer: {
    width: W,
    height: H,
    position: 'relative',
  },
  gallowsImage: {
    width: W,
    height: H,
  },
});

export default HangmanFigure;
