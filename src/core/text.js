"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.tokenize = tokenize;
exports.levenshtein = levenshtein;
exports.fuzzyIncludes = fuzzyIncludes;
exports.containsAnyFuzzy = containsAnyFuzzy;
exports.hasNegationBefore = hasNegationBefore;
function normalizeText(s) {
    if (s == null)
        return '';
    return String(s).toLowerCase().replace(/[\u2018\u2019\u201C\u201D]/g, "'").replace(/[\p{P}$+<>=^`|~]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(s) {
    return normalizeText(s).split(/\s+/).filter(Boolean);
}
function levenshtein(a, b) {
    if (a === b)
        return 0;
    const al = a.length, bl = b.length;
    if (al === 0)
        return bl;
    if (bl === 0)
        return al;
    const v0 = new Array(bl + 1).fill(0);
    const v1 = new Array(bl + 1).fill(0);
    for (let j = 0; j <= bl; j++)
        v0[j] = j;
    for (let i = 0; i < al; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < bl; j++) {
            const cost = a[i] === b[j] ? 0 : 1;
            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        }
        for (let j = 0; j <= bl; j++)
            v0[j] = v1[j];
    }
    return v1[bl];
}
function fuzzyIncludes(text, phrase, maxDistance) {
    // normalize both
    const nt = normalizeText(text);
    const np = normalizeText(phrase);
    if (!np)
        return false;
    // exact word boundary
    const re = new RegExp('\\b' + np.replace(/[-\\/\\^$*+?.()|[\\]{}]/g, '\\$&') + '\\b', 'i');
    if (re.test(text))
        return true;
    const tTokens = tokenize(nt);
    const pTokens = tokenize(np);
    const windowSize = pTokens.length || 1;
    const threshold = typeof maxDistance === 'number' ? maxDistance : Math.max(1, Math.floor(np.length * 0.25));
    for (let i = 0; i + windowSize <= tTokens.length; i++) {
        const slice = tTokens.slice(i, i + windowSize).join(' ');
        const dist = levenshtein(slice, np);
        if (dist <= threshold)
            return true;
    }
    // also try single-token fuzzy (for short phrases)
    for (const pt of pTokens) {
        for (const tt of tTokens) {
            const d = levenshtein(pt, tt);
            if (d <= Math.max(1, Math.floor(pt.length * 0.25)))
                return true;
        }
    }
    return false;
}
function containsAnyFuzzy(text, phrases, maxDistance) {
    const matches = [];
    for (const p of phrases) {
        if (!p)
            continue;
        if (fuzzyIncludes(text, p, maxDistance))
            matches.push(p);
    }
    return matches;
}
function hasNegationBefore(text, matchIndex) {
    // simple check: look 30 chars before match for negation words
    const window = normalizeText(text.slice(Math.max(0, matchIndex - 60), matchIndex));
    return /\b(not|no|never|none|n't)\b/.test(window);
}
