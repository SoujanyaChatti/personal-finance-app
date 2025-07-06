import Category from '../models/Category.js';

// Default categories
const defaultCategories = [
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Investment', type: 'income' },
  { name: 'Bills', type: 'expense' },
  { name: 'Other', type: 'expense' },
];

export const listCategories = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userCategories = userId ? await Category.find({ userId }) : [];
    res.json([
      ...defaultCategories,
      ...userCategories.map(c => ({ name: c.name, type: c.type })),
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required.' });
    const exists = await Category.findOne({ userId, name });
    if (exists) return res.status(409).json({ error: 'Category already exists.' });
    const category = await Category.create({ userId, name, type });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
}; 