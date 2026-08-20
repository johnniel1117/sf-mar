'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeSVGProps {
  value: string
  height?: number
  width?: number
}

export default function BarcodeSVG({ value, height = 40, width = 1.6 }: BarcodeSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !value) return
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: false,
        margin: 0,
      })
    } catch {
      // Invalid barcode value (e.g. empty or non-encodable) — leave blank
      // rather than crashing the whole page over one bad row.
    }
  }, [value, width, height])

  if (!value) return null
  return <svg ref={svgRef} />
}