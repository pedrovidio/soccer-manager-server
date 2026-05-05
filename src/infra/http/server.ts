import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { athleteRouter } from './routes/athlete.routes.js';
import { assessmentRouter } from './routes/assessment.routes.js';
import { groupRouter } from './routes/group.routes.js';
import { matchRouter } from './routes/match.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { venueRouter } from './routes/venue/venue.routes.js';
import { historyRouter } from './routes/history.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { startCronJobs } from '../jobs/cron.js';

const app = express();
const PORT = 3333;

app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.resolve(__dirname, '../../../uploads')));
app.use(authRouter);
app.use(venueRouter);
app.use(athleteRouter);
app.use(assessmentRouter);
app.use(groupRouter);
app.use(matchRouter);
app.use(historyRouter);
app.use(notificationRouter);

startCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };