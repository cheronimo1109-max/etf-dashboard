import { useDroppable } from '@dnd-kit/core'
import Card from './Card'

export default function Column({ column, cards, onAdd, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={`column${isOver ? ' column-over' : ''}`}>
      <div className="column-header" style={{ borderTopColor: column.color }}>
        <div className="column-title">
          <span className="column-dot" style={{ background: column.color }} />
          <h2>{column.label}</h2>
        </div>
        <span className="column-count">{cards.length}</span>
      </div>

      <div ref={setNodeRef} className="column-body">
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            onEdit={() => onEdit(card)}
            onDelete={() => onDelete(card.id)}
          />
        ))}
        {cards.length === 0 && (
          <div className="column-empty">ここにドロップ</div>
        )}
      </div>

      <button className="add-btn" onClick={onAdd}>＋ カードを追加</button>
    </div>
  )
}
