import { useMemo, type CSSProperties } from 'react';
import type { WorkflowDefinition, WorkflowNode } from '../../types/config';
import { NODE_ICONS, NODE_COLORS } from './nodeIcons';
import { WORKFLOW_NODE_LABELS } from '../../types/config';
import styles from './WorkflowCanvas.module.css';

const COL_WIDTH = 210;
const ROW_HEIGHT = 108;
const NODE_WIDTH = 172;
const NODE_HEIGHT = 60;
const PADDING = 32;

export interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  selectedNodeId: string | null;
  activeNodeId?: string | null;
  onSelectNode: (node: WorkflowNode) => void;
}

export function WorkflowCanvas({ workflow, selectedNodeId, activeNodeId, onSelectNode }: WorkflowCanvasProps) {
  const minCol = Math.min(...workflow.nodes.map((n) => n.col));
  const maxCol = Math.max(...workflow.nodes.map((n) => n.col));
  const maxRow = Math.max(...workflow.nodes.map((n) => n.row));

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    workflow.nodes.forEach((n) => {
      map.set(n.id, {
        x: PADDING + (n.col - minCol) * COL_WIDTH,
        y: PADDING + n.row * ROW_HEIGHT,
      });
    });
    return map;
  }, [workflow.nodes, minCol]);

  const width = PADDING * 2 + (maxCol - minCol + 1) * COL_WIDTH;
  const height = PADDING * 2 + (maxRow + 1) * ROW_HEIGHT;

  return (
    <div className={styles.scroller}>
      <div className={styles.canvas} style={{ width, height }}>
        <svg className={styles.edges} width={width} height={height}>
          <defs>
            <marker id="wf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--color-gray-400)" />
            </marker>
          </defs>
          {workflow.edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_WIDTH / 2;
            const y1 = from.y + NODE_HEIGHT;
            const x2 = to.x + NODE_WIDTH / 2;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--color-gray-300)"
                  strokeWidth={2}
                  markerEnd="url(#wf-arrow)"
                />
                {edge.label && (
                  <text x={(x1 + x2) / 2} y={midY - 6} textAnchor="middle" className={styles.edgeLabel}>
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {workflow.nodes.map((node) => {
          const pos = positions.get(node.id)!;
          const Icon = NODE_ICONS[node.type];
          const isSelected = node.id === selectedNodeId;
          const isActive = node.id === activeNodeId;
          return (
            <button
              key={node.id}
              type="button"
              className={[styles.node, isSelected ? styles.selected : '', isActive ? styles.active : ''].join(' ')}
              style={
                {
                  left: pos.x,
                  top: pos.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  '--node-color': NODE_COLORS[node.type],
                } as CSSProperties
              }
              onClick={() => onSelectNode(node)}
            >
              <span className={styles.nodeIcon}>
                <Icon size={15} />
              </span>
              <span className={styles.nodeText}>
                <span className={styles.nodeLabel}>{node.label}</span>
                <span className={styles.nodeType}>{WORKFLOW_NODE_LABELS[node.type]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
