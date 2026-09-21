// Existing app colors retain their names and values. Presence extends this palette.
export const C = {
  ink: "#102249",
  muted: "#667797",
  blue: "#235AFF",
  line: "#E2E9F5",
  bg: "#F5F8FE",
  green: "#13845B",
};
export const presence = {
  color: {
    ...C,
    paper: "#FFFFFF",
    turquoise: "#087F8C",
    mist: "#DDEFF0",
    champagne: "#EBDCC2",
    champagneInk: "#79603C",
    body: "#425471",
    error: "#9D2838",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { card: 18, small: 12, pill: 999 },
  type: {
    title: 40,
    titleLine: 44,
    body: 16,
    bodyLine: 24,
    label: 16,
    caption: 12,
  },
  shadow: {
    shadowColor: C.ink,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  motion: {
    entrance: 380,
    stagger: 65,
    travel: 16,
    pressScale: 0.98,
    columns: [26000, 32000, 29000] as const,
    tilt: -10,
  },
} as const;
