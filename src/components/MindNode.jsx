import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { StickyNote } from 'lucide-react';

function MindNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => setDraft(data.label), [data.label]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const label = draft.trim() || 'Untitled';
    if (label !== data.label) updateNodeData(id, { label });
  };

  return (
    <div
      className={`mind-node c-${data.color}${data.root ? ' is-root' : ''}${selected ? ' is-selected' : ''}`}
      onDoubleClick={() => setEditing(true)}
      data-tour={data.root ? 'root-node' : undefined}
    >
      {!data.root && <Handle type="target" position={Position.Left} className="mind-handle" />}
      {editing ? (
        <input
          ref={inputRef}
          className="mind-node__input nodrag"
          value={draft}
          aria-label="Edit idea"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(data.label);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className="mind-node__label">{data.label}</span>
      )}
      {data.notes && <StickyNote className="mind-node__note" size={13} aria-label="Has notes" />}
      <Handle type="source" position={Position.Right} className="mind-handle" />
    </div>
  );
}

export default memo(MindNode);
