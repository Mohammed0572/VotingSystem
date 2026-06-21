// @ts-nocheck
/**
 * Election Routes
 * POST   /api/elections              — Create election (admin)
 * GET    /api/elections              — List all elections
 * GET    /api/elections/:id          — Get election by ID
 * PATCH  /api/elections/:id          — Update election (admin)
 * DELETE /api/elections/:id          — Delete election (admin)
 * POST   /api/elections/:id/candidates — Add candidate (admin)
 * GET    /api/elections/:id/results  — Get results
 */

import { Router } from 'express';
import electionController from '../controllers/election.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { ROLES } from '../utils/constants';
import {
  createElectionSchema,
  updateElectionSchema,
  addCandidateSchema,
  electionIdParamSchema,
} from '../validators/election.validator';

const router = Router();

// All election routes require authentication
router.use(authenticate);

// ── Admin Routes ─────────────────────────────────────────
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(createElectionSchema),
  electionController.createElection
);

router.patch(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(updateElectionSchema),
  electionController.updateElection
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(electionIdParamSchema),
  electionController.deleteElection
);

router.post(
  '/:id/candidates',
  authorize(ROLES.ADMIN),
  validate(addCandidateSchema),
  electionController.addCandidate
);

// ── Authenticated Routes (all roles) ─────────────────────
router.get('/', electionController.getAllElections);

router.get(
  '/:id',
  validate(electionIdParamSchema),
  electionController.getElection
);

router.get(
  '/:id/results',
  validate(electionIdParamSchema),
  electionController.getResults
);

export default router;

