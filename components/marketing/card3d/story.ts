/* Timing shared by the phone story's section (PhoneStory.tsx) and its
   scene (phoneScene.ts). Import-free, so the page can use it without
   loading the 3D.

   The section is SECTION_SVH tall. The story itself (the tap, the turn, the
   profile, the note) plays over the first STORY_SVH of its scroll, as
   progress 0 to 1; the rest is a long, slow ending past 1 (up to
   STORY_END) in which the close-up on the note settles while the section
   is still pinned, so the note can be read for a good while. */
export const SECTION_SVH = 700;
const SCROLL_SVH = SECTION_SVH - 100; // the sticky stage is one screen tall
const STORY_SVH = 320;
export const STORY_SHARE = STORY_SVH / SCROLL_SVH;
export const STORY_END = 1 / STORY_SHARE;
