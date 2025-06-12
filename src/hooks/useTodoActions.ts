import { useState } from 'react';
import * as todosApi from '../api/todos';
import { ErrorMessages } from '../types/ErrorMessages';
import { Todo } from '../types/Todo';

interface Params {
  todoData: Todo[];
  setTodoData: React.Dispatch<React.SetStateAction<Todo[]>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<ErrorMessages>>;
  setTodoTitle: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLInputElement>;
  setDeletedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  setEditingTodoId: React.Dispatch<React.SetStateAction<number | null>>;
  setOperatedTodo: React.Dispatch<React.SetStateAction<number[]>>;
}

export const useTodoActions = ({
  todoData,
  setTodoData,
  setErrorMessage,
  setTodoTitle,
  inputRef,
  setDeletedTodo,
  setEditingTodoId,
  setOperatedTodo,
}: Params) => {
  const [tempTodo, setTempTodo] = useState<Todo | null>(null); // смело в 1
  const [isInputActive, setIsInputActive] = useState(true); // смело в 1
  const [isTodoSaving, setTodoSaving] = useState<null | number>(null); // смело в 1

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
    setDeletedTodo(cur => [...cur, id]);

    todosApi
      .deleteTodo(id)
      .then(() => setTodoData(cur => cur.filter(todo => todo.id !== id)))
      .catch(() => setErrorMessage(ErrorMessages.OnDelete))
      .finally(() => {
        setDeletedTodo(cur => cur.filter(curId => curId !== id));
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

    setTodoSaving(id);

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
        setTodoSaving(null);
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

    setOperatedTodo(cur => [...cur, currentId]);

    todosApi
      .patchTodo(currentId, patchedTodo)
      .then(() => {
        setTodoData(current =>
          current.map(todo => (todo.id === currentId ? patchedTodo : todo)),
        );
      })
      .catch(() => setErrorMessage(ErrorMessages.OnPatch))
      .finally(() => {
        setOperatedTodo(cur => cur.filter(curId => curId !== currentId));
      });
  };

  return {
    handleSubmit,
    handleDelete,
    handleUpdate,
    handleSwitchStatus,
    tempTodo,
    isInputActive,
    isTodoSaving,
  };
};
