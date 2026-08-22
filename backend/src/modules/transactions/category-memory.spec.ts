import { pickCategoryMemory } from './category-memory';

describe('pickCategoryMemory', () => {
  const dining = { title: 'Lunch', merchant: 'Swiggy', categoryId: 'd1', categoryName: 'Dining' };
  const groceries = { title: 'Big Bazaar', merchant: null, categoryId: 'g1', categoryName: 'Groceries' };

  it('returns null for short queries', () => {
    expect(pickCategoryMemory('s', [dining])).toBeNull();
  });

  it('matches a merchant exactly', () => {
    expect(pickCategoryMemory('swiggy', [dining, groceries])?.categoryName).toBe('Dining');
  });

  it('matches a title when merchant is missing', () => {
    expect(pickCategoryMemory('big bazaar', [groceries])?.categoryId).toBe('g1');
  });
});
