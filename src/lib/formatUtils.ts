/**
 * Helper utility functions for formatting and string manipulation.
 */

/**
 * Cleanly extracts the concise main sample/pack name without marketing tags or long subtitles.
 * E.g.: "Authentic Indian Sounds, Loops One Shots (Royalty Free) - Indian Sample Pack"
 *       -> "Authentic Indian Sounds"
 * E.g.: "South Drums - South Indian And Tapori One Shot Drum"
 *       -> "South Drums"
 * E.g.: "Punjab Rhythm – Authentic Punjab Folk Percussion"
 *       -> "Punjab Rhythm"
 * E.g.: "India Street Rhythm – 25 Free Indian Rhythm Loops | Folk, Street & Desi Percussion Samples"
 *       -> "India Street Rhythm"
 */
export function getShortSampleName(name?: string | null): string {
  if (!name) return ''
  // 1. Split on major section dividers: " - ", " – ", " — ", " | "
  let clean = name.split(/\s+[-–—|]\s+/)[0].trim()
  
  // 2. If it is still long and contains commas (e.g. "Authentic Indian Sounds, Loops One Shots..."), take the first phrase
  if (clean.length > 25 && clean.includes(',')) {
    clean = clean.split(',')[0].trim()
  }
  
  return clean || name.trim()
}
