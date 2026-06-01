import { useState, useEffect, useRef } from 'react'
import { COLUMNS } from '../App'

export default function CardModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === 'edit'
  const [form, setForm] = useState(
    isEdit
      ? { ...modal.card }
      : { title: '', memo: '', target: '', status: modal.status }
  )
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'カードを編集' : 'カードを追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>タイトル <span className="required">*</span></label>
            <input
              ref={inputRef}
              value={form.title}
              onChange={set('title')}
              placeholder="記事のタイトルまたはテーマ"
              required
            />
          </div>

          <div className="form-group">
            <label>ターゲット読者</label>
            <input
              value={form.target}
              onChange={set('target')}
              placeholder="例: 20代エンジニア、副業を始めたい会社員"
            />
          </div>

          <div className="form-group">
            <label>メモ</label>
            <textarea
              value={form.memo}
              onChange={set('memo')}
              rows={4}
              placeholder="アイデアのメモ、構成案、参考リンクなど"
            />
          </div>

          {isEdit && (
            <div className="form-group">
              <label>ステータス</label>
              <select value={form.status} onChange={set('status')}>
                {COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn-save">{isEdit ? '保存' : '追加'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
