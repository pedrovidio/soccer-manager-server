import 'dotenv/config';
import express from 'express';
import { athleteRouter } from './routes/athlete.routes.js';

const app = express();
const PORT = 3333;

app.use(express.json());
app.use(athleteRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };