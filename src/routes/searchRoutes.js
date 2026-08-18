import express from 'express';
import { getGlobalSearch } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', getGlobalSearch);

export default router;
