
import React from 'react';

export const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '✨' },
  { id: 'calm', label: 'Calm', emoji: '☁️' },
  { id: 'irritable', label: 'Irritable', emoji: '🔥' },
  { id: 'sad', label: 'Sad', emoji: '🌧️' },
  { id: 'anxious', label: 'Anxious', emoji: '🌀' },
  { id: 'tired', label: 'Tired', emoji: '💤' },
];

export const SYMPTOMS = [
  'Cramps', 'Bloating', 'Acne', 'Headache', 'Backache', 'Tender Breasts', 'Cravings'
];

export const PHASE_COLORS = {
  [ 'Menstrual' ]: 'bg-rose-400',
  [ 'Follicular' ]: 'bg-emerald-300',
  [ 'Ovulation' ]: 'bg-indigo-300',
  [ 'Luteal' ]: 'bg-amber-300',
};

export const PHASE_ICONS = {
  [ 'Menstrual' ]: '🌙',
  [ 'Follicular' ]: '🌱',
  [ 'Ovulation' ]: '☀️',
  [ 'Luteal' ]: '🍂',
};

export const PHASE_DESCRIPTIONS = {
  [ 'Menstrual' ]: "Your winter phase. A time for cozy blankets, warm teas, and deep rest. Listen to your body's whisper.",
  [ 'Follicular' ]: "Spring has arrived! Estrogen is waking up your creativity and social spark. Time to start something new.",
  [ 'Ovulation' ]: "Summer peak! You're glowing and vibrant. Your confidence is at its max—shine bright today.",
  [ 'Luteal' ]: "Autumn vibes. Energy is turning inward. Slow down, prioritize comfort, and enjoy your own company.",
};
