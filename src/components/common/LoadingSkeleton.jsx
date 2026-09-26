import React from 'react';

export const LoadingSkeleton = ({ rows = 5, type = "table" }) => {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/70 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-8 w-28 bg-slate-200 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};
