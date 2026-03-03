export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
