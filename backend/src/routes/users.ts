import { Router } from 'express';
import User from '../models/User';

const router = Router();

// Создание пользователя
router.post('/', async (req, res) => {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.json(user);
});

export default router;
