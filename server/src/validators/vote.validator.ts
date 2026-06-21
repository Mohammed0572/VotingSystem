// @ts-nocheck
/**
 * Vote Validation Schemas
 */

import Joi from 'joi';

const castVoteSchema = {
  body: Joi.object({
    electionId: Joi.string().hex().length(24).required()
      .messages({
        'string.length': 'Invalid election ID format',
        'any.required': 'Election ID is required',
      }),
    candidateId: Joi.string().hex().length(24).required()
      .messages({
        'string.length': 'Invalid candidate ID format',
        'any.required': 'Candidate ID is required',
      }),
  }),
};

const voteStatusSchema = {
  params: Joi.object({
    electionId: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid election ID format' }),
  }),
};

export {  };

