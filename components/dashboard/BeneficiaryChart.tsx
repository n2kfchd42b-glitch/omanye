'use client'

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { MONTHLY_BENEFICIARIES } from '@/lib/mock-data'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'

export function BeneficiaryChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Beneficiaries Reached</CardTitle>
          <CardSubtitle>6-month growth trend</CardSubtitle>
        </div>
      </CardHeader>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MONTHLY_BENEFICIARIES} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="benefGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4CAF78" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4CAF78" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#C8EDD8" strokeOpacity={0.6} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#2E7D52', opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#2E7D52', opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #C8EDD8',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#0D2B1E',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Beneficiaries']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4CAF78"
              strokeWidth={2}
              fill="url(#benefGradient)"
              dot={{ fill: '#4CAF78', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
