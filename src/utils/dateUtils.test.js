import { isOverdue } from './dateUtils';

describe('dateUtils', () => {
    describe('isOverdue', () => {
        it('should return true if task is overdue', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const pad = (n) => n.toString().padStart(2, '0');
            const dateStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

            const task = {
                dueDate: dateStr,
                dueTime: '12:00',
                isCompleted: false
            };

            expect(isOverdue(task, new Date())).toBe(true);
        });

        it('should return false if task is in future', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const pad = (n) => n.toString().padStart(2, '0');
            const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

            const task = {
                dueDate: dateStr,
                dueTime: '12:00',
                isCompleted: false
            };

            expect(isOverdue(task, new Date())).toBe(false);
        });
    });
});
