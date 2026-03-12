import type { ReactNode } from 'react'
import { useHouseholdStore } from '../../stores/householdStore'
import { usePresence } from '../../hooks/usePresence'
import PresenceAvatars from './PresenceAvatars'
import { NotificationBell } from './AppShell'

interface PageHeaderProps {
  children: ReactNode
  rightSlot?: ReactNode
}

export default function PageHeader({ children, rightSlot }: PageHeaderProps) {
  const household = useHouseholdStore((s) => s.household)
  const isShared = !!(household?.personBName)
  const onlineUsers = usePresence(isShared)

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <div className="flex items-center gap-1.5">
        {isShared && onlineUsers.length > 0 && (
          <PresenceAvatars users={onlineUsers} />
        )}
        {isShared && (
          <div className="lg:hidden">
            <NotificationBell />
          </div>
        )}
        {rightSlot}
      </div>
    </div>
  )
}
