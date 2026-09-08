/* ---------------------------------------------------------------------------
   The two Overview illustrations, drawn inline.

   Inline SVG rather than image files: the app ships no raster assets, these
   have to sit on the palette they are placed against, and they stay crisp at
   any size. Both are decorative - the copy beside them carries the meaning -
   so they are aria-hidden and add nothing to the accessibility tree.

   Geometry is laid out against the reference design's own coordinates, with
   each viewBox cropped to the artwork's real extents so nothing is scaled
   down by empty margin. These are hand-authored approximations of that
   design's artwork; if the original vector files are added to the repo, each
   component below becomes a single <img> and the match becomes exact.

   Type inside an <svg> does not inherit font-family from the page, so it is
   named explicitly.
   --------------------------------------------------------------------------- */

const FONT = "'Source Sans 3', ui-sans-serif, system-ui, sans-serif";

/* Palette, named so a change lands once. Warm tones are the hero's ground;
   the figure and props use the app's blues and greens. */
const C = {
  groundDeep: '#F2E0C6',
  groundSoft: '#FAEEDE',
  desk: '#EFD9BB',
  deskEdge: '#E3C79F',
  shirt: '#1F60A9',
  shirtDark: '#174B85',
  skin: '#EAB690',
  skinDark: '#D89E75',
  hair: '#2A2521',
  chair: '#D6DCE5',
  metal: '#C6CFDB',
  metalLight: '#DFE5EC',
  screen: '#EEF2F7',
  leaf: '#3F8E52',
  leafDark: '#2F6E3F',
  pot: '#22304F',
  mug: '#F0B429',
  plane: '#F5B93F',
  planeFold: '#DC9E23',
  ink: '#1B2559',
} as const;

/** Person at a desk, with the three things the hub offers stacked beside
 *  them. Sits on warm-50. */
export const SearchHeroArt = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 555 295"
    className={className}
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ground: two soft discs, then the desk band across the base. */}
    <circle cx="238" cy="150" r="146" fill={C.groundSoft} />
    <circle cx="430" cy="120" r="98" fill={C.groundSoft} />
    <ellipse cx="270" cy="284" rx="250" ry="20" fill={C.groundDeep} opacity=".5" />
    <rect x="0" y="278" width="548" height="14" rx="4" fill={C.desk} />
    <rect x="0" y="278" width="548" height="4" rx="2" fill={C.deskEdge} />

    {/* Plant, behind the desk line. */}
    <path d="M462 278 h56 l-9 -52 h-38 Z" fill={C.pot} />
    <path d="M471 232 h38 l-2 -12 h-34 Z" fill="#2E3F63" />
    <path
      d="M490 222 C490 176 470 146 440 126 C452 172 466 200 490 222 Z"
      fill={C.leafDark}
    />
    <path
      d="M490 222 C490 170 512 140 545 120 C528 168 512 196 490 222 Z"
      fill={C.leaf}
    />
    <path
      d="M490 224 C490 186 494 156 502 132"
      stroke="#24512F"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />

    {/* Chair back behind the figure. */}
    <rect x="146" y="168" width="74" height="112" rx="18" fill={C.chair} />
    <rect x="176" y="240" width="14" height="42" rx="5" fill="#C3CAD4" />

    {/* Figure: torso, both arms forward, head, hair. */}
    <path
      d="M172 280 C172 214 190 174 224 174 C258 174 276 214 276 280 Z"
      fill={C.shirt}
    />
    {/* Near arm along the desk, and the far arm behind the laptop. */}
    <path
      d="M262 206 C292 218 300 244 286 262"
      stroke={C.shirtDark}
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M188 208 C208 232 232 250 258 258"
      stroke={C.shirt}
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="272" cy="262" r="11" fill={C.skin} />
    <circle cx="288" cy="258" r="10" fill={C.skinDark} />

    <path d="M212 146 h24 v22 h-24 Z" fill={C.skinDark} />
    <circle cx="224" cy="120" r="29" fill={C.skin} />
    {/* Curly hair: a cap plus three curls along the crown. */}
    <path
      d="M195 118 C193 92 208 78 226 78 C246 78 259 92 258 112 C250 102 236 98 222 101 C209 104 199 110 195 118 Z"
      fill={C.hair}
    />
    <circle cx="204" cy="98" r="10" fill={C.hair} />
    <circle cx="224" cy="86" r="11" fill={C.hair} />
    <circle cx="246" cy="97" r="10" fill={C.hair} />
    <path d="M252 116 C258 120 258 130 252 134" stroke={C.skinDark} strokeWidth="3" fill="none" />

    {/* Laptop, lid angled away so its back faces us. */}
    <path d="M214 276 L226 214 L332 214 L344 276 Z" fill={C.metal} />
    <path d="M232 220 L222 270 h114 l-10 -50 Z" fill={C.metalLight} />
    <rect x="206" y="274" width="146" height="8" rx="4" fill="#B6C0CE" />

    {/* Mug and its steam. */}
    <rect x="62" y="248" width="34" height="30" rx="5" fill={C.mug} />
    <path d="M96 255 h9 a7 7 0 0 1 0 14 h-9 Z" fill={C.mug} />
    <rect x="62" y="248" width="34" height="6" rx="3" fill="#D99A18" />
    <path d="M72 238 c5 -8 -5 -13 0 -21" stroke="#D9C7AF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M84 238 c5 -8 -5 -13 0 -21" stroke="#D9C7AF" strokeWidth="2.5" strokeLinecap="round" fill="none" />

    {/* The three things on offer. Offset so the stack reads as a stack. */}
    <g>
      <rect x="338" y="204" width="98" height="26" rx="7" fill="#FFFFFF" stroke="#90B3D5" strokeWidth="1.5" />
      <text x="352" y="221" fontFamily={FONT} fontSize="12.5" fontWeight="600" fill="#093F74">Features</text>
      <rect x="344" y="234" width="98" height="26" rx="7" fill="#FFFFFF" stroke="#A3CBA5" strokeWidth="1.5" />
      <text x="358" y="251" fontFamily={FONT} fontSize="12.5" fontWeight="600" fill="#1F4E21">Guides</text>
      <rect x="332" y="264" width="106" height="26" rx="7" fill="#FFFFFF" stroke="#F1A4A4" strokeWidth="1.5" />
      <text x="346" y="281" fontFamily={FONT} fontSize="12.5" fontWeight="600" fill="#7B2020">What&apos;s New</text>
    </g>

    {/* Speech bubble, over the disc behind it. */}
    <rect x="52" y="43" width="140" height="98" rx="22" fill="#FFFFFF" />
    <path d="M78 138 L86 164 L104 139 Z" fill="#FFFFFF" />
    <text x="72" y="76" fontFamily={FONT} fontSize="19" fill={C.ink}>Find.</text>
    <text x="72" y="102" fontFamily={FONT} fontSize="19" fill={C.ink}>Learn.</text>
    <text x="72" y="128" fontFamily={FONT} fontSize="19" fill={C.ink}>Do more.</text>

    {/* Paper plane and the trail it came in on. */}
    <path
      d="M232 78 C286 62 350 48 404 42"
      stroke="#C9B294"
      strokeWidth="2.5"
      strokeDasharray="6 9"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M410 12 L462 40 L414 54 Z" fill={C.plane} />
    <path d="M410 12 L414 54 L399 42 Z" fill={C.planeFold} />
  </svg>
);

