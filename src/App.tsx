import React, { useState } from 'react';
import * as todosApi from './api/todos';
import { useTodoActions } from './hooks/useTodoActions';
import { prepareTodoList } from './utils/prepareTodoList';

import { FilterParams } from './types/FilterParams';
import { Todo } from './types/Todo';

import { UserWarning } from './UserWarning';
import { AppHeader } from './components/AppHeader';
import { TodoItem } from './components/TodoItem';
import { AppFooter } from './components/AppFooter';
import { ErrorNotification } from './components/ErrorNotification';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export const App: React.FC = () => {
  const [filterParam, setFilterParam] = useState(FilterParams.All);

  const {
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
  } = useTodoActions();

  const todoList = prepareTodoList(todoData, filterParam);
  const isLoading = !!todoInOperation.length;

  if (!todosApi.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <AppHeader
          isAllTodosCompleted={isAllTodoCompleted}
          shouldShowElement={shouldShowElement}
          addTodo={addTodo}
          toggleAll={toggleAll}
          isLoading={isLoading}
        />

        <section className="todoapp__main" data-cy="TodoList">
          <TransitionGroup>
            {todoList.map((todo: Todo) => {
              const isOverlayActive = todoInOperation.includes(todo.id);

              return (
                <CSSTransition key={todo.id} timeout={300} classNames="item">
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isOverlayActive={isOverlayActive}
                    deleteTodo={deleteTodo}
                    handleUpdate={handleUpdate}
                    toggleTodo={toggleTodo}
                  />
                </CSSTransition>
              );
            })}

            {tempTodo && (
              <CSSTransition key={0} timeout={300} classNames="temp-item">
                <TodoItem todo={tempTodo} />
              </CSSTransition>
            )}
          </TransitionGroup>
        </section>

        {shouldShowElement && (
          <AppFooter
            filterParam={filterParam}
            isCompletedTodos={isCompletedTodos}
            activeTodos={activeTodos}
            setFilterParam={setFilterParam}
            deleteCompleted={deleteCompleted}
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
