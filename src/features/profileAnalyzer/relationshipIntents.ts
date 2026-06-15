/**
 * Tinder "Looking for" relationship-intent labels — a small fixed enum the UI
 * renders for each profile. We match these against the card's text rather than
 * targeting a DOM node by class: Tinder's class names are rehashed every build,
 * but these human-facing labels are stable and language-bound to the account
 * locale. Update this list from a fresh capture if Tinder rewords them.
 *
 * They're UI chrome (not PII), so the anonymizer preserves them verbatim — that
 * way exported fixtures still exercise `getLookingFor`.
 */
export const relationshipIntents = [
  'Long-term partner',
  'Long-term, open to short',
  'Short-term, open to long',
  'Short-term fun',
  'New friends',
  'Still figuring it out',
];
