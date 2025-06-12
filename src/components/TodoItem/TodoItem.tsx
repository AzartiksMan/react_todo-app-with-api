/* eslint-disable jsx-a11y/label-has-associated-control */

import React, { useState } from 'react';
import cn from 'classnames';
import { Todo } from '../../types/Todo';
import * as todosApi from '../../api/todos';
import { ErrorMessages } from '../../types/ErrorMessages';

interface Props {
  todo: Todo;
  isOverlayActive?: boolean;
  handleDelete?: (value: number) => void;
  handleSwitchStatus?: (value: number) => void;
  setErrorMessage?: (value: ErrorMessages) => void;
  handleUpdate?: (value: Todo) => void;
}

export const TodoItem: React.FC<Props> = ({
  todo,
  isOverlayActive = true,
  handleDelete = () => {},
  handleSwitchStatus = () => {},
  setErrorMessage = () => {},
  handleUpdate = () => {},
}) => {
  const { id, completed, title } = todo;

  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(todo.title);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }

    const normalizedTitle = editingTitle.trim();

    if (!normalizedTitle) {
      handleDelete(id);

      return;
    }

    if (normalizedTitle === title) {
      setIsEditing(false);

      return;
    }

    setIsSaving(true);

    const editedTodo = {
      ...todo,
      title: normalizedTitle,
    };

    todosApi
      .patchTodo(id, editedTodo)
      .then((response: unknown) => {
        const patchedTodo = response as Todo;

        handleUpdate(patchedTodo);
        setIsEditing(false);
      })
      .catch(() => setErrorMessage(ErrorMessages.OnPatch))
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
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

      {!isEditing ? (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => setIsEditing(true)}
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
          'is-active': isOverlayActive || isSaving,
        })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
