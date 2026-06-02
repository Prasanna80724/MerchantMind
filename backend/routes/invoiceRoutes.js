import express from 'express';
import { getPendingInvoices, approveInvoice, declineInvoice } from '../controllers/invoiceController.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(verifyToken);

router.get('/pending', getPendingInvoices);
router.post('/approve/:invoiceId', approveInvoice);  // Notice the `:invoiceId`
router.delete('/decline/:invoiceId', declineInvoice);  // Make sure this is correct

export default router;
