import React from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const positions = [
  {
    pair: 'BTC/USDT',
    side: 'Long',
    size: '0.25 BTC',
    entry: '42,000',
    mark: '42,450',
    pnl: '+112.5 USDT',
    pnlColor: 'text-green-500',
    sideColor: 'text-green-500',
  },
  {
    pair: 'ETH/USDT',
    side: 'Short',
    size: '1.2 ETH',
    entry: '2,350',
    mark: '2,300',
    pnl: '+60 USDT',
    pnlColor: 'text-green-500',
    sideColor: 'text-red-500',
  },
];

export const PositionsTable = () => {
  return (
    <div className="w-full bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">POSITIONS</h2>
        <div className="flex gap-2">
           {/* Filters could go here */}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-xs font-mono uppercase border-b border-slate-800">
              <th className="py-3 px-4 font-normal">Pair</th>
              <th className="py-3 px-4 font-normal">Side</th>
              <th className="py-3 px-4 font-normal">Size</th>
              <th className="py-3 px-4 font-normal text-right">Entry <span className="text-[10px] ml-1">↓</span></th>
              <th className="py-3 px-4 font-normal text-right">Mark</th>
              <th className="py-3 px-4 font-normal text-right">PnL</th>
              <th className="py-3 px-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {positions.map((pos, idx) => (
              <tr 
                key={idx} 
                className="group hover:bg-[#1E1B2E] transition-colors border-b border-slate-800/50 last:border-0"
              >
                <td className="py-4 px-4 font-bold text-white group-hover:text-purple-300 transition-colors">
                  {pos.pair}
                </td>
                <td className={cn("py-4 px-4 font-medium", pos.sideColor)}>
                  {pos.side}
                </td>
                <td className="py-4 px-4 text-slate-300">
                  {pos.size.split(' ')[0]} <span className="text-slate-500 text-xs">{pos.size.split(' ')[1]}</span>
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  {pos.entry}
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  {pos.mark}
                </td>
                <td className={cn("py-4 px-4 text-right font-medium", pos.pnlColor)}>
                  {pos.pnl}
                </td>
                <td className="py-4 px-4 text-right">
                   <div className="flex items-center justify-end gap-3 text-xs font-sans font-medium">
                     <button className="text-slate-400 hover:text-white transition-colors">TP/SL</button>
                     <button className="text-red-400 hover:text-red-300 transition-colors">Close</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty State Mock */}
      {/* <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
         <div className="w-12 h-12 rounded-full bg-slate-800/50 mb-2"></div>
         <span>No active positions</span>
      </div> */}
    </div>
  );
};
