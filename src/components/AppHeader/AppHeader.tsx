import React from 'react';
import cn from 'classnames';

interface Props {
  onSubmit: (title: string) => void;
  todoTitle: string;
  setTodoTitle: (title: string) => void;
  isInputActive: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  isAllTodosCompleted: boolean;
  shouldShowElement: boolean;
  handleToggleAll: () => void;
}

export const AppHeader: React.FC<Props> = ({
  onSubmit,
  todoTitle,
  setTodoTitle,
  isInputActive,
  inputRef,
  isAllTodosCompleted,
  shouldShowElement,
  handleToggleAll,
}) => {
  return (
    <header className="todoapp__header">
      {shouldShowElement && (
        <button
          type="button"
          data-cy="ToggleAllButton"
          className={cn('todoapp__toggle-all', {
            active: isAllTodosCompleted,
          })}
          onClick={() => handleToggleAll()}
        />
      )}

      <form // винестив  кромп
        onSubmit={event => {
          event.preventDefault();
          onSubmit(todoTitle.trim());
        }}
      >
        <input
          ref={inputRef}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={todoTitle}
          onChange={event => setTodoTitle(event.target.value)}
          autoFocus
          disabled={!isInputActive}
        />
      </form>
    </header>
  );
};
