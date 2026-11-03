// Sélection des éléments à écouter (fonction pure).
export const SOURCES = [
  ['vocab', 'Vocabulaire'],
  ['irregular', 'Verbes irréguliers'],
  ['regular', 'Verbes réguliers'],
  ['expressions', 'Expressions'],
  ['grammar', 'Grammaire'],
  ['mix', 'Mélange de tout'],
];

const grammarItems = (c) => (c.grammar || []).map((g) => ({ ...g, type: 'grammar', topic: 'grammar' }));

function raw(content, source) {
  switch (source) {
    case 'vocab': return content.vocab;
    case 'irregular': return content.verbs.filter((v) => v.type === 'irregular');
    case 'regular': return content.verbs.filter((v) => v.type === 'regular');
    case 'expressions': return content.expressions;
    case 'grammar': return grammarItems(content);
    default: return [...content.vocab, ...content.verbs, ...content.expressions, ...grammarItems(content)];
  }
}

export function buildPool(content, source, { topic = 'all', level = 'all' } = {}) {
  return raw(content, source).filter((e) =>
    (topic === 'all' || e.topic === topic) && (level === 'all' || e.level === level));
}
