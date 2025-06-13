import React, { useRef, useState } from 'react';
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
import { prepareTodoList } from './utils/prepareTodoList';

export const App: React.FC = () => {
  const [todoTitle, setTodoTitle] = useState('');

  const [errorMessage, setErrorMessage] = useState(ErrorMessages.None);

  const [filterParam, setFilterParam] = useState(FilterParams.All);

  const [editingTodoId, setEditingTodoId] = useState<null | number>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useTodoActions({
    inputRef,
    setErrorMessage,
    setTodoTitle,
    setEditingTodoId,
  });

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
          isAllTodosCompleted={isAllTodoCompleted}
          shouldShowElement={shouldShowElement}
          handleToggleAll={handleToggleAll}
        />

        <section className="todoapp__main" data-cy="TodoList">
          {todoList.map((todo: Todo) => {
            const isOverlayActive = todoInOperation.includes(todo.id);
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
