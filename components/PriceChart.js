'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

console.log('[PriceChart] Component loading...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('[PriceChart] URL:', supabaseUrl);
console.log('[PriceChart] Key:', supabaseKey ? 'set' : 'missing');

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function PriceChart() {
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('[PriceChart] Render, supabase:', !!supabase);

  useEffect(() => {
    console.log('[PriceChart] useEffect running');
    
    async function fetchPrices() {
      console.log('[PriceChart] fetchPrices called');
      
      if (!supabase) {
        console.log('[PriceChart] No supabase client');
        setError('No supabase client');
        setLoading(false);
        return;
      }

      try {
        console.log('[PriceChart] Querying database...');
        const { data, error: fetchError } = await supabase
          .from('price_history')
          .select('close, created_at')
          .order('created_at', { ascending: true })
          .limit(50);

        console.log('[PriceChart] Query result:', data?.length, fetchError);

        if (fetchError) {
          console.error('[PriceChart] Fetch error:', fetchError);
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const latestPrice = data[data.length - 1].close;
          setCurrentPrice(parseFloat(latestPrice).toFixed(2));
          
          const formatted = data.map((row) => ({
            time: new Date(row.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            }),
            price: parseFloat(row.close)
          }));

          setPriceData(formatted);
        }
      } catch (err) {
        console.error('[PriceChart] Catch error:', err);
        setError(err.message);
      }
      
      setLoading(false);
    }

    fetchPrices();
    
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-4xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (loading || priceData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-4xl text-white">${currentPrice}</div>
        <div className="text-gray-500">Loading chart data... ({priceData.length} points)</div>
      </div>
    );
  }

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
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toFixed(2)}
              width={50}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
