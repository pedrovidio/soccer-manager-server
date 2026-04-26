import 'dotenv/config';
import express from 'express';
import { athleteRouter } from './routes/athlete.routes.js';
import { assessmentRouter } from './routes/assessment.routes.js';
import { groupRouter } from './routes/group.routes.js';
import { matchRouter } from './routes/match.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { venueRouter } from './routes/venue/venue.routes.js';
import { historyRouter } from './routes/history.routes.js';
import { startCronJobs } from '../jobs/cron.js';

const app = express();
const PORT = 3333;

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(authRouter);
app.use(venueRouter);
app.use(athleteRouter);
app.use(assessmentRouter);
app.use(groupRouter);
app.use(matchRouter);
app.use(historyRouter);

startCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };