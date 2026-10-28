import '@tanstack/react-start/server-only'
import { DOMParser } from 'linkedom'

/**
 * HTML parsing for server code, where Workers have no DOMParser. linkedom
 * needs a full document, so fragments are wrapped in one.
 */
export function parseHtmlOnServer(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head></head><body>${html}</body></html>`, 'text/html') as unknown as Document
}
