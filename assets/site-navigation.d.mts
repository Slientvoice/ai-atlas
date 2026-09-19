export const pages: string[][];
export function navigationContents(current: string, base?: string): string;
export function initializeNavigation(element: HTMLElement | null): () => void;
export function isAtlasURL(value: string, homeURL: string): boolean;
