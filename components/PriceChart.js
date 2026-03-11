'use client';

import { useEffect, useState } from 'react';

export default function PriceChart({ prices, currentPrice: propPrice }) {
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(propPrice || "0.00");
  const [loading, setLoading] = useState(true);

  // Use prices from props if available
  useEffect(() => {
    console.log('[PriceChart] prices from props:', prices?.length);
    
    if (prices && prices.length > 0) {
      const formatted = prices.map((p) => ({
        time: new Date(p.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        price: parseFloat(p.close)
      }));
      setPriceData(formatted);
      setCurrentPrice(parseFloat(prices[prices.length - 1].close).toFixed(2));
      setLoading(false);
    } else if (propPrice) {
      setCurrentPrice(propPrice);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [prices, propPrice]);

  console.log('[PriceChart] Rendering with', priceData.length, 'points, price:', currentPrice);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-4xl text-white">Loading...</div>
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="mb-4">
          <span className="text-4xl text-white">${currentPrice}</span>
          <span className="ml-2 text-gray-500">SOL-PERP</span>
        </div>
        <div className="text-gray-500">No chart data</div>
      </div>
    );
  }

  // Dynamic import for recharts to avoid SSR issues
  const [Chart, setChart] = useState(null);
  
  useEffect(() => {
    import('recharts').then((mod) => {
      setChart(() => mod);
    });
  }, []);

  if (!Chart) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-4xl text-white">${currentPrice}</div>
      </div>
    );
  }

  const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } = Chart;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <span className="text-4xl text-white">${currentPrice}</span>
        <span className="ml-2 text-gray-500">SOL-PERP</span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              fontSize={12} 
            />
            
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#6b7280" 
              fontSize={12} 
              tickFormatter={(v) => v.toFixed(2)}
              width={50}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
