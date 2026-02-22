'use client'

import React from 'react'

export default function LogoGridBackground() {
  const logo = {
    name: 'SF Express',
    url: 'https://companieslogo.com/img/orig/002352.SZ.D-e998e0d6.png?t=1745571877',
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* ── Center watermark (all screens) ── */}
      <img
        src={logo.url}
        alt={logo.name}
        className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          opacity-[0.90] grayscale
          w-[320px] h-[320px]
          sm:w-[420px] sm:h-[420px]
          md:w-[560px] md:h-[560px]
          lg:w-[720px] lg:h-[720px]
        "
      />

      {/* ── Corner accents (desktop only) ── */}
      <img
        src={logo.url}
        alt=""
        className="
          hidden lg:block absolute top-[8%] left-[6%]
          w-[520px] h-[520px]
          opacity-[0.05] grayscale
        "
      />

      <img
        src={logo.url}
        alt=""
        className="
          hidden lg:block absolute bottom-[8%] right-[6%]
          w-[520px] h-[520px]
          opacity-[0.05] grayscale
        "
      />
    </div>
  )
}