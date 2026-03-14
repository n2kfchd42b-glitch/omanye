'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SPENDING_BY_SECTOR } from '@/lib/mock-data'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export function SpendingChart() {
  const total = SPENDING_BY_SECTOR.reduce((s, d) => s + d.amount, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Spend by Sector</CardTitle>
          <CardSubtitle>Total: {formatCurrency(total)}</CardSubtitle>
        </div>
      </CardHeader>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={SPENDING_BY_SECTOR}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={76}
              paddingAngle={3}
              dataKey="amount"
              nameKey="sector"
            >
              {SPENDING_BY_SECTOR.map((entry, i) => (
                <Cell key={i} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #C8EDD8',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#0D2B1E',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Spent']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#2E7D52' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
