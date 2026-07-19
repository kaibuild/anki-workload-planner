import { useMemo } from 'react'

type SparklineProps = {
  values: number[]
  label: string
}

const MAX_RENDERED_POINTS = 180

export function Sparkline({ values, label }: SparklineProps) {
  const width = 420
  const height = 96
  const padding = 8
  const chart = useMemo(() => makeChart(values, width, height, padding), [values])

  if (!chart) return null

  return (
    <svg
      aria-label={label}
      className="h-24 w-full overflow-hidden"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} className="stroke-slate-200" />
      <polyline points={chart.polyline} fill="none" className="stroke-teal-700" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {chart.points.map(({ x, y }, index) => <circle key={index} cx={x} cy={y} r="3" className="fill-white stroke-teal-700" strokeWidth="2" />)}
    </svg>
  )
}

function makeChart(values: readonly number[], width: number, height: number, padding: number) {
  const finiteValues = values.filter(Number.isFinite)
  if (finiteValues.length < 2) return null

  const sampled = downsample(finiteValues, MAX_RENDERED_POINTS)
  let min = sampled[0]
  let max = sampled[0]
  for (let index = 1; index < sampled.length; index += 1) {
    min = Math.min(min, sampled[index])
    max = Math.max(max, sampled[index])
  }

  const range = max - min || 1
  const points = sampled.map((value, index) => ({
    x: padding + (index / (sampled.length - 1)) * (width - padding * 2),
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }))

  return {
    points,
    polyline: points.map(({ x, y }) => `${x},${y}`).join(' '),
  }
}

/**
 * Keeps the first/last samples and each bucket's extrema in chronological
 * order. This preserves visible direction and spikes while bounding SVG DOM.
 */
function downsample(values: readonly number[], maxPoints: number): number[] {
  if (values.length <= maxPoints) return [...values]

  const result = [values[0]]
  const interiorLength = values.length - 2
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2))
  const bucketSize = interiorLength / bucketCount

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = 1 + Math.floor(bucket * bucketSize)
    const end = Math.min(values.length - 1, 1 + Math.floor((bucket + 1) * bucketSize))
    if (start >= end) continue

    let minIndex = start
    let maxIndex = start
    for (let index = start + 1; index < end; index += 1) {
      if (values[index] < values[minIndex]) minIndex = index
      if (values[index] > values[maxIndex]) maxIndex = index
    }

    if (minIndex === maxIndex) result.push(values[minIndex])
    else if (minIndex < maxIndex) result.push(values[minIndex], values[maxIndex])
    else result.push(values[maxIndex], values[minIndex])
  }

  result.push(values[values.length - 1])
  return result
}
