// @ts-nocheck
/**
 * Election Validation Schemas
 */

import Joi from 'joi';

const createElectionSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Election title is required',
      }),
    description: Joi.string().trim().max(2000).allow('').optional(),
    startDate: Joi.date().iso().required()
      .messages({
        'date.format': 'Start date must be a valid ISO date',
        'any.required': 'Start date is required',
      }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
      .messages({
        'date.greater': 'End date must be after start date',
        'any.required': 'End date is required',
      }),
    candidates: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        party: Joi.string().trim().max(100).optional().default('Independent'),
      })
    ).optional().default([]),
  }),
};

const updateElectionSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid election ID format' }),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).optional(),
    description: Joi.string().trim().max(2000).allow('').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    status: Joi.string().valid('upcoming', 'active', 'completed').optional(),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

const addCandidateSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({ 'any.required': 'Candidate name is required' }),
    party: Joi.string().trim().max(100).optional().default('Independent'),
  }),
};

const electionIdParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid election ID format' }),
  }),
};

export {  };

