import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

interface Props {
  isAllTodosCompleted: boolean;
  shouldShowElement: boolean;
  addTodo: (title: string) => Promise<boolean>;
  toggleAll: () => void;
  isLoading: boolean;
}

export const AppHeader: React.FC<Props> = ({
  isAllTodosCompleted,
  shouldShowElement,
  addTodo,
  toggleAll,
  isLoading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [todoTitle, setTodoTitle] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isSuccessed = await addTodo(todoTitle);

    if (isSuccessed) {
      setTodoTitle('');
    }
  };

  return (
    <header className="todoapp__header">
      {shouldShowElement && (
        <button
          type="button"
          data-cy="ToggleAllButton"
          className={cn('todoapp__toggle-all', {
            active: isAllTodosCompleted,
          })}
          onClick={() => toggleAll()}
        />
      )}

      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={todoTitle}
          onChange={event => setTodoTitle(event.target.value)}
          autoFocus
          disabled={isLoading}
        />
      </form>
    </header>
  );
};
