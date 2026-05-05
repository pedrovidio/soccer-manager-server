import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CreateGroupUseCase } from '../core/use-cases/CreateGroupUseCase.js';
import { InviteAthleteToGroupUseCase } from '../core/use-cases/InviteAthleteToGroupUseCase.js';
import { RespondGroupInviteUseCase } from '../core/use-cases/RespondGroupInviteUseCase.js';
import { ListInvitesUseCase } from '../core/use-cases/ListInvitesUseCase.js';
import { ListNotificationsUseCase } from '../core/use-cases/ListNotificationsUseCase.js';
import { PrismaGroupRepository } from '../infra/database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../infra/database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaGroupInviteRepository } from '../infra/database/prisma/repositories/PrismaGroupInviteRepository.js';
import { PrismaMatchInviteRepository } from '../infra/database/prisma/repositories/PrismaMatchInviteRepository.js';
import { PrismaMatchRepository } from '../infra/database/prisma/repositories/PrismaMatchRepository.js';
import { PrismaNotificationRepository } from '../infra/database/prisma/repositories/PrismaNotificationRepository.js';
import { WhatsAppService } from '../infra/services/WhatsAppService.js';

// ─── Setup ───────────────────────────────────────────────────────────────────

const prisma          = new PrismaClient();
const groupRepo       = new PrismaGroupRepository(prisma);
const athleteRepo     = new PrismaAthleteRepository();
const inviteRepo      = new PrismaGroupInviteRepository(prisma);
const notificationRepo = new PrismaNotificationRepository(prisma);
const whatsApp        = new WhatsAppService();

const createGroup       = new CreateGroupUseCase(groupRepo, athleteRepo);
const inviteAthlete     = new InviteAthleteToGroupUseCase(groupRepo, athleteRepo, inviteRepo, notificationRepo, whatsApp);
const respondInvite     = new RespondGroupInviteUseCase(groupRepo, inviteRepo, notificationRepo);
const matchInviteRepo   = new PrismaMatchInviteRepository(prisma);
const matchRepo         = new PrismaMatchRepository(prisma);
const listInvites       = new ListInvitesUseCase(inviteRepo, groupRepo, matchInviteRepo, matchRepo);
const listNotifications = new ListNotificationsUseCase(notificationRepo);

