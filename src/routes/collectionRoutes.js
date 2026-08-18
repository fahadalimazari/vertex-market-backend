import express from 'express';
import {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollections,
  getCollectionBySlug
} from '../controllers/collectionController.js';

const router = express.Router();

router.route('/')
  .get(getCollections)
  .post(createCollection);

router.route('/:slug')
  .get(getCollectionBySlug);

router.route('/:id')
  .put(updateCollection)
  .delete(deleteCollection);

export default router;
