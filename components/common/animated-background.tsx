// components/common/animated-background.tsx

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/8"></div>

      {/* Animated background orbs with floating animation */}
      <div
        className="
    absolute
    top-[5%]               /* phones: raise it a bit */
    md:top-[10%]           /* ≥ 768 px: use the desktop offset you liked */
    left-1/2 -translate-x-1/2
    w-96 h-96              /* shrink on small screens if you like: sm:w-72 sm:h-72 */
    bg-white/5 rounded-full blur-3xl
    animate-pulse animate-float glow-primary
  "
      />

      <div className="absolute top-2/3 right-1/5 w-80 h-80 bg-white/4 rounded-full blur-3xl animate-pulse animate-float-alt glow-primary delay-1000"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse animate-float delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-white/2 rounded-full blur-3xl animate-pulse animate-float-alt delay-3000"></div>
      <div className="absolute top-3/4 left-1/6 w-56 h-56 bg-white/4 rounded-full blur-3xl animate-pulse animate-float delay-4000"></div>
    </div>
  );
}
