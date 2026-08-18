// src/shared/DailyCalendar.tsx
// Generic month calendar for Stats screens — shows a coloured dot/cell
// for every day the player completed a daily challenge.
// Green = won, Red = lost, Amber = played/partial.
// Tap any played day to see a detail card.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export type CalendarEntry = {
  result: 'won' | 'lost' | 'played'; // played = participated but no clear win/loss
  detail?: string; // e.g. "3/5 steps", "4 guesses", "7/10 words"
};

export type CalendarHistory = Record<string, CalendarEntry>; // keyed by YYYY-MM-DD

interface DailyCalendarProps {
  history: CalendarHistory;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  cardColor: string;
  borderColor: string;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const RESULT_COLOR: Record<CalendarEntry['result'], string> = {
  won:    '#4CAF50', // green
  lost:   '#EF5350', // red
  played: '#FFA726', // amber
};
const RESULT_LABEL: Record<CalendarEntry['result'], string> = {
  won:    '✓ Won',
  lost:   '✗ Lost',
  played: '○ Played',
};

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyCalendar({
  history, accentColor, textColor, secondaryTextColor, cardColor, borderColor,
}: DailyCalendarProps) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCurrentMonth =
    viewMonth.getFullYear() === now.getFullYear() &&
    viewMonth.getMonth() === now.getMonth();

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = new Date(year, month, 1).getDay();
    const list: { dateISO: string | null; dayNum: number | null; entry: CalendarEntry | null }[] = [];
    for (let i = 0; i < startWeekday; i++) list.push({ dateISO: null, dayNum: null, entry: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = toISODate(new Date(year, month, day));
      list.push({ dateISO, dayNum: day, entry: history[dateISO] ?? null });
    }
    return list;
  }, [viewMonth, history]);

  const selectedEntry = selectedDate ? history[selectedDate] : null;

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={styles.navBtn}
        >
          <ChevronLeft size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: textColor }]}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={() => !isCurrentMonth && setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={styles.navBtn}
          disabled={isCurrentMonth}
        >
          <ChevronRight size={20} color={isCurrentMonth ? borderColor : textColor} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.weekdayLabel, { color: secondaryTextColor }]}>{l}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (!cell.dateISO) return <View key={i} style={styles.cell} />;
          const isSelected = selectedDate === cell.dateISO;
          const color = cell.entry ? RESULT_COLOR[cell.entry.result] : null;
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              activeOpacity={cell.entry ? 0.6 : 1}
              onPress={() => cell.entry && setSelectedDate(isSelected ? null : cell.dateISO)}
            >
              <View style={[
                styles.cellInner,
                color ? { backgroundColor: color + 'CC' } : null,
                isSelected ? { borderWidth: 2, borderColor: textColor } : null,
              ]}>
                <Text style={[styles.cellText, { color: cell.entry ? '#fff' : secondaryTextColor }]}>
                  {cell.dayNum}
                </Text>
                {cell.entry?.result === 'won' && <Text style={styles.starBadge}>★</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Detail card for tapped day */}
      {selectedEntry && selectedDate && (
        <View style={[styles.detailCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.detailDate, { color: textColor }]}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </Text>
          <Text style={[styles.detailResult, { color: RESULT_COLOR[selectedEntry.result] }]}>
            {RESULT_LABEL[selectedEntry.result]}
          </Text>
          {selectedEntry.detail ? (
            <Text style={[styles.detailStats, { color: secondaryTextColor }]}>{selectedEntry.detail}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container:    { width: '100%' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn:       { padding: 8 },
  monthLabel:   { fontSize: 16, fontWeight: '700' },
  weekdayRow:   { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  cell:         { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellInner:    { width: CELL_SIZE, height: CELL_SIZE, maxWidth: '100%', maxHeight: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cellText:     { fontSize: 13, fontWeight: '600' },
  starBadge:    { position: 'absolute', top: -2, right: -2, fontSize: 10, color: '#fff' },
  detailCard:   { marginTop: 14, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  detailDate:   { fontSize: 14, fontWeight: '700' },
  detailResult: { fontSize: 16, fontWeight: '800' },
  detailStats:  { fontSize: 13 },
});
