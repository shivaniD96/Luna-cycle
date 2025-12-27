
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
  'Menstrual': 'bg-rose-400',
  'Follicular': 'bg-emerald-300',
  'Ovulation': 'bg-indigo-300',
  'Luteal': 'bg-amber-300',
};

export const PHASE_ICONS = {
  'Menstrual': '🌙',
  'Follicular': '🌱',
  'Ovulation': '☀️',
  'Luteal': '🍂',
};

export const PHASE_DESCRIPTIONS = {
  'Menstrual': "Your winter phase. A time for cozy blankets, warm teas, and deep rest.",
  'Follicular': "Spring! Estrogen is waking up your creativity and social spark.",
  'Ovulation': "Summer peak! You're glowing and vibrant. Confidence is at its max.",
  'Luteal': "Autumn vibes. Energy is turning inward. Prioritize comfort.",
};

export const PARTNER_PHASE_DESCRIPTIONS = {
  'Menstrual': "Their winter phase. Their energy is at its lowest—prioritize warmth, cozy environments, and extra rest.",
  'Follicular': "Their spring phase. Their creativity and social spark are returning. Great time for new plans.",
  'Ovulation': "Their summer peak! They are likely feeling vibrant and confident. High social energy phase.",
  'Luteal': "Their autumn phase. Energy is turning inward. They may need more patience, comfort, and low-stress nights.",
};
