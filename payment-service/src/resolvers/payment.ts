import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';
import { db } from '../shared/db';
import { env } from '../config/env';
import { paystackTransfers } from '../paystack';
import { requireAuth, requireAccountType } from './helpers';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapEscrow(row: any) {
  return {
    id:          row.id,
    projectId:   row.project_id,
    businessId:  row.business_id,
    studentId:   row.student_id,
    amount:      parseFloat(row.amount),
    currency:    row.currency,
    gateway:     row.gateway,
    gatewayRef:  row.gateway_ref ?? null,
    status:      row.status,
    platformFee: row.platform_fee != null ? parseFloat(row.platform_fee) : null,
    createdAt:   row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    releasedAt:  row.released_at
      ? (row.released_at instanceof Date ? row.released_at.toISOString() : String(row.released_at))
      : null,
  };
}

function mapMilestone(row: any) {
  return {
    id:         row.id,
    escrowId:   row.escrow_id,
    label:      row.label,
    amount:     parseFloat(row.amount),
    percentage: row.percentage != null ? parseInt(row.percentage, 10) : null,
    status:     row.status,
    releasedAt: row.released_at
      ? (row.released_at instanceof Date ? row.released_at.toISOString() : String(row.released_at))
      : null,
  };
}

function mapTransaction(row: any) {
  return {
    id:         row.id,
    userId:     row.user_id,
    escrowId:   row.escrow_id,
    type:       row.type,
    amount:     parseFloat(row.amount),
    currency:   row.currency,
    gatewayRef: row.gateway_ref ?? null,
    createdAt:  row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

// Apply the DB side of an escrow release once the Paystack transfer is on its
// way. Shared by releaseFunds (no-OTP path) and finalizeReleaseOtp (OTP path).
async function completeRelease(escrow: any, transferRef: string) {
  const currency  = escrow.currency as string;
  const fee       = escrow.platform_fee != null ? parseFloat(escrow.platform_fee) : 0;
  const netAmount = parseFloat(escrow.amount) - fee;

  const updatedEscrow = await db.query(
    `UPDATE escrow_accounts
        SET status = 'released', released_at = NOW(), pending_transfer_code = NULL
      WHERE id = $1
      RETURNING *`,
    [escrow.id]
  );

  await db.query(
    `UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [escrow.project_id]
  );

  await db.query(
    `INSERT INTO payment_transactions (id, user_id, escrow_id, type, amount, currency, gateway_ref)
     VALUES ($1, $2, $3, 'release', $4, $5, $6)`,
    [randomUUID(), escrow.student_id, escrow.id, netAmount, currency, transferRef]
  );

  if (fee > 0) {
    await db.query(
      `INSERT INTO payment_transactions (id, user_id, escrow_id, type, amount, currency, gateway_ref)
       VALUES ($1, $2, $3, 'fee', $4, $5, $6)`,
      [randomUUID(), escrow.business_id, escrow.id, fee, currency, transferRef]
    );
  }

  await db.query(
    `UPDATE student_profiles
        SET total_earnings = total_earnings + $2, updated_at = NOW()
      WHERE user_id = $1`,
    [escrow.student_id, netAmount]
  );

  return mapEscrow(updatedEscrow.rows[0]);
}

// ── Query resolvers ───────────────────────────────────────────────────────────

export const paymentQueries = {
  async escrow(_: unknown, { projectId }: { projectId: string }, _ctx: any) {
    const result = await db.query(
      `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    return result.rowCount ? mapEscrow(result.rows[0]) : null;
  },

  async myEscrows(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);
    const result = await db.query(
      `SELECT * FROM escrow_accounts WHERE business_id = $1 OR student_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map(mapEscrow);
  },

  async transactions(_: unknown, { escrowId }: { escrowId: string }, _ctx: any) {
    const result = await db.query(
      `SELECT * FROM payment_transactions WHERE escrow_id = $1 ORDER BY created_at DESC`,
      [escrowId]
    );
    return result.rows.map(mapTransaction);
  },

  async milestones(_: unknown, { escrowId }: { escrowId: string }, _ctx: any) {
    const result = await db.query(
      `SELECT * FROM milestones WHERE escrow_id = $1 ORDER BY created_at ASC`,
      [escrowId]
    );
    return result.rows.map(mapMilestone);
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const paymentMutations = {
  async initiateEscrow(
    _: unknown,
    { input }: { input: {
      projectId: string;
      studentId: string;
      amount: number;
      currency?: string;
      gateway?: string;
      gatewayRef?: string;
    }},
    ctx: any
  ) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    // Check no existing escrow for this project
    const existing = await db.query(
      `SELECT id FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
      [input.projectId]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      throw new GraphQLError('An escrow account already exists for this project', {
        extensions: { code: 'CONFLICT' },
      });
    }

    const platformFee = input.amount * env.PLATFORM_FEE_PERCENT / 100;
    const currency    = input.currency ?? 'NGN';
    const gateway     = input.gateway  ?? 'paystack';
    const escrowId    = randomUUID();

    // Insert escrow with status='held'
    const escrowResult = await db.query(
      `INSERT INTO escrow_accounts
         (id, project_id, business_id, student_id, amount, currency, gateway, gateway_ref, status, platform_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'held', $9)
       RETURNING *`,
      [
        escrowId,
        input.projectId,
        userId,
        input.studentId,
        input.amount,
        currency,
        gateway,
        input.gatewayRef ?? null,
        platformFee,
      ]
    );

    // Insert deposit transaction
    await db.query(
      `INSERT INTO payment_transactions
         (id, user_id, escrow_id, type, amount, currency, gateway_ref)
       VALUES ($1, $2, $3, 'deposit', $4, $5, $6)`,
      [
        randomUUID(),
        userId,
        escrowId,
        input.amount,
        currency,
        input.gatewayRef ?? null,
      ]
    );

    // Update project status to 'in_progress' if it's 'open'
    await db.query(
      `UPDATE projects SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'open'`,
      [input.projectId]
    );

    return mapEscrow(escrowResult.rows[0]);
  },

  async releaseFunds(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    // Fetch escrow and verify ownership + status
    const escrowResult = await db.query(
      `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
      throw new GraphQLError('Escrow not found for this project', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const escrow = escrowResult.rows[0];

    if (escrow.business_id !== userId) {
      throw new GraphQLError('Only the business owner can release funds', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    if (escrow.status !== 'held') {
      throw new GraphQLError(`Cannot release funds: escrow status is '${escrow.status}'`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // A transfer was already initiated and is awaiting OTP — don't start another.
    if (escrow.pending_transfer_code) {
      throw new GraphQLError(
        'This payout is awaiting OTP confirmation. Finalize it with finalizeReleaseOtp using the code sent to the platform Paystack contact.',
        { extensions: { code: 'TRANSFER_OTP_REQUIRED', transferCode: escrow.pending_transfer_code } }
      );
    }

    const currency  = escrow.currency as string;
    const netAmount = parseFloat(escrow.amount)
      - (escrow.platform_fee != null ? parseFloat(escrow.platform_fee) : 0);

    // ── Real payout: transfer the talent's net share to their bank ──────────────
    // The full amount sits in the platform's Paystack balance (escrow); on release
    // we move the talent's net share to their verified bank account. Done before
    // any DB write so a failed transfer leaves the escrow 'held' (no money lost).
    const bankRes = await db.query(
      `SELECT bank_code, account_number, account_name
         FROM student_profiles WHERE user_id = $1`,
      [escrow.student_id]
    );
    const bank = bankRes.rows[0];
    if (!bank?.bank_code || !bank?.account_number) {
      throw new GraphQLError(
        "The talent hasn't set up their payout account yet. They must add their bank details under Settings → Payouts before funds can be released.",
        { extensions: { code: 'PAYOUT_NOT_SETUP' } }
      );
    }

    let transfer: { transferCode: string; status: string; reference: string };
    try {
      const recipientCode = await paystackTransfers.createRecipient({
        name:          bank.account_name ?? 'QueenSkiilia talent',
        accountNumber: bank.account_number,
        bankCode:      bank.bank_code,
        currency,
      });
      transfer = await paystackTransfers.transfer({
        amountKobo:    Math.round(netAmount * 100),
        recipientCode,
        reference:     `release-${escrow.id}`,
        reason:        `QueenSkiilia payout for project ${projectId}`,
      });
    } catch (err: any) {
      throw new GraphQLError('Payout transfer failed: ' + (err?.message ?? 'unknown error'), {
        extensions: { code: 'TRANSFER_FAILED' },
      });
    }

    // OTP-protected integration: the transfer is initiated but a one-time code was
    // sent to the platform's Paystack contact. Park it and require finalize.
    if (transfer.status === 'otp') {
      await db.query(
        `UPDATE escrow_accounts SET pending_transfer_code = $2 WHERE id = $1`,
        [escrow.id, transfer.transferCode]
      );
      throw new GraphQLError(
        'A one-time code was sent to the platform Paystack contact to confirm this payout. Finalize the release with finalizeReleaseOtp(projectId, otp).',
        { extensions: { code: 'TRANSFER_OTP_REQUIRED', transferCode: transfer.transferCode } }
      );
    }

    // success / pending / queued → money is on its way; complete the release.
    return completeRelease(escrow, transfer.transferCode || transfer.reference);
  },

  async finalizeReleaseOtp(
    _: unknown,
    { projectId, otp }: { projectId: string; otp: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    const escrowResult = await db.query(
      `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    if (!escrowResult.rowCount) {
      throw new GraphQLError('Escrow not found for this project', { extensions: { code: 'NOT_FOUND' } });
    }
    const escrow = escrowResult.rows[0];

    if (escrow.business_id !== userId) {
      throw new GraphQLError('Only the business owner can finalize this payout', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    if (escrow.status !== 'held' || !escrow.pending_transfer_code) {
      throw new GraphQLError('No payout is awaiting OTP confirmation for this project', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    try {
      await paystackTransfers.finalizeTransfer(escrow.pending_transfer_code, otp);
    } catch (err: any) {
      throw new GraphQLError('Could not finalize payout (check the OTP): ' + (err?.message ?? 'unknown error'), {
        extensions: { code: 'TRANSFER_OTP_INVALID' },
      });
    }

    return completeRelease(escrow, escrow.pending_transfer_code);
  },

  async refundEscrow(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    // Fetch escrow and verify ownership + status
    const escrowResult = await db.query(
      `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
      throw new GraphQLError('Escrow not found for this project', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const escrow = escrowResult.rows[0];

    if (escrow.business_id !== userId) {
      throw new GraphQLError('Only the business owner can refund this escrow', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    if (escrow.status !== 'held' && escrow.status !== 'disputed') {
      throw new GraphQLError(
        `Cannot refund: escrow status is '${escrow.status}'. Must be 'held' or 'disputed'`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    // Set escrow status='refunded'
    const updatedEscrow = await db.query(
      `UPDATE escrow_accounts SET status = 'refunded' WHERE id = $1 RETURNING *`,
      [escrow.id]
    );

    // Set project status='cancelled'
    await db.query(
      `UPDATE projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );

    // Insert refund transaction
    await db.query(
      `INSERT INTO payment_transactions
         (id, user_id, escrow_id, type, amount, currency, gateway_ref)
       VALUES ($1, $2, $3, 'refund', $4, $5, $6)`,
      [
        randomUUID(),
        userId,
        escrow.id,
        parseFloat(escrow.amount),
        escrow.currency,
        escrow.gateway_ref ?? null,
      ]
    );

    return mapEscrow(updatedEscrow.rows[0]);
  },

  async addMilestone(
    _: unknown,
    { input }: { input: {
      escrowId: string;
      label: string;
      amount: number;
      percentage?: number;
    }},
    ctx: any
  ) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    // Verify the escrow belongs to this business owner
    const escrowResult = await db.query(
      `SELECT * FROM escrow_accounts WHERE id = $1 LIMIT 1`,
      [input.escrowId]
    );
    if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
      throw new GraphQLError('Escrow not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const escrow = escrowResult.rows[0];
    if (escrow.business_id !== userId) {
      throw new GraphQLError('Only the business owner can add milestones', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const result = await db.query(
      `INSERT INTO milestones (id, escrow_id, label, amount, percentage, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        randomUUID(),
        input.escrowId,
        input.label,
        input.amount,
        input.percentage ?? null,
      ]
    );

    return mapMilestone(result.rows[0]);
  },

  async releaseMilestone(_: unknown, { milestoneId }: { milestoneId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    // Fetch milestone and verify ownership via escrow
    const milestoneResult = await db.query(
      `SELECT m.*, e.business_id FROM milestones m
       JOIN escrow_accounts e ON e.id = m.escrow_id
       WHERE m.id = $1 LIMIT 1`,
      [milestoneId]
    );
    if (!milestoneResult.rowCount || milestoneResult.rowCount === 0) {
      throw new GraphQLError('Milestone not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const milestone = milestoneResult.rows[0];

    if (milestone.business_id !== userId) {
      throw new GraphQLError('Only the business owner can release milestones', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const result = await db.query(
      `UPDATE milestones
       SET status = 'released', released_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [milestoneId]
    );

    return mapMilestone(result.rows[0]);
  },
};

// ── Federation __resolveReference ────────────────────────────────────────────

export const escrowReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM escrow_accounts WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapEscrow(result.rows[0]) : null;
  },
};

export const milestoneReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM milestones WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapMilestone(result.rows[0]) : null;
  },
};

export const transactionReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM payment_transactions WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapTransaction(result.rows[0]) : null;
  },
};
