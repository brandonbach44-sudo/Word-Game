// src/hexhive/components/HexHiveCalendar.tsx
// Month calendar for the Stats tab — each day you played the daily puzzle
// is shaded by how far you got (rank reached that day), so you can look
// back and see exactly what you scored on any past day, not just your
// all-time best. Tap a day to see its details.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RANKS } from '../utils/scoring';
import type { DailyHistory, DailyHistoryEntry } from '../utils/storage';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface HexHiveCalendarProps {
  history: DailyHistory;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  cardColor: string;
  borderColor: string;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function HexHiveCalendar({
  history,
  accentColor,
  textColor,
  secondaryTextColor,
  cardColor,
  borderColor,
}: HexHiveCalendarProps) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCurrentMonth = viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth();

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const list: { dateISO: string | null; dayNum: number | null; entry: DailyHistoryEntry | null }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      list.push({ dateISO: null, dayNum: null, entry: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = toISODate(new Date(year, month, day));
      list.push({ dateISO, dayNum: day, entry: history[dateISO] ?? null });
    }
    return list;
  }, [viewMonth, history]);

  const selectedEntry = selectedDate ? history[selectedDate] : null;

  const fillFor = (entry: DailyHistoryEntry) => {
    const pct = Math.max(0, Math.min(1, entry.rankIndex / (RANKS.length - 1)));
    const opacity = 0.25 + pct * 0.75;
    return `${accentColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={styles.navButton}
        >
          <ChevronLeft size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: textColor }]}>{monthLabel(viewMonth)}</Text>
        <TouchableOpacity
          onPress={() => !isCurrentMonth && setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={styles.navButton}
          disabled={isCurrentMonth}
        >
          <ChevronRight size={20} color={isCurrentMonth ? borderColor : textColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={[styles.weekdayLabel, { color: secondaryTextColor }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (!cell.dateISO) return <View key={i} style={styles.cell} />;
          const isSelected = selectedDate === cell.dateISO;
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              activeOpacity={cell.entry ? 0.6 : 1}
              onPress={() => cell.entry && setSelectedDate(isSelected ? null : cell.dateISO)}
            >
              <View
                style={[
                  styles.cellInner,
                  cell.entry ? { backgroundColor: fillFor(cell.entry) } : null,
                  isSelected ? { borderWidth: 2, borderColor: textColor } : null,
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    { color: cell.entry ? '#ffffff' : secondaryTextColor },
                  ]}
                >
                  {cell.dayNum}
                </Text>
                {cell.entry?.fullyCleared && <Text style={styles.starBadge}>★</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedEntry && (
        <View style={[styles.detailCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.detailDate, { color: textColor }]}>
            {new Date(selectedEntry.dateISO + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailRank, { color: accentColor }]}>{selectedEntry.rankName}</Text>
            {selectedEntry.fullyCleared && <Text style={[styles.fullClearTag, { color: accentColor }]}>Full Clear ★</Text>}
          </View>
          <Text style={[styles.detailStats, { color: secondaryTextColor }]}>
            {selectedEntry.score} / {selectedEntry.maxScore} points · {selectedEntry.wordsFound} / {selectedEntry.totalWords} words
          </Text>
        </View>
      )}
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navButton: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellInner: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 13, fontWeight: '600' },
  starBadge: { position: 'absolute', top: -2, right: -2, fontSize: 10, color: '#ffffff' },
  detailCard: { marginTop: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  detailDate: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  detailRank: { fontSize: 16, fontWeight: '800' },
  fullClearTag: { fontSize: 12, fontWeight: '700' },
  detailStats: { fontSize: 13 },
});
