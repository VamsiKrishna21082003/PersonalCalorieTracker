import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendMessage, getHistory, deleteMessage, clearChat } from '../controllers/chatController';

const router = Router();

router.use(authenticate);

router.post('/message', sendMessage);
router.get('/history', getHistory);
router.delete('/message/:id', deleteMessage);
router.delete('/clear', clearChat);

export default router;
