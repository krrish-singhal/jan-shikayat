import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Complaint, TranslationCache } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS } from '../src/constants/complaintStatus.js';
import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_CODES } from '../src/constants/languages.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Multilingual System Backend Suite', () => {
  let citizenUser, citizenToken;
  let otherCitizenUser, otherCitizenToken;
  let operatorUser, operatorToken;
  let dept;
  let complaint;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    dept = await Department.create({
      name: 'Road Infrastructure Department',
      code: 'ROAD',
      description: 'Maintains city roads',
      isActive: true,
    });

    citizenUser = await User.create({
      name: 'Rajesh Sharma',
      email: 'rajesh@example.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: ROLES.CITIZEN,
      preferredLanguage: 'en',
    });
    citizenToken = generateAccessToken(citizenUser);

    otherCitizenUser = await User.create({
      name: 'Pooja Verma',
      email: 'pooja@example.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: ROLES.CITIZEN,
      preferredLanguage: 'en',
    });
    otherCitizenToken = generateAccessToken(otherCitizenUser);

    operatorUser = await User.create({
      name: 'Sunil Operator',
      email: 'operator@civic.gov.in',
      passwordHash: await User.hashPassword('Password123!'),
      role: ROLES.OPERATOR,
      staffId: 'OP-0001',
      departmentId: dept._id,
      preferredLanguage: 'hi',
    });
    operatorToken = generateAccessToken(operatorUser);

    complaint = await Complaint.create({
      ticketNo: 'CMP-2026-999001',
      citizenId: citizenUser._id,
      departmentId: dept._id,
      description: 'There is a large pothole near the school causing major traffic delays.',
      imageUrl: '/uploads/pothole.jpg',
      location: {
        address: '12 Shivaji Nagar, Pune',
        latitude: 18.5204,
        longitude: 73.8567,
      },
      status: COMPLAINT_STATUS.SUBMITTED,
    });
  });

  it('GET /api/v1/languages - should return all 12 supported Indic and English languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.languages).toHaveLength(12);
    expect(res.body.data.defaultLanguage).toBe('en');

    const codes = res.body.data.languages.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('mr');
    expect(codes).toContain('bn');
    expect(codes).toContain('pa');
    expect(codes).toContain('gu');
    expect(codes).toContain('ta');
    expect(codes).toContain('te');
    expect(codes).toContain('kn');
    expect(codes).toContain('ml');
    expect(codes).toContain('or');
    expect(codes).toContain('as');
  });

  it('GET /api/v1/me/language - should return user preferred language', async () => {
    const res = await request(app)
      .get('/api/v1/me/language')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredLanguage).toBe('en');
  });

  it('PATCH /api/v1/me/language - should update preferred language to Hindi', async () => {
    const res = await request(app)
      .patch('/api/v1/me/language')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ language: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredLanguage).toBe('hi');

    // Verify in database
    const updated = await User.findById(citizenUser._id);
    expect(updated.preferredLanguage).toBe('hi');
  });

  it('PATCH /api/v1/me/language - should reject unsupported language codes', async () => {
    const res = await request(app)
      .patch('/api/v1/me/language')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ language: 'french_fr' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_LANGUAGE');
  });

  it('POST /api/v1/translation/detect-language - should detect language of Indic scripts', async () => {
    const res = await request(app)
      .post('/api/v1/translation/detect-language')
      .send({ text: 'सड़क पर बड़ा गड्ढा है' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(['hi', 'mr']).toContain(res.body.data.language);
  });

  it('POST /api/v1/translation/translate - should translate and populate cache', async () => {
    const res1 = await request(app)
      .post('/api/v1/translation/translate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        text: 'There is a large pothole near the school',
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        complaintId: complaint._id,
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.originalText).toBe('There is a large pothole near the school');
    expect(res1.body.data.targetLanguage).toBe('hi');

    // Second call with same text should hit cache
    const res2 = await request(app)
      .post('/api/v1/translation/translate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        text: 'There is a large pothole near the school',
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        complaintId: complaint._id,
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.cached).toBe(true);
    expect(res2.body.data.translatedText).toBe(res1.body.data.translatedText);
  });

  it('POST /api/v1/translation/translate - should enforce authorization on complaintId', async () => {
    // Other citizen attempting to translate Rajesh's complaint
    const res = await request(app)
      .post('/api/v1/translation/translate')
      .set('Authorization', `Bearer ${otherCitizenToken}`)
      .send({
        text: 'There is a large pothole near the school',
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        complaintId: complaint._id,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/v1/translation/translate - operator from complaint department should be authorized', async () => {
    const res = await request(app)
      .post('/api/v1/translation/translate')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        text: 'There is a large pothole near the school',
        sourceLanguage: 'en',
        targetLanguage: 'mr',
        complaintId: complaint._id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.targetLanguage).toBe('mr');
  });

  it('Original complaint text in MongoDB is never overwritten or mutated by translation', async () => {
    await request(app)
      .post('/api/v1/translation/translate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        text: complaint.description,
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        complaintId: complaint._id,
      });

    const refreshed = await Complaint.findById(complaint._id);
    expect(refreshed.description).toBe(
      'There is a large pothole near the school causing major traffic delays.'
    );
  });
});
