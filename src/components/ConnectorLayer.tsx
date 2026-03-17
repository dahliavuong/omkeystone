import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { NodeConnection } from '../utils/connector';
import { buildOrthogonalPath } from '../utils/connector';

type ConnectorLayerProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  nodeElementsRef: RefObject<Map<string, HTMLDivElement>>;
  connections: NodeConnection[];
  version: number;
};

type PathSegment = {
  key: string;
  d: string;
};

export function ConnectorLayer({
  canvasRef,
  nodeElementsRef,
  connections,
  version,
}: ConnectorLayerProps) {
  const [paths, setPaths] = useState<PathSegment[]>([]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const recalculatePaths = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const nodeElements = nodeElementsRef.current;
      const nextPaths: PathSegment[] = [];

      for (const connection of connections) {
        const fromNode = nodeElements.get(connection.from);
        const toNode = nodeElements.get(connection.to);
        if (!fromNode || !toNode) {
          continue;
        }

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left;
        const y1 = fromRect.bottom - canvasRect.top;
        const x2 = toRect.left + toRect.width / 2 - canvasRect.left;
        const y2 = toRect.top - canvasRect.top;

        nextPaths.push({
          key: `${connection.from}->${connection.to}`,
          d: buildOrthogonalPath(x1, y1, x2, y2),
        });
      }

      setPaths(nextPaths);
    };

    recalculatePaths();

    const resizeObserver = new ResizeObserver(() => recalculatePaths());
    resizeObserver.observe(canvas);
    for (const node of nodeElementsRef.current.values()) {
      resizeObserver.observe(node);
    }
    window.addEventListener('resize', recalculatePaths);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', recalculatePaths);
    };
  }, [canvasRef, connections, nodeElementsRef, version]);

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden="true"
    >
      {paths.map((path) => (
        <path
          key={path.key}
          d={path.d}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
