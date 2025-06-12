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

// винести в фанк файл
const prepareTodoList = (todoData: Todo[], filter: FilterParams): Todo[] => {
  return todoData.filter(todo => {
    switch (filter) {
      case FilterParams.Active:
        return !todo.completed;
      case FilterParams.Completed:
        return todo.completed;
      default:
        return true;
    }
  });
};

export const App: React.FC = () => {
  const [todoData, setTodoData] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [todoTitle, setTodoTitle] = useState('');

  const [errorMessage, setErrorMessage] = useState(ErrorMessages.None);

  const [filterParam, setFilterParam] = useState(FilterParams.All);

  const [isInputActive, setIsInputActive] = useState(true);

  const [deletedTodo, setDeletedTodo] = useState<number[]>([]);

  const [operatedTodo, setOperatedTodo] = useState<number[]>([]);

  const [isTodoSaving, setTodoSaving] = useState<null | number>(null);

  const [editingTodoId, setEditingTodoId] = useState<null | number>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    todosApi
      .getTodos()
      .then(setTodoData)
      .catch(() => setErrorMessage(ErrorMessages.OnGet));
  }, []);

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

  const todoList = prepareTodoList(todoData, filterParam);
  const shouldShowElement = todoData.length > 0 || activeTodos > 0;

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
                handleDelete={handleDelete}
                handleSwitchStatus={handleSwitchStatus}
                handleUpdate={handleUpdate}
                isTodoEditing={isTodoEditing}
                setEditingTodoId={setEditingTodoId}
              />
            );
          })}

          {tempTodo && <TodoItem todo={tempTodo} />}
        </section>

        {shouldShowElement && (
          <AppFooter
            handleClearCompleted={handleClearCompleted}
            setFilterParam={setFilterParam}
            filterParam={filterParam}
            isCompletedTodos={isCompletedTodos}
            activeTodos={activeTodos}
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
