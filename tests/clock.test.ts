import { describe, expect, it } from 'vitest';
import {
  CHECKED_TIMES,
  allTimes,
  buildPhraseFeedback,
  digitalTime,
  gamePool,
  hourProgress,
  isCheckedTime,
  normalizeTime,
  phraseChips,
  phraseChoices,
  phraseWords,
  pickTime,
  sameTime,
  shiftHours,
  shiftMinutes,
  spokenDigital,
  spokenTime,
  type ClockTime,
} from '../src/engine/clock';

const at = (hour: number, minute: number): ClockTime => ({ hour, minute });

/** A deterministic stand-in for Math.random, so a draw can be replayed. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('clock words', () => {
  it('names every full hour with the right form of «час»', () => {
    expect(spokenTime(at(7, 0))).toBe('семь часов');
    expect(spokenTime(at(1, 0))).toBe('один час');
    expect(spokenTime(at(2, 0))).toBe('два часа');
    expect(spokenTime(at(4, 0))).toBe('четыре часа');
    expect(spokenTime(at(5, 0))).toBe('пять часов');
    expect(spokenTime(at(12, 0))).toBe('двенадцать часов');
  });

  it('names minutes after the hour and the half-hour as the owner asked', () => {
    expect(spokenTime(at(4, 30))).toBe('половина пятого');
    expect(spokenTime(at(6, 15))).toBe('четверть седьмого');
    expect(spokenTime(at(7, 5))).toBe('пять минут восьмого');
    expect(spokenTime(at(8, 20))).toBe('двадцать минут девятого');
    expect(spokenTime(at(7, 25))).toBe('двадцать пять минут восьмого');
  });

  it('counts what is left before the whole hour', () => {
    expect(spokenTime(at(5, 55))).toBe('без пяти шесть');
    expect(spokenTime(at(7, 40))).toBe('без двадцати восемь');
    expect(spokenTime(at(7, 45))).toBe('без четверти восемь');
    expect(spokenTime(at(7, 50))).toBe('без десяти восемь');
    expect(spokenTime(at(7, 35))).toBe('без двадцати пяти восемь');
    // «без пяти час», not «без пяти один»: the next whole hour has its own form.
    expect(spokenTime(at(12, 55))).toBe('без пяти час');
    expect(spokenTime(at(12, 30))).toBe('половина первого');
  });

  it('shows the digital writing with a padded minute', () => {
    expect(digitalTime(at(7, 5))).toBe('7:05');
    expect(digitalTime(at(12, 0))).toBe('12:00');
  });

  it('counts what has passed and what is left before the next hour', () => {
    expect(hourProgress(at(7, 40))).toEqual({ passed: 40, remaining: 20 });
    expect(hourProgress(at(7, 25))).toEqual({ passed: 25, remaining: 35 });
    expect(hourProgress(at(7, 0))).toEqual({ passed: 0, remaining: 0 });
  });
});

describe('moving the hands', () => {
  it('wraps the hour when the minute hand passes twelve', () => {
    expect(shiftMinutes(at(7, 55), 5)).toEqual(at(8, 0));
    expect(shiftMinutes(at(8, 0), -5)).toEqual(at(7, 55));
    expect(shiftMinutes(at(12, 55), 5)).toEqual(at(1, 0));
    expect(shiftMinutes(at(1, 0), -5)).toEqual(at(12, 55));
  });

  it('cycles hours at twelve in both directions', () => {
    expect(shiftHours(at(12, 20), 1)).toEqual(at(1, 20));
    expect(shiftHours(at(1, 20), -1)).toEqual(at(12, 20));
    expect(normalizeTime(15, 65)).toEqual(at(4, 5));
    expect(normalizeTime(0, -5)).toEqual(at(11, 55));
  });

  it('refuses a minute that is not a five-minute position', () => {
    expect(() => normalizeTime(7, 7)).toThrow('шагом 5');
    expect(() => normalizeTime(7, 12.5)).toThrow();
  });
});

describe('games never show a checked answer', () => {
  it('keeps the seven checked moments out of the game pool', () => {
    const pool = gamePool();
    expect(pool).toHaveLength(144 - CHECKED_TIMES.length);
    for (const time of CHECKED_TIMES) expect(pool.some((item) => sameTime(item, time))).toBe(false);
    expect(allTimes()).toHaveLength(144);
  });

  it('draws a fresh time and never a checked one', () => {
    const random = seeded(7);
    let previous: ClockTime | null = null;
    for (let i = 0; i < 500; i += 1) {
      const time = pickTime(previous, random);
      expect(isCheckedTime(time)).toBe(false);
      expect(previous === null || !sameTime(previous, time)).toBe(true);
      previous = time;
    }
  });

  it('offers four wordings with exactly one right answer and no checked moment', () => {
    const random = seeded(11);
    for (const time of gamePool()) {
      for (let draw = 0; draw < 2; draw += 1) {
        const choices = phraseChoices(time, random);
        expect(choices).toHaveLength(4);
        expect(choices.filter((choice) => choice.correct)).toHaveLength(1);
        expect(new Set(choices.map((choice) => choice.label)).size).toBe(4);
        expect(choices.find((choice) => choice.correct)!.label).toBe(spokenTime(time));
        for (const choice of choices) expect(isCheckedTime(choice.at)).toBe(false);
      }
    }
  });

  it('names the rule behind a refused phrase without saying «неправильно»', () => {
    expect(buildPhraseFeedback(['двадцати'], at(7, 40))).toContain('Сначала «без»');
    expect(buildPhraseFeedback(['половина', 'шестого'], at(7, 30))).not.toBe('');
    expect(buildPhraseFeedback([], at(7, 40))).toBe('');
    for (const message of [
      buildPhraseFeedback(['двадцати'], at(7, 40)),
      buildPhraseFeedback(['пять'], at(7, 40)),
      buildPhraseFeedback(['пять', 'минут', 'семь'], at(7, 5)),
    ])
      expect(message.toLowerCase()).not.toContain('неправильно');
  });

  it('gives chips of the phrase plus one word that does not belong', () => {
    const random = seeded(3);
    for (const time of gamePool()) {
      const words = phraseWords(time);
      const chips = phraseChips(time, random);
      const real = chips.filter((chip) => !chip.decoy).map((chip) => chip.word);
      expect(real).toHaveLength(words.length);
      expect([...real].sort()).toEqual([...words].sort());
      const decoy = chips.find((chip) => chip.decoy);
      if (decoy) expect(words).not.toContain(decoy.word);
    }
    expect(phraseWords(at(7, 40))).toEqual(['без', 'двадцати', 'восемь']);
    expect(phraseWords(at(4, 30))).toEqual(['половина', 'пятого']);
    expect(phraseWords(at(7, 0))).toEqual(['семь', 'часов']);
  });

  it('adds a wrong hour word to an exact-hour phrase', () => {
    const chips = phraseChips(at(7, 0), seeded(5));
    const decoy = chips.find((chip) => chip.decoy);
    expect(decoy?.word).toBeTruthy();
    expect(decoy?.word).not.toBe('семь');
    expect(decoy?.word).not.toBe('часов');
  });

  it('reads the same moment straight off a phone', () => {
    expect(spokenDigital({ hour: 7, minute: 40 })).toBe('семь сорок');
    expect(spokenDigital({ hour: 8, minute: 5 })).toBe('восемь пять');
    expect(spokenDigital({ hour: 12, minute: 45 })).toBe('двенадцать сорок пять');
    expect(spokenDigital({ hour: 6, minute: 0 })).toBe('');
  });
});
