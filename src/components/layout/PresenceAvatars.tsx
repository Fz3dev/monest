import type { PresenceUser } from '../../hooks/usePresence'

interface PresenceAvatarsProps {
  users: PresenceUser[]
}

export default function PresenceAvatars({ users }: PresenceAvatarsProps) {
  return (
    <div className="flex items-center">
      {users.map((user, i) => (
        <div
          key={user.userId}
          className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i > 0 ? '-ml-1.5' : ''}`}
          style={{
            backgroundColor: `${user.color}33`,
            color: user.color,
          }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
          {user.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-bg-primary rounded-full" />
          )}
        </div>
      ))}
    </div>
  )
}
