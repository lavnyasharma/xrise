import request from 'supertest';
import { buildApp } from '../src/app';
import { Ticket } from '../src/models/Ticket';
import { clearDB, startTestDB, stopTestDB } from './setup';
import { loginAs, seedUser } from './helpers';

const app = buildApp();

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('Public ticket creation', () => {
  it('creates a ticket without auth', async () => {
    const res = await request(app).post('/api/tickets').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Cannot log in',
      body: 'I get a 500 error when I try to log in.',
      priority: 'high',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.priority).toBe('high');
  });

  it('rejects invalid payloads', async () => {
    const res = await request(app).post('/api/tickets').send({ email: 'nope' });
    expect(res.status).toBe(400);
  });

  it('returns ticket status when email matches', async () => {
    const created = await request(app).post('/api/tickets').send({
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Bug',
      body: 'Something is broken',
    });
    const id = created.body.data.id;

    const res = await request(app)
      .post('/api/tickets/status')
      .send({ ticketId: id, email: 'jane@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.status).toBe('open');
  });

  it('does not leak tickets to wrong email', async () => {
    const created = await request(app).post('/api/tickets').send({
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Bug',
      body: 'Something is broken',
    });
    const id = created.body.data.id;

    const res = await request(app)
      .post('/api/tickets/status')
      .send({ ticketId: id, email: 'someone@else.com' });

    expect(res.status).toBe(404);
  });
});

describe('Role-based ticket access', () => {
  it('requires auth to list tickets', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  it('agent sees only tickets assigned to them', async () => {
    const agent1 = await seedUser('agent1@test.com', 'agent');
    const agent2 = await seedUser('agent2@test.com', 'agent');

    await Ticket.create([
      {
        name: 'a',
        email: 'a@test.com',
        subject: 'one',
        body: 'alpha body text',
        assignee: agent1.id,
      },
      {
        name: 'b',
        email: 'b@test.com',
        subject: 'two',
        body: 'beta body text',
        assignee: agent2.id,
      },
      { name: 'c', email: 'c@test.com', subject: 'three', body: 'gamma body text' },
    ]);

    const token = await loginAs(app, agent1.email, agent1.password);
    const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].subject).toBe('one');
  });

  it('admin sees all tickets', async () => {
    const admin = await seedUser('admin@test.com', 'admin');
    const agent = await seedUser('agent@test.com', 'agent');

    await Ticket.create([
      { name: 'a', email: 'a@x.com', subject: 'one', body: 'alpha', assignee: agent.id },
      { name: 'b', email: 'b@x.com', subject: 'two', body: 'beta' },
    ]);

    const token = await loginAs(app, admin.email, admin.password);
    const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
  });

  it('forbids agents from reassigning tickets', async () => {
    const agent = await seedUser('agent@test.com', 'agent');
    const otherAgent = await seedUser('agent2@test.com', 'agent');
    const ticket = await Ticket.create({
      name: 'x',
      email: 'x@x.com',
      subject: 's',
      body: 'b',
      assignee: agent.id,
    });

    const token = await loginAs(app, agent.email, agent.password);
    const res = await request(app)
      .patch(`/api/tickets/${ticket._id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: otherAgent.id });

    expect(res.status).toBe(403);
  });

  it('allows admin to reassign tickets', async () => {
    const admin = await seedUser('admin@test.com', 'admin');
    const agent = await seedUser('agent@test.com', 'agent');
    const ticket = await Ticket.create({
      name: 'x',
      email: 'x@x.com',
      subject: 's',
      body: 'b',
    });

    const token = await loginAs(app, admin.email, admin.password);
    const res = await request(app)
      .patch(`/api/tickets/${ticket._id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: agent.id });

    expect(res.status).toBe(200);
    expect(String(res.body.data.assignee)).toBe(agent.id);
  });

  it('agent cannot view tickets not assigned to them', async () => {
    const agent1 = await seedUser('agent1@test.com', 'agent');
    const agent2 = await seedUser('agent2@test.com', 'agent');
    const ticket = await Ticket.create({
      name: 'x',
      email: 'x@x.com',
      subject: 's',
      body: 'b',
      assignee: agent2.id,
    });

    const token = await loginAs(app, agent1.email, agent1.password);
    const res = await request(app)
      .get(`/api/tickets/${ticket._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
