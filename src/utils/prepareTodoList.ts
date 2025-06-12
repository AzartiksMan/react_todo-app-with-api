import { FilterParams } from '../types/FilterParams';
import { Todo } from '../types/Todo';

export const prepareTodoList = (
  todoData: Todo[],
  filter: FilterParams,
): Todo[] => {
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
