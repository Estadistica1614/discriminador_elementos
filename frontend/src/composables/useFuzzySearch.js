import { ref, computed } from 'vue';
import Fuse from 'fuse.js';

export function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function useFuzzySearch(elementsSourceRef) {
  const fuseInstance = computed(() => {
    const list = elementsSourceRef.value || [];
    
    return new Fuse(list, {
      keys: [
        { name: 'subtipo', weight: 0.7 },
        { name: 'tipo', weight: 0.2 },
        { name: 'incautacion', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
      shouldSort: true,
    });
  });

  const search = (query, limit = 8) => {
    if (!query || query.trim().length < 1) {
      return [];
    }
    const cleanQuery = query.trim();
    const results = fuseInstance.value.search(cleanQuery);
    return results.slice(0, limit).map(res => ({
      item: res.item,
      score: res.score,
      refIndex: res.refIndex
    }));
  };

  const findExactOrClose = (query) => {
    if (!query) return null;
    const normalizedQuery = normalizeText(query);
    const list = elementsSourceRef.value || [];

    // 1. Coincidencia exacta estricta
    const exact = list.find(el => normalizeText(el.subtipo) === normalizedQuery);
    if (exact) return { item: exact, exactMatch: true };

    // 2. Coincidencia difusa muy alta
    const results = fuseInstance.value.search(query.trim());
    if (results.length > 0 && results[0].score <= 0.15) {
      return { item: results[0].item, exactMatch: false, closeMatch: true };
    }

    return null;
  };

  return {
    search,
    findExactOrClose,
  };
}
