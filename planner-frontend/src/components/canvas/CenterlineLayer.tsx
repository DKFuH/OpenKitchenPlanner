import { Group, Line, Text } from 'react-konva'
import type { Centerline } from '../../api/centerlines.js'

interface Props {
  centerlines: Centerline[]
  worldToCanvas: (mm: number) => number
  stroke: string
}

export function CenterlineLayer({ centerlines, worldToCanvas, stroke }: Props) {
  return (
    <Group>
      {centerlines.map((centerline) => {
        const x0 = worldToCanvas(centerline.x0_mm)
        const y0 = worldToCanvas(centerline.y0_mm)
        const x1 = worldToCanvas(centerline.x1_mm)
        const y1 = worldToCanvas(centerline.y1_mm)

        return (
          <Group key={centerline.id} listening={false}>
            <Line
              points={[x0, y0, x1, y1]}
              stroke={stroke}
              strokeWidth={1}
              dash={[6, 3]}
              opacity={0.8}
            />
            {centerline.label && (
              <Text
                x={(x0 + x1) / 2 + 4}
                y={(y0 + y1) / 2 - 12}
                text={centerline.label}
                fontSize={10}
                fill={stroke}
              />
            )}
          </Group>
        )
      })}
    </Group>
  )
}
