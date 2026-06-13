/**
 * Route Aggregator
 * Mounts all route modules under /api prefix.
 */

const { Router } = require('express');

const authRoutes = require('./auth.routes');
const electionRoutes = require('./election.routes');
const voteRoutes = require('./vote.routes');
const userRoutes = require('./user.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/elections', electionRoutes);
router.use('/votes', voteRoutes);
router.use('/users', userRoutes);

module.exports = router;
