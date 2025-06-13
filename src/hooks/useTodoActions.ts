import { useEffect, useMemo, useState } from 'react';
import * as todosApi from '../api/todos';
import { ErrorMessages } from '../types/ErrorMessages';
import { Todo } from '../types/Todo';

export const useTodoActions = () => {
  const [todoData, setTodoData] = useState<Todo[]>([]);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [todoInOperation, setTodoInOperation] = useState<number[]>([]);

  const [errorMessage, setErrorMessage] = useState(ErrorMessages.None);

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

  const addTodo = async (title: string) => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setErrorMessage(ErrorMessages.OnEmptyTitle);

      return Promise.resolve(false);
    }

    const newTodo = {
      userId: todosApi.USER_ID,
      title: normalizedTitle,
      completed: false,
    };

    setTempTodo({ id: 0, ...newTodo });
    setTodoInOperation(cur => [...cur, 0]);

    try {
      const todoFromServer = await todosApi.postTodo(newTodo);

      setTodoData(current => [...current, todoFromServer]);

      return true;
    } catch {
      setErrorMessage(ErrorMessages.OnPost);

      return false;
    } finally {
      setTodoInOperation(cur => cur.filter(c => c !== 0));
      setTempTodo(null);
    }
  };

  const deleteTodo = async (id: number) => {
    setTodoInOperation(cur => [...cur, id]);

    try {
      await todosApi.deleteTodo(id);

      setTodoData(cur => cur.filter(todo => todo.id !== id));

      return true;
    } catch {
      setErrorMessage(ErrorMessages.OnDelete);

      return false;
    } finally {
      setTodoInOperation(cur => cur.filter(curId => curId !== id));
    }
  };

  const handleUpdate = async (
    normalizedTitle: string,
    id: number,
  ): Promise<boolean> => {
    setTodoInOperation(cur => [...cur, id]);

    try {
      const updatedTodo = await todosApi.patchTodo(id, {
        title: normalizedTitle,
      });

      setTodoData(cur =>
        cur.map(c => (c.id === updatedTodo.id ? updatedTodo : c)),
      );

      return true;
    } catch {
      setErrorMessage(ErrorMessages.OnPatch);

      return false;
    } finally {
      setTodoInOperation(cur => cur.filter(curId => curId !== id));
    }
  };

  const toggleTodo = async (
    currentId: number,
    completed: boolean,
  ): Promise<boolean> => {
    setTodoInOperation(cur => [...cur, currentId]);

    try {
      const updatedTodo = await todosApi.patchTodo(currentId, { completed });

      setTodoData(cur =>
        cur.map(todo =>
          todo.id === currentId
            ? { ...todo, completed: updatedTodo.completed }
            : todo,
        ),
      );

      return true;
    } catch {
      setErrorMessage(ErrorMessages.OnPatch);

      return false;
    } finally {
      setTodoInOperation(cur => cur.filter(curId => curId !== currentId));
    }
  };

  const deleteCompleted = async () => {
    const completedIds = todoData
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setTodoInOperation(cur => [...cur, ...completedIds]);

    const results = await Promise.all(completedIds.map(id => deleteTodo(id)));

    const hasError = results.includes(false);

    if (hasError) {
      setErrorMessage(ErrorMessages.OnDelete);
    }

    setTodoInOperation(cur => cur.filter(id => !completedIds.includes(id)));
  };

  const toggleAll = async () => {
    const newStatus = !isAllTodoCompleted;

    const todosToUpdate = todoData.filter(todo => todo.completed !== newStatus);

    const todosInOperation = todosToUpdate.map(todo => todo.id);

    setTodoInOperation(cur => [...cur, ...todosInOperation]);

    const results = await Promise.all(
      todosToUpdate.map(todo => toggleTodo(todo.id, newStatus)),
    );

    const hasError = results.includes(false);

    if (hasError) {
      setErrorMessage(ErrorMessages.OnPatch);
    }

    setTodoInOperation(cur => cur.filter(id => !todosInOperation.includes(id)));
  };

  return {
    tempTodo,
    todoData,
    isAllTodoCompleted,
    isCompletedTodos,
    activeTodos,
    todoInOperation,
    shouldShowElement,
    errorMessage,
    setErrorMessage,
    addTodo,
    deleteTodo,
    handleUpdate,
    toggleTodo,
    deleteCompleted,
    toggleAll,
  };
};
