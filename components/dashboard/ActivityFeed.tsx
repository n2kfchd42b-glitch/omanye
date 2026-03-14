import React from 'react'
import {
  ClipboardList, FileText, HandHeart, Star, AlertTriangle, FolderOpen, UserPlus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ACTIVITY_FEED } from '@/lib/mock-data'

const TYPE_ICON: Record<string, React.ElementType> = {
  submission: ClipboardList,
  report:     FileText,
  donor:      HandHeart,
  milestone:  Star,
  flag:       AlertTriangle,
  project:    FolderOpen,
  enrollment: UserPlus,
}

const TYPE_COLOR: Record<string, string> = {
  submission: 'text-fern bg-foam',
  report:     'text-blue-500 bg-blue-50',
  donor:      'text-gold bg-amber-50',
  milestone:  'text-sage bg-mist',
  flag:       'text-red-500 bg-red-50',
  project:    'text-moss bg-foam',
  enrollment: 'text-fern bg-foam',
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <ul className="space-y-3">
        {ACTIVITY_FEED.map(item => {
          const Icon = TYPE_ICON[item.type] ?? ClipboardList
          const color = TYPE_COLOR[item.type] ?? 'text-fern bg-foam'

          return (
            <li key={item.id} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-forest/80 leading-snug">
                  <span className="font-semibold text-forest">{item.actor}</span>{' '}
                  {item.message}
                </p>
                <p className="text-xs text-fern/50 mt-0.5">{item.time}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