// ─── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(label: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err: any) {
    console.log(`  ❌ ${label}`);
    console.log(`     → ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// ─── Load fixtures from DB ───────────────────────────────────────────────────

const athletes = await prisma.athlete.findMany({ take: 31, select: { id: true, name: true } });
if (athletes.length < 31) {
  console.error('❌ Need at least 31 athletes in the database. Run the seed first.');
  process.exit(1);
}

const ADMIN    = athletes[0]!;
const MEMBERS  = athletes.slice(1, 31); // 30 members

console.log(`\n👤 Admin: ${ADMIN.name} (${ADMIN.id})`);
console.log(`👥 Members: ${MEMBERS.length} athletes\n`);

// ─── State ───────────────────────────────────────────────────────────────────

let groupId: string;
const inviteIds: string[] = [];

// ─── Cleanup helper ──────────────────────────────────────────────────────────

async function cleanup() {
  if (!groupId) return;
  await prisma.groupInvite.deleteMany({ where: { groupId } });
  await prisma.notification.deleteMany({ where: { referenceId: { in: inviteIds } } });
  // also clean admin notifications from this test run
  await prisma.notification.deleteMany({
    where: { athleteId: ADMIN.id, type: { in: ['INVITE_ACCEPTED', 'INVITE_DECLINED'] } },
  });
  await prisma.group.delete({ where: { id: groupId } });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log('━━━ CreateGroup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('creates group with admin correctly', async () => {
  const result = await createGroup.execute({
    adminId: ADMIN.id,
    name: 'Pelada dos Campeões',
    description: 'Grupo de futebol semanal em Porto Alegre',
    baseLocation: { latitude: -30.0350, longitude: -51.1980 },
  });
  groupId = result.id;
  assert(!!result.id, 'id must be defined');
  assert(result.name === 'Pelada dos Campeões', 'name must match');
  assert(result.adminIds.includes(ADMIN.id), 'admin must be in adminIds');
  assert(result.memberIds.length === 0, 'memberIds must start empty');
});

await test('rejects group with name shorter than 3 characters', async () => {
  let threw = false;
  try {
    await createGroup.execute({ adminId: ADMIN.id, name: 'AB', description: 'x' });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown');
});

await test('rejects group creation with non-existent admin', async () => {
  let threw = false;
  try {
    await createGroup.execute({
      adminId: '00000000-0000-0000-0000-000000000000',
      name: 'Grupo Inválido',
      description: 'x',
    });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown');
});

console.log('\n━━━ InviteAthletes (30 members) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('sends invites to all 30 athletes', async () => {
  for (const member of MEMBERS) {
    const result = await inviteAthlete.execute({
      adminId: ADMIN.id,
      groupId,
      athleteId: member.id,
    });
    assert(!!result.inviteId, 'inviteId must be defined');
    assert(result.status === 'PENDING', 'status must be PENDING');
    inviteIds.push(result.inviteId);
  }
  assert(inviteIds.length === 30, 'must have 30 invite ids');
});

await test('rejects duplicate invite for the same athlete', async () => {
  let threw = false;
  try {
    await inviteAthlete.execute({ adminId: ADMIN.id, groupId, athleteId: MEMBERS[0]!.id });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown on duplicate');
});

await test('rejects invite sent by non-admin', async () => {
  let threw = false;
  try {
    await inviteAthlete.execute({ adminId: MEMBERS[1]!.id, groupId, athleteId: MEMBERS[2]!.id });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown for non-admin');
});

console.log('\n━━━ ListInvites ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('lists pending invites for invited athlete', async () => {
  const result = await listInvites.execute({ athleteId: MEMBERS[0]!.id });
  assert(result.length >= 1, 'must have at least 1 invite');
  assert(result[0]!.groupName === 'Pelada dos Campeões', 'group name must match');
  assert(result[0]!.status === 'PENDING', 'status must be PENDING');
});

console.log('\n━━━ ListNotifications ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('athlete has GROUP_INVITE notification unread', async () => {
  const result = await listNotifications.execute({ athleteId: MEMBERS[0]!.id });
  assert(result.unreadCount >= 1, 'must have unread notifications');
  const invite = result.notifications.find((n) => n.type === 'GROUP_INVITE');
  assert(!!invite, 'must have GROUP_INVITE notification');
  assert(invite!.isRead === false, 'notification must be unread');
});

console.log('\n━━━ RespondInvite ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('athlete accepts invite and is added to group', async () => {
  const result = await respondInvite.execute({
    athleteId: MEMBERS[0]!.id,
    inviteId: inviteIds[0]!,
    accept: true,
  });
  assert(result.status === 'ACCEPTED', 'status must be ACCEPTED');
  const group = await groupRepo.findById(groupId);
  assert(group!.memberIds.includes(MEMBERS[0]!.id), 'athlete must be in memberIds');
});

await test('athlete declines invite and is NOT added to group', async () => {
  const result = await respondInvite.execute({
    athleteId: MEMBERS[1]!.id,
    inviteId: inviteIds[1]!,
    accept: false,
  });
  assert(result.status === 'DECLINED', 'status must be DECLINED');
  const group = await groupRepo.findById(groupId);
  assert(!group!.memberIds.includes(MEMBERS[1]!.id), 'athlete must NOT be in memberIds');
});

await test('rejects responding to an already-answered invite', async () => {
  let threw = false;
  try {
    await respondInvite.execute({ athleteId: MEMBERS[0]!.id, inviteId: inviteIds[0]!, accept: false });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown for already-answered invite');
});

await test('rejects responding to invite belonging to another athlete', async () => {
  let threw = false;
  try {
    await respondInvite.execute({ athleteId: MEMBERS[5]!.id, inviteId: inviteIds[2]!, accept: true });
  } catch {
    threw = true;
  }
  assert(threw, 'should have thrown for wrong athlete');
});

await test('admin receives INVITE_ACCEPTED notification', async () => {
  const result = await listNotifications.execute({ athleteId: ADMIN.id });
  const accepted = result.notifications.find((n) => n.type === 'INVITE_ACCEPTED');
  assert(!!accepted, 'admin must have INVITE_ACCEPTED notification');
});

console.log('\n━━━ Group final state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('group persists with correct data', async () => {
  const group = await groupRepo.findById(groupId);
  assert(group !== null, 'group must exist');
  assert(group!.name === 'Pelada dos Campeões', 'name must match');
  assert(group!.adminIds.includes(ADMIN.id), 'admin must be in adminIds');
  assert(group!.memberIds.length === 1, 'only 1 member accepted');
});

await test('listByAdmin returns the created group', async () => {
  const groups = await groupRepo.listByAdmin(ADMIN.id);
  assert(groups.some((g) => g.id === groupId), 'group must appear in admin list');
});

await test('listByMember returns group for athlete who accepted', async () => {
  const groups = await groupRepo.listByMember(MEMBERS[0]!.id);
  assert(groups.some((g) => g.id === groupId), 'group must appear in member list');
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n🏁 Results: ${passed} passed, ${failed} failed\n`);

await cleanup();
await prisma.$disconnect();

if (failed > 0) process.exit(1);
