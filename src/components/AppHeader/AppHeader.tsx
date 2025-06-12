import React from 'react';
import cn from 'classnames';
import * as todosApi from '../../api/todos';
import { Todo } from '../../types/Todo';
import { ErrorMessages } from '../../types/ErrorMessages';

interface Props {
  onSubmit: (title: string) => void;
  todoTitle: string;
  setTodoTitle: (title: string) => void;
  isInputActive: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  isAllTodosCompleted: boolean;
  setOperatedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  todoData: Todo[];
  setTodoData: React.Dispatch<React.SetStateAction<Todo[]>>;
  setErrorMessage: (value: ErrorMessages) => void;
  shouldShowElement: boolean;
}

export const AppHeader: React.FC<Props> = ({
  onSubmit,
  todoTitle,
  setTodoTitle,
  isInputActive,
  inputRef,
  isAllTodosCompleted,
  setOperatedTodo,
  todoData,
  setTodoData,
  setErrorMessage,
  shouldShowElement,
}) => {
  const handleToggleAll = () => {
    const newCompletedStatus = !isAllTodosCompleted;

    const todosToUpdate = todoData.filter(
      todo => todo.completed !== newCompletedStatus,
    );

    const todosInOperation = todosToUpdate.map(todo => todo.id);

    setOperatedTodo(cur => [...cur, ...todosInOperation]);

    Promise.allSettled(
      todosToUpdate.map(todo => {
        const patchedTodo = {
          ...todo,
          completed: !todo.completed,
        };

        return todosApi.patchTodo(todo.id, patchedTodo);
      }),
    )
      .then(results => {
        const patchedTodos = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return {
              ...todosToUpdate[index],
              completed: !todosToUpdate[index].completed,
            };
          }

          return null;
        });

        if (patchedTodos.includes(null)) {
          setErrorMessage(ErrorMessages.OnPatch);
        }

        setTodoData(cur => {
          return cur.map(todo => {
            const patched = patchedTodos.find(p => p && p.id === todo.id);

            return patched ? patched : todo;
          });
        });
      })
      .finally(() =>
        setOperatedTodo(cur =>
          cur.filter(id => !todosInOperation.includes(id)),
        ),
      );
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
          onClick={() => handleToggleAll()}
        />
      )}

      <form
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
