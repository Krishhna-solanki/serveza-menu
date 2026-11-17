const MENU_BASE_URL = "https://serveza-menu.netlify.app";

export const getMenuUrl = (slug: string): string =>
  `${MENU_BASE_URL}/menu/${encodeURIComponent(slug)}`;