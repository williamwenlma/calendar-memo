import type { Memo } from "../types";

interface ConfirmDialogProps {
  memo: Memo;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ memo, isDeleting, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <h2 id="delete-title">删除这条事项？</h2>
        <p id="delete-description">“{memo.content}”删除后无法恢复。</p>
        <div>
          <button type="button" onClick={onCancel} disabled={isDeleting}>取消</button>
          <button className="danger-button" type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "正在删除…" : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
}
