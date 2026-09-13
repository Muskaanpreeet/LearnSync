// Small shared date helpers so every page formats dates/deadlines the
// same way instead of each component calling toLocaleDateString with
// different options.
export const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const isPast = (date) => new Date(date) < new Date();
