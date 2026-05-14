import { Router } from 'express';

export const marketplaceRouter = Router();

// In-memory store for MVP demo — replace with Sui on-chain queries in production
const listings: any[] = [];

/**
 * POST /api/marketplace/listings
 * Create a data listing (mirrors the on-chain DataListing object).
 */
marketplaceRouter.post('/listings', (req, res) => {
  const { ownerAddress, anonymizedBlobId, dataCategory, priceMist, studyId } = req.body;
  if (!ownerAddress || !anonymizedBlobId || !dataCategory || !priceMist) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const listing = {
    id: `listing_${Date.now()}`,
    ownerAddress,
    anonymizedBlobId,
    dataCategory,
    priceMist: Number(priceMist),
    studyId: studyId ?? '',
    active: true,
    createdAt: new Date().toISOString(),
  };
  listings.push(listing);
  res.status(201).json(listing);
});

/**
 * GET /api/marketplace/listings
 * List all active data listings.
 */
marketplaceRouter.get('/listings', (req, res) => {
  const { category } = req.query;
  const active = listings.filter(l =>
    l.active && (!category || l.dataCategory === category)
  );
  res.json({ listings: active, count: active.length });
});

/**
 * GET /api/marketplace/listings/:id
 */
marketplaceRouter.get('/listings/:id', (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(listing);
});
