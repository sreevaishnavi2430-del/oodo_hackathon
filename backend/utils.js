export const isoDate = (date) => new Date(date).toISOString().slice(0, 10);
export const addDays = (date, days) => new Date(new Date(date).getTime() + days * 86400000);
export const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const today = () => isoDate(new Date());
