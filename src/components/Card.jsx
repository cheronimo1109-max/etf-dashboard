import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function Card({ card, onEdit, onDelete, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id })

  const style = isOverlay ? undefined : {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card${isOverlay ? ' card-overlay' : ''}`}
    >
      <div className="card-drag" {...listeners} {...attributes} title="ドラッグして移動">
        <DragIcon />
      </div>

      <div className="card-body">
        <div className="card-title">{card.title}</div>
        {card.target && (
          <div className="card-target">
            <span>👥</span>{card.target}
          </div>
        )}
        {card.memo && <div className="card-memo">{card.memo}</div>}
      </div>

      {!isOverlay && (
        <div className="card-actions">
          <button className="btn-edit"   onClick={onEdit}>編集</button>
          <button className="btn-delete" onClick={onDelete}>削除</button>
        </div>
      )}
    </div>
  )
}

function DragIcon() {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor">
      <circle cx="2.5" cy="2.5"  r="1.5"/>
      <circle cx="7.5" cy="2.5"  r="1.5"/>
      <circle cx="2.5" cy="9"    r="1.5"/>
      <circle cx="7.5" cy="9"    r="1.5"/>
      <circle cx="2.5" cy="15.5" r="1.5"/>
      <circle cx="7.5" cy="15.5" r="1.5"/>
    </svg>
  )
}
