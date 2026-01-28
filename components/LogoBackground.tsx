import React from 'react';

export default function LogoGridBackground() {
  const logos = [
  { name: "SF", url: "https://vectorise.net/logo/wp-content/uploads/2019/10/SF-Express.png" },
  { name: "SF Express", url: "https://vectorise.net/logo/wp-content/uploads/2019/10/SF-Express.png" },
];

  // Create a grid by repeating logos
  const gridLogos = Array.from({ length: 70 }, (_, i) => logos[i % logos.length]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent">
      {/* Slanted logo grid */}
      <div className="absolute inset-0 -skew-y-12">
        <div className="grid grid-cols-4 gap-12 p-4 h-full">
          {gridLogos.map((logo, i) => (
            <div
              key={i}
              className="flex items-center justify-center opacity-0 animate-fadeIn"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationDuration: '1s',
                animationFillMode: 'forwards',
                animationTimingFunction: 'ease-out'
              }}
            >
              <img 
                src={logo.url} 
                alt={logo.name}
                className="w-96 h-96 opacity-20"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Left fade overlay */}
      {/* <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-20" /> */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn forwards;
        }
      `}</style>
    </div>
  );
}