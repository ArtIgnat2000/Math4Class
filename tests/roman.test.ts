import { describe, expect, it } from 'vitest';
import {
  BUILD_TARGETS,
  CLOCK_NUMBERS,
  ROMAN_MAX,
  ROMAN_NUMBERS,
  appendSign,
  romanCalculation,
  romanIssue,
  romanIssueText,
  romanSigns,
  romanValue,
  shuffledTargets,
  toRoman,
} from '../src/engine/roman';

describe('roman numerals I–XX', () => {
  it('writes every number of the lesson and reads it back', () => {
    expect(ROMAN_NUMBERS).toHaveLength(ROMAN_MAX);
    for (const { value, record } of ROMAN_NUMBERS) {
      expect(toRoman(value)).toBe(record);
      expect(romanValue(record)).toBe(value);
      expect(romanIssue(record)).toBeNull();
    }
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(14)).toBe('XIV');
    expect(toRoman(19)).toBe('XIX');
    expect(toRoman(20)).toBe('XX');
  });

  it('refuses numbers outside the agreed range instead of inventing signs', () => {
    for (const value of [0, -1, 21, 50, 1.5]) {
      expect(toRoman(value)).toBeNull();
    }
    expect(romanValue('L')).toBeNull();
    expect(romanIssue(' XXI')).toBe('range');
    expect(romanIssue('')).toBe('empty');
    expect(romanIssue('A')).toBe('unknown');
  });

  it('subtracts a smaller sign on the left and adds it on the right', () => {
    expect(romanValue('VI')).toBe(6);
    expect(romanValue('IV')).toBe(4);
    expect(romanValue('XI')).toBe(11);
    expect(romanValue('IX')).toBe(9);
    expect(romanValue('XIX')).toBe(19);
  });

  it('explains addition and subtraction without claiming an invalid record has a value', () => {
    expect(romanCalculation('XVI')).toBe('10 + 5 + 1');
    expect(romanCalculation('XIV')).toBe('10 + (5 − 1)');
    expect(romanCalculation('IX')).toBe('(10 − 1)');
    expect(romanCalculation('IIV')).toBeNull();
    expect(romanCalculation('')).toBeNull();
  });

  it('explains why a record is wrong instead of just rejecting it', () => {
    expect(romanIssue('IIII')).toBe('order');
    expect(romanIssueText('order', 'IIII')).toContain('IV — это 4');
    expect(romanIssueText('order', 'VV')).toContain('Замени VV на X');
    expect(romanIssueText('order', 'IIIII')).toContain('Четыре I подряд');
    expect(romanIssueText('order', 'IIV')).toContain('короче');
    expect(romanIssueText('empty')).toContain('Добавь знак');
  });

  it('keeps the record canonical when a child adds a sign', () => {
    let record = '';
    for (const sign of ['X', 'I', 'V'] as const) {
      const step = appendSign(record, sign);
      if (!step.issue) record = step.record;
    }
    // Appending I before V is exactly how a child discovers the subtractive pair.
    expect(record).toBe('XIV');
    expect(romanValue(record)).toBe(14);
    const four = appendSign('III', 'I');
    expect(four.record).toBe('III');
    expect(four.issue).toBe('order');
    expect(four.message).toContain('IV');
    expect(appendSign('X', 'X')).toMatchObject({ record: 'XX', value: 20, issue: null });
    expect(appendSign('XX', 'X').issue).toBe('range');
    expect(appendSign('I', 'V')).toMatchObject({ record: 'IV', value: 4 });
  });

  it('splits a record into the signs a child places', () => {
    expect(romanSigns('XIV')).toEqual(['X', 'I', 'V']);
    expect(romanSigns('XVIII')).toEqual(['X', 'V', 'I', 'I', 'I']);
  });

  it('offers a dial of twelve and a teaching sequence for the builder', () => {
    expect(CLOCK_NUMBERS.map((item) => item.record)).toEqual([
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ]);
    for (const value of BUILD_TARGETS) expect(toRoman(value)).not.toBeNull();
    expect(new Set(BUILD_TARGETS).size).toBe(BUILD_TARGETS.length);
    expect(BUILD_TARGETS).toContain(4);
    expect(BUILD_TARGETS).toContain(9);
    expect(BUILD_TARGETS).toContain(19);
  });

  it('shuffles the dial without dealing an already solved order', () => {
    const order = shuffledTargets(() => 0.5);
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(order).not.toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    expect(shuffledTargets(() => 0)).not.toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });
});
