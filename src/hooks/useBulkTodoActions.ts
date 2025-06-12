import * as todosApi from '../api/todos';
import { ErrorMessages } from '../types/ErrorMessages';
import { Todo } from '../types/Todo';

interface Params {
  todoData: Todo[];
  setDeletedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<ErrorMessages>>;
  setTodoData: React.Dispatch<React.SetStateAction<Todo[]>>;
  inputRef: React.RefObject<HTMLInputElement>;
  setOperatedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  isAllTodosCompleted: boolean;
}

export const useBulkTodoActions = ({
  todoData,
  setDeletedTodo,
  setErrorMessage,
  setTodoData,
  inputRef,
  setOperatedTodo,
  isAllTodosCompleted,
}: Params) => {
  const handleClearCompleted = () => {
    const completedIds = todoData
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setDeletedTodo(cur => [...cur, ...completedIds]);

    Promise.allSettled(
      completedIds.map(id => todosApi.deleteTodo(id).then(() => id)),
    )
      .then(results => {
        const succesIds = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        const isSomeFailed = results.some(r => r.status === 'rejected');

        if (isSomeFailed) {
          setErrorMessage(ErrorMessages.OnDelete);
        }

        setTodoData(cur => cur.filter(todo => !succesIds.includes(todo.id)));
      })
      .finally(() => {
        setDeletedTodo(cur => cur.filter(id => !completedIds.includes(id)));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0); // ще раз спитать на QnA
      });
  };

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

  return {
    handleClearCompleted,
    handleToggleAll,
  };
};
