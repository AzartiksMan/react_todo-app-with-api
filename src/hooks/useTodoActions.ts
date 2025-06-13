import { useEffect, useMemo, useState } from 'react';
import * as todosApi from '../api/todos';
import { ErrorMessages } from '../types/ErrorMessages';
import { Todo } from '../types/Todo';

interface Params {
  inputRef: React.RefObject<HTMLInputElement>;
  setErrorMessage: React.Dispatch<React.SetStateAction<ErrorMessages>>;
  setTodoTitle: React.Dispatch<React.SetStateAction<string>>;
  setEditingTodoId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const useTodoActions = ({
  inputRef,
  setErrorMessage,
  setTodoTitle,
  setEditingTodoId,
}: Params) => {
  const [todoData, setTodoData] = useState<Todo[]>([]);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [todoInOperation, setTodoInOperation] = useState<number[]>([]);

  const [isInputActive, setIsInputActive] = useState(true);

  useEffect(() => {
    todosApi
      .getTodos()
      .then(setTodoData)
      .catch(() => setErrorMessage(ErrorMessages.OnGet));
  }, [setErrorMessage]);

  const {
    activeTodos,
    isCompletedTodos,
    isAllTodoCompleted,
    shouldShowElement,
  } = useMemo(
    () => ({
      activeTodos: todoData.filter(todo => !todo.completed).length,
      isCompletedTodos: todoData.some(todo => todo.completed),
      isAllTodoCompleted:
        todoData.length > 0 && todoData.every(todo => todo.completed),
      shouldShowElement: todoData.length > 0,
    }),
    [todoData],
  );

  const handleSubmit = (title: string) => {
    if (!title) {
      setErrorMessage(ErrorMessages.OnEmptyTitle);

      return;
    }

    setIsInputActive(false);

    const newTodo = {
      userId: todosApi.USER_ID,
      title: title,
      completed: false,
    };

    setTempTodo({ id: 0, ...newTodo });

    todosApi
      .postTodo(newTodo)
      .then(todo => {
        setTodoData(current => [...current, todo]);
        setTodoTitle('');
      })
      .catch(() => setErrorMessage(ErrorMessages.OnPost))
      .finally(() => {
        setIsInputActive(true);
        setTempTodo(null);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const handleDelete = (id: number) => {
    setTodoInOperation(cur => [...cur, id]);

    todosApi
      .deleteTodo(id)
      .then(() => setTodoData(cur => cur.filter(todo => todo.id !== id)))
      .catch(() => setErrorMessage(ErrorMessages.OnDelete))
      .finally(() => {
        setTodoInOperation(cur => cur.filter(curId => curId !== id));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const handleUpdate = (editingTitle: string, todo: Todo) => {
    const { id, title } = todo;

    const normalizedTitle = editingTitle.trim();

    if (!normalizedTitle) {
      handleDelete(id);

      return;
    }

    if (normalizedTitle === title) {
      setEditingTodoId(null);

      return;
    }

    setTodoInOperation(cur => [...cur, id]);

    const editedTodo = {
      ...todo,
      title: normalizedTitle,
    };

    todosApi
      .patchTodo(id, editedTodo)
      .then((response: unknown) => {
        const patchedTodo = response as Todo;

        setTodoData(cur =>
          cur.map(c => (c.id === patchedTodo.id ? patchedTodo : c)),
        );
        setEditingTodoId(null);
      })
      .catch(() => setErrorMessage(ErrorMessages.OnPatch))
      .finally(() => {
        setTodoInOperation(cur => cur.filter(c => c !== id));
      });
  };

  const handleSwitchStatus = (currentId: number) => {
    const currentTodo = todoData.find(todo => todo.id === currentId);

    if (!currentTodo) {
      return;
    }

    const patchedTodo = {
      ...currentTodo,
      completed: !currentTodo.completed,
    };

    setTodoInOperation(cur => [...cur, currentId]);

    todosApi
      .patchTodo(currentId, patchedTodo)
      .then(() => {
        setTodoData(current =>
          current.map(todo => (todo.id === currentId ? patchedTodo : todo)),
        );
      })
      .catch(() => setErrorMessage(ErrorMessages.OnPatch))
      .finally(() => {
        setTodoInOperation(cur => cur.filter(curId => curId !== currentId));
      });
  };

  const handleClearCompleted = () => {
    const completedIds = todoData
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setTodoInOperation(cur => [...cur, ...completedIds]);

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
        setTodoInOperation(cur => cur.filter(id => !completedIds.includes(id)));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0); // ще раз спитать на QnA
      });
  };

  const handleToggleAll = () => {
    const newCompletedStatus = !isAllTodoCompleted;

    const todosToUpdate = todoData.filter(
      todo => todo.completed !== newCompletedStatus,
    );

    const todosInOperation = todosToUpdate.map(todo => todo.id);

    setTodoInOperation(cur => [...cur, ...todosInOperation]);

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
        setTodoInOperation(cur =>
          cur.filter(id => !todosInOperation.includes(id)),
        ),
      );
  };

  return {
    tempTodo,
    isInputActive,
    todoData,
    isAllTodoCompleted,
    isCompletedTodos,
    activeTodos,
    todoInOperation,
    shouldShowElement,
    handleSubmit,
    handleDelete,
    handleUpdate,
    handleSwitchStatus,
    handleClearCompleted,
    handleToggleAll,
  };
};
