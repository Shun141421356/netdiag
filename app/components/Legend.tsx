'use client';
import { CABLE_STYLES, CableType } from '../types/diagram';

export function Legend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-sm p-2.5 text-xs z-10">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">凡例</p>
      <div className="space-y-1">
        {(Object.entries(CABLE_STYLES) as [CableType, typeof CABLE_STYLES[CableType]][]).map(([key, s]) => (
          <div key={key} className="flex items-center gap-2">
            <svg width="28" height="10" className="flex-shrink-0">
              <line
                x1="0" y1="5" x2="28" y2="5"
                stroke={s.stroke}
                strokeWidth={s.width}
                strokeDasharray={s.dash || undefined}
              />
            </svg>
            <span className="text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
