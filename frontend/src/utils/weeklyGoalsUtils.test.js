import {
  getSaturdayOfWeek,
  getFridayOfWeek,
  getWeekKey,
  getNextWeekKey,
  getPrevWeekKey,
  generatePartitionCards,
} from './weeklyGoalsUtils';

describe('weeklyGoalsUtils', () => {
  describe('Week arrangement (Saturday to Friday)', () => {
    test('should identify Saturday as the start of the week for any date within that week', () => {
      // 2026-09-26 is a Saturday
      const saturday = new Date(2026, 8, 26);
      expect(saturday.getDay()).toBe(6);

      const satStart = getSaturdayOfWeek(saturday);
      expect(satStart.getFullYear()).toBe(2026);
      expect(satStart.getMonth()).toBe(8);
      expect(satStart.getDate()).toBe(26);

      // 2026-09-28 is a Monday in the same week
      const monday = new Date(2026, 8, 28);
      expect(getWeekKey(monday)).toBe('2026-09-26');

      // 2026-10-02 is a Friday in the same week
      const friday = new Date(2026, 9, 2);
      expect(getWeekKey(friday)).toBe('2026-09-26');
    });

    test('should calculate Friday as the end of the week', () => {
      const saturday = new Date(2026, 8, 26);
      const fridayEnd = getFridayOfWeek(saturday);
      expect(fridayEnd.getDate()).toBe(2);
      expect(fridayEnd.getMonth()).toBe(9); // October
    });

    test('should correctly step between consecutive Saturday week keys', () => {
      expect(getNextWeekKey('2026-09-26')).toBe('2026-10-03');
      expect(getPrevWeekKey('2026-09-26')).toBe('2026-09-19');
    });
  });

  describe('Mission Partitioning', () => {
    test('should partition mission by hours per card', () => {
      const cards = generatePartitionCards({
        title: 'Project Backend',
        description: 'Implement API routes',
        totalHours: 3,
        partitionType: 'hours',
        partitionValue: 1,
        goalId: 'test_goal',
      });

      expect(cards).toHaveLength(3);
      expect(cards[0].hours).toBe(1);
      expect(cards[1].hours).toBe(1);
      expect(cards[2].hours).toBe(1);
      expect(cards[0].title).toBe('Project Backend (Card 1/3)');
      expect(cards[0].assignedDate).toBeNull();
      expect(cards[0].isCompleted).toBe(false);
    });

    test('should partition mission by number of split parts', () => {
      const cards = generatePartitionCards({
        title: 'Design Review',
        description: 'Figma mockups',
        totalHours: 6,
        partitionType: 'parts',
        partitionValue: 3,
        goalId: 'test_goal_2',
      });

      expect(cards).toHaveLength(3);
      expect(cards[0].hours).toBe(2);
      expect(cards[1].hours).toBe(2);
      expect(cards[2].hours).toBe(2);
      expect(cards[0].title).toBe('Design Review (Part 1/3)');
    });
  });
});
