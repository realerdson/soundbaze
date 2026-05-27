// Lucide icon set, inlined as React components.
// All icons use currentColor and 1.5px stroke per the SoundBaze iconography rules.

const I = (path) => (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
    className={props.className}
  >
    {path}
  </svg>
);

const Icon = {
  Music: I(<><path d="m9 18 12-3V3l-12 3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></>),
  Search: I(<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>),
  Bookmark: I(<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>),
  Heart: I(<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>),
  Message: I(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>),
  Edit: I(<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>),
  Play: I(<polygon points="5 3 19 12 5 21 5 3"/>),
  Pause: I(<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>),
  Clock: I(<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></>),
  User: I(<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 16 0v1"/></>),
  ArrowRight: I(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),
  ArrowUp: I(<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>),
  ChevronDown: I(<path d="m6 9 6 6 6-6"/>),
  Plus: I(<><path d="M12 5v14"/><path d="M5 12h14"/></>),
  More: I(<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>),
  Disc: I(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></>),
  X: I(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>),
  Share: I(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/></>),
  Sparkle: I(<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>),
  Mic: I(<><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><path d="M12 19v3"/></>),
  Book: I(<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/>),
};

window.Icon = Icon;