/** An opened box with sparkles - the release, arriving. Sits on lilac-50. */
export const ReleaseGiftArt = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 236 196"
    className={className}
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* The soft rise the box sits on. */}
    <path
      d="M8 176 C46 150 74 168 112 150 C150 132 186 156 228 140 V186 H8 Z"
      fill="#DCD0F6"
      opacity=".55"
    />
    <ellipse cx="120" cy="176" rx="82" ry="13" fill="#D0C1F2" opacity=".7" />

    {/* Sparkles: one large four-point star, then smaller company. */}
    <path d="M120 46 l9 26 26 9 -26 9 -9 26 -9 -26 -26 -9 26 -9 Z" fill="#F5B93F" />
    <path d="M52 62 l5 15 15 5 -15 5 -5 15 -5 -15 -15 -5 15 -5 Z" fill="#BC3AD2" opacity=".8" />
    <path d="M186 40 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4 Z" fill="#5D90C1" />
    <path d="M176 96 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 Z" fill="#BC3AD2" opacity=".55" />
    <circle cx="34" cy="104" r="4.5" fill="#90B3D5" />
    <circle cx="204" cy="118" r="5" fill="#EDC7F4" />
    <circle cx="86" cy="26" r="4" fill="#BC3AD2" opacity=".5" />
    <circle cx="148" cy="18" r="3" fill="#5D90C1" opacity=".7" />

    {/* Box: front face, side face in shadow, then the lid tilted off it. */}
    <path d="M66 112 h108 v56 a5 5 0 0 1 -5 5 H71 a5 5 0 0 1 -5 -5 Z" fill="#0C5194" />
    <path d="M120 112 h54 v56 a5 5 0 0 1 -5 5 h-49 Z" fill="#08386A" />
    <rect x="110" y="112" width="20" height="61" fill="#3D7AB5" />
    <g transform="rotate(-7 120 104)">
      <path d="M56 92 h128 a5 5 0 0 1 5 5 v16 H51 V97 a5 5 0 0 1 5 -5 Z" fill="#3D7AB5" />
      <rect x="110" y="92" width="20" height="21" fill="#6E9DCA" />
      <path d="M51 108 h138 v5 H51 Z" fill="#2E639C" />
    </g>
  </svg>
);
