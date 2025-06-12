import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as todosApi from './api/todos';
import { FilterParams } from './types/FilterParams';

import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { ErrorNotification } from './components/ErrorNotification';
import { ErrorMessages } from './types/ErrorMessages';
import { TodoItem } from './components/TodoItem';
import { useTodoActions } from './hooks/useTodoActions';
import { useBulkTodoActions } from './hooks/useBulkTodoActions';
import { prepareTodoList } from './utils/prepareTodoList';

export const App: React.FC = () => {
  const [todoData, setTodoData] = useState<Todo[]>([]);

  const [todoTitle, setTodoTitle] = useState('');

  const [errorMessage, setErrorMessage] = useState(ErrorMessages.None);

  const [filterParam, setFilterParam] = useState(FilterParams.All);

  const [deletedTodo, setDeletedTodo] = useState<number[]>([]);

  const [operatedTodo, setOperatedTodo] = useState<number[]>([]); // смело в 2

  const [editingTodoId, setEditingTodoId] = useState<null | number>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    handleDelete,
    handleUpdate,
    handleSwitchStatus,
    tempTodo,
    isInputActive,
    isTodoSaving,
  } = useTodoActions({
    todoData,
    setTodoData,
    setErrorMessage,
    setTodoTitle,
    inputRef,
    setDeletedTodo,
    setEditingTodoId,
    setOperatedTodo,
  });

  const { activeTodos, isCompletedTodos, isAllTodosCompleted } = useMemo(() => {
    const active = todoData.filter(todo => !todo.completed).length;
    const completedExists = todoData.some(todo => todo.completed);
    const allCompleted =
      todoData.length > 0 && todoData.every(todo => todo.completed);

    return {
      activeTodos: active,
      isCompletedTodos: completedExists,
      isAllTodosCompleted: allCompleted,
    };
  }, [todoData]);

  const { handleClearCompleted, handleToggleAll } = useBulkTodoActions({
    todoData,
    setDeletedTodo,
    setErrorMessage,
    setTodoData,
    inputRef,
    setOperatedTodo,
    isAllTodosCompleted,
  });

  useEffect(() => {
    todosApi
      .getTodos()
      .then(setTodoData)
      .catch(() => setErrorMessage(ErrorMessages.OnGet));
  }, []);

  const shouldShowElement = todoData.length > 0 || activeTodos > 0;

  const todoList = prepareTodoList(todoData, filterParam);

  if (!todosApi.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <AppHeader
          onSubmit={handleSubmit}
          todoTitle={todoTitle}
          setTodoTitle={setTodoTitle}
          isInputActive={isInputActive}
          inputRef={inputRef}
          isAllTodosCompleted={isAllTodosCompleted}
          shouldShowElement={shouldShowElement}
          handleToggleAll={handleToggleAll}
        />

        <section className="todoapp__main" data-cy="TodoList">
          {todoList.map((todo: Todo) => {
            const isOverlayActive =
              deletedTodo.includes(todo.id) ||
              operatedTodo.includes(todo.id) ||
              isTodoSaving === todo.id;

            const isTodoEditing = editingTodoId === todo.id;

            return (
              <TodoItem
                key={todo.id}
                todo={todo}
                isOverlayActive={isOverlayActive}
                isTodoEditing={isTodoEditing}
                handleDelete={handleDelete}
                handleUpdate={handleUpdate}
                handleSwitchStatus={handleSwitchStatus}
                setEditingTodoId={setEditingTodoId}
              />
            );
          })}

          {tempTodo && <TodoItem todo={tempTodo} />}
        </section>

        {shouldShowElement && (
          <AppFooter
            filterParam={filterParam}
            isCompletedTodos={isCompletedTodos}
            activeTodos={activeTodos}
            setFilterParam={setFilterParam}
            handleClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};
