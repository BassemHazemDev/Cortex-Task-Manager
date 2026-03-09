import mongoose from 'mongoose';
import { Todo, ITodo } from '../../database/models/todo.model';
import { AppError } from '../../utils/handlers/appError';

class TodoService {
  async findAll(userId: string): Promise<ITodo[]> {
    return Todo.find({ createdBy: userId }).sort({ order: 1, _id: 1 });
  }

  async findById(userId: string, id: string): Promise<ITodo> {
    const todo = await Todo.findOne({ _id: id, createdBy: userId });
    if (!todo) {
      throw new AppError('Todo not found', 404);
    }
    return todo;
  }

  async create(userId: string, data: { title: string; description?: string; priority?: 'high' | 'medium' | 'low' }): Promise<ITodo> {
    const maxOrder = await Todo.findOne({ createdBy: userId }).sort({ order: -1 });
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const todo = await Todo.create({
      ...data,
      createdBy: userId,
      order,
    });

    return todo;
  }

  async update(userId: string, id: string, updates: any): Promise<ITodo> {
    const todo = await Todo.findOne({ _id: id, createdBy: userId });
    if (!todo) {
      throw new AppError('Todo not found', 404);
    }

    const updated = await Todo.findByIdAndUpdate(id, updates, { new: true });
    return updated!;
  }

  async delete(userId: string, id: string): Promise<ITodo> {
    const todo = await Todo.findOneAndDelete({ _id: id, createdBy: userId });
    if (!todo) {
      throw new AppError('Todo not found', 404);
    }
    return todo;
  }

  async toggleComplete(userId: string, id: string): Promise<ITodo> {
    const todo = await Todo.findOne({ _id: id, createdBy: userId });
    if (!todo) {
      throw new AppError('Todo not found', 404);
    }

    const updated = await Todo.findByIdAndUpdate(
      id,
      { isCompleted: !todo.isCompleted },
      { new: true }
    );
    return updated!;
  }

  async reorder(userId: string, activeId: string, overId: string): Promise<void> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [activeTodo, overTodo] = await Promise.all([
      Todo.findOne({ _id: activeId, createdBy: userObjectId }),
      Todo.findOne({ _id: overId, createdBy: userObjectId }),
    ]);

    if (!activeTodo || !overTodo) {
      throw new AppError('Todo not found', 404);
    }

    const activeOrder = activeTodo.order;
    const overOrder = overTodo.order;

    await Todo.updateMany(
      { createdBy: userObjectId, order: { $gte: overOrder, $lte: activeOrder } },
      { $inc: { order: -1 } }
    );

    await Todo.findByIdAndUpdate(activeId, { order: overOrder });
  }
}

export default new TodoService();
