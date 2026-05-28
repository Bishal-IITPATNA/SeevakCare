"use client";
import { useState } from "react";

interface DisplayProps {
  rating: number;   // average, e.g. 4.3
  count?: number;
  size?: "sm" | "md" | "lg";
}

export function StarDisplay({ rating, count, size = "md" }: DisplayProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass}`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
      <span className="text-slate-500 font-medium ml-1">
        {rating > 0 ? rating.toFixed(1) : "No ratings"}
        {count !== undefined && count > 0 && (
          <span className="text-slate-400 font-normal"> ({count})</span>
        )}
      </span>
    </span>
  );
}

interface InputProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarInput({ value, onChange }: InputProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-colors ${
            (hover || value) >= star ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-slate-500 self-center ml-1">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}
