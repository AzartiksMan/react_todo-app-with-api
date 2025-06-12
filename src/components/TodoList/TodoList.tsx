import React from 'react';
import { Todo } from '../../types/Todo';
import * as todosApi from '../../api/todos';
import { TodoItem } from '../TodoItem/TodoItem';
import { ErrorMessages } from '../../types/ErrorMessages';

interface Props {
  todoList: Todo[];
  todoData: Todo[];
  tempTodo: Todo | null;
  deletedTodo: number[];
  setTodoData: React.Dispatch<React.SetStateAction<Todo[]>>;
  setDeletedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  setErrorMessage: (value: ErrorMessages) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  operatedTodo: number[];
  setOperatedTodo: React.Dispatch<React.SetStateAction<number[]>>;
}

export const TodoList: React.FC<Props> = ({
  todoList,
  todoData,
  tempTodo,
  deletedTodo,
  setTodoData,
  setDeletedTodo,
  setErrorMessage,
  inputRef,
  operatedTodo,
  setOperatedTodo,
}) => {
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

  const handleUpdate = (patchedTodo: Todo) => {
    setTodoData(cur =>
      cur.map(todo => (todo.id === patchedTodo.id ? patchedTodo : todo)),
    );
  };

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todoList.map((todo: Todo) => {
        const isOverlayActive =
          deletedTodo.includes(todo.id) || operatedTodo.includes(todo.id);

        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            isOverlayActive={isOverlayActive}
            handleDelete={handleDelete}
            handleSwitchStatus={handleSwitchStatus}
            setErrorMessage={setErrorMessage}
            handleUpdate={handleUpdate}
          />
        );
      })}

      {tempTodo && <TodoItem todo={tempTodo} />}
    </section>
  );
};
