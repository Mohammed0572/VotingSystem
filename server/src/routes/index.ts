// @ts-nocheck
/**
 * Route Aggregator
 * Mounts all route modules under /api prefix.
 */

import { Router } from 'express';

import authRoutes from './auth.routes';
import electionRoutes from './election.routes';
import voteRoutes from './vote.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/elections', electionRoutes);
router.use('/votes', voteRoutes);
router.use('/users', userRoutes);

export default router;

