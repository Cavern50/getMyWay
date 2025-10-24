import express from 'express';
import userRoutes from './routes/users';

const app = express();
const PORT = 3000;
// Middleware для парсинга JSON
app.use(express.json());
app.use('/users', userRoutes);

// Тестовый роут
app.get('/ping', (req, res) => {
    res.json({ message: 'pongping' });
});

app.get('/users', (req, res) => {
    console.log(req.url, res)
    res.json({})
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));