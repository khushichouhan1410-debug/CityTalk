import { Category } from '../types';
import { Handshake, Megaphone, AlertTriangle } from 'lucide-react';

interface FeedFilterProps {
  activeCategory: Category | 'all';
  setActiveCategory: (category: Category | 'all') => void;
  counts: {
    all: number;
    locals: number;
    promotions: number;
    society: number;
  };
}

export default function FeedFilter({ activeCategory, setActiveCategory, counts }: FeedFilterProps) {
  const tabs = [
    {
      id: 'all' as const,
      label: 'All Activity',
      icon: null,
      color: 'bg-orange-500 text-white',
      inactiveColor: 'hover:bg-gray-100 text-gray-500',
      description: 'Unified local feed'
    },
    {
      id: 'locals' as const,
      label: 'Locals Connect',
      icon: <Handshake className="w-4 h-4" />,
      color: 'bg-emerald-600 text-white shadow-emerald-100',
      inactiveColor: 'hover:bg-emerald-50 text-emerald-800 border-emerald-100',
      description: 'Activities, sport partners, carpool'
    },
    {
      id: 'promotions' as const,
      label: 'Local Promotions',
      icon: <Megaphone className="w-4 h-4" />,
      color: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-rose-100',
      inactiveColor: 'hover:bg-rose-50 text-rose-800 border-rose-100',
      description: 'New shop launches, special offers & deals'
    },
    {
      id: 'society' as const,
      label: 'Society Issues',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-amber-500 text-white shadow-amber-100',
      inactiveColor: 'hover:bg-amber-50 text-amber-800 border-amber-100',
      description: 'Civic alerts, structural updates, complaints'
    }
  ];

  return (
    <div id="feed-filter-container" className="w-full bg-white rounded-2xl p-3 border border-gray-100 shadow-xs mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Filter Local Feed</h2>
        <span className="text-[10px] text-gray-500 font-medium">Showing {counts[activeCategory]} posts</span>
      </div>

      {/* Grid or Horizontal bar of beautiful interactive pills */}
      <div id="filter-tabs-scroller" className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
        {tabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id}`}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 transform active:scale-95 cursor-pointer border ${
                isActive 
                  ? `${tab.color} border-transparent shadow-md font-bold scale-[1.02]` 
                  : `bg-gray-50 text-gray-700 border-gray-100 ${tab.inactiveColor}`
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-label explaining current filter */}
      <div id="active-category-helper" className="mt-2.5 px-1.5 py-1 bg-gray-50/50 rounded-lg text-[10px] text-gray-500 flex items-center gap-1">
        <span className="font-bold text-gray-700">Category scope:</span> 
        <span>{tabs.find(t => t.id === activeCategory)?.description}</span>
      </div>
    </div>
  );
}
