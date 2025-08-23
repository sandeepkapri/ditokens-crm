"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TokenPrice {
  id: string;
  price: number;
  date: string;
}

export default function TokenPriceChart() {
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, we'll use mock data. In production, this would fetch from the API
    const mockData = generateMockTokenPrices();
    setTokenPrices(mockData);
    setIsLoading(false);
  }, []);

  const generateMockTokenPrices = (): TokenPrice[] => {
    const data: TokenPrice[] = [];
    const startPrice = 2.8;
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price variations
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const price = startPrice + variation;
      
      data.push({
        id: `price-${i}`,
        price: parseFloat(price.toFixed(2)),
        date: date.toISOString().split('T')[0],
      });
    }
    
    return data;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Price Chart</h3>
        <p className="text-sm text-gray-600">Daily DIT token price over the last 30 days</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tokenPrices}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Current Price: <span className="font-semibold text-indigo-600">${tokenPrices[tokenPrices.length - 1]?.price.toFixed(2)}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Starting Price: $2.80 | Total Supply: 50M DIT
        </p>
      </div>
    </div>
  );
}
