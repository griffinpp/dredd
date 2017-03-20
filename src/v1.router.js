import express from 'express';
import * as aController from './Analyzer.controller';

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/:userId/analyzers/:analyzerId/categorize', aController.categorize);
router.post('/user', aController.createUser);
router.patch('/:userId/analyzers/:analyzerId/learn', aController.learn);
router.patch('/:userId/analyzers/:analyzerId/unlearn', aController.unlearn);
router.patch('/:userId/analyzers/:analyzerId/relearn', aController.relearn);
router.get('/:userId/analyzers', aController.getAnalyzers);
router.post('/:userId/analyzers', aController.createAnalyzer);
router.get('/:userId/analyzers/:analyzerId', aController.getAnalyzer);
router.put('/:userId/analyzers/:analyzerId', aController.editAnalyzerName);
router.delete('/:userId/analyzers/:analyzerId', aController.removeAnalyzer);

export default router;
