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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PriceChart() {
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState("0.00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('close, created_at')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching prices:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setCurrentPrice(parseFloat(data[data.length - 1].close).toFixed(2));
        
        const formattedData = data.map((row) => ({
          time: new Date(row.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
          }),
          price: parseFloat(row.close)
        }));

        setPriceData(formattedData);
      }
      setLoading(false);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <span className="text-4xl text-white">${currentPrice}</span>
        <span className="ml-2 text-gray-500">SOL-PERP</span>
      </div>

      <div className="h-80 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading...
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
