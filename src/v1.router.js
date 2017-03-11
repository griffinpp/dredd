import express from 'express';
import * as aController from './Analyzer.controller';

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/:id/categorize', aController.categorize);
router.put('/:id/categorizeLearn', aController.categorizeAndLearn);
router.put('/:id/learn', aController.learn);
router.put('/:id/unlearn', aController.unlearn);
router.put('/:id/recategorize', aController.recategorize);
router.get('/', aController.getAllAnalyzers);
router.delete('/:id', aController.deleteAnalyzer);
router.post('/', aController.createAnalyzer);
router.put('/:id', aController.editAnalyzerName);

export default router;
