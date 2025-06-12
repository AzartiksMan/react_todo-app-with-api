/* eslint-disable jsx-a11y/label-has-associated-control */

import React, { useState } from 'react';
import cn from 'classnames';
import { Todo } from '../../types/Todo';

interface Props {
  todo: Todo;
  isOverlayActive?: boolean;
  handleDelete?: (value: number) => void;
  handleSwitchStatus?: (value: number) => void;
  handleUpdate?: (text: string, value: Todo) => void;
  isTodoEditing?: boolean;
  setEditingTodoId?: (value: number | null) => void;
}

export const TodoItem: React.FC<Props> = ({
  todo,
  isOverlayActive = true,
  handleDelete = () => {},
  handleSwitchStatus = () => {},
  handleUpdate = () => {},
  isTodoEditing = false,
  setEditingTodoId = () => {},
}) => {
  const { id, completed, title } = todo;

  const [editingTitle, setEditingTitle] = useState(todo.title);

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    handleUpdate(editingTitle, todo);
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setEditingTodoId(null);
      setEditingTitle(title);
    }
  };

  return (
    <div data-cy="Todo" className={cn('todo', { completed: completed })}>
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={completed}
          onChange={() => handleSwitchStatus(id)}
        />
      </label>

      {!isTodoEditing ? (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => setEditingTodoId(id)}
          >
            {title}
          </span>

          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => handleDelete(id)}
          >
            ×
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            autoFocus
            value={editingTitle}
            onChange={event => setEditingTitle(event.target.value)}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
          />
        </form>
      )}

      <div
        data-cy="TodoLoader"
        className={cn('modal', 'overlay', {
          'is-active': isOverlayActive,
        })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
