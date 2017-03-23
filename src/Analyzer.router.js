import express from 'express';
import * as aController from './Analyzer.controller';

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/:analyzerId/categorize', aController.categorize);
router.patch('/:analyzerId/learn', aController.learn);
router.patch('/:analyzerId/unlearn', aController.unlearn);
router.patch('/:analyzerId/relearn', aController.relearn);
router.get('/', aController.getAnalyzers);
router.post('/', aController.createAnalyzer);
router.get('/:analyzerId', aController.getAnalyzer);
router.put('/:analyzerId', aController.editAnalyzerName);
router.delete('/:analyzerId', aController.removeAnalyzer);

export default router;
