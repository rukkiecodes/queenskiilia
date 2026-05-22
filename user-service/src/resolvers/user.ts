import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { requireAuth } from './helpers';
import type { ServiceContext } from '../context';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapUser(row: any) {
  return {
    id:              row.id,
    email:           row.email,
    accountType:     row.account_type,
    fullName:        row.full_name,
    avatarUrl:       row.avatar_url,
    country:         row.country,
    emailVerified:   row.email_verified,
    phoneVerified:   row.phone_verified,
    isVerified:      row.is_verified,
    verifiedBadge:   row.verified_badge,
    isActive:        row.is_active,
    isFlagged:       row.is_flagged,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

function mapStudentProfile(row: any) {
  return {
    userId:         row.user_id,
    bio:            row.bio,
    university:     row.university,
    graduationYear: row.graduation_year,
    skills:         row.skills ?? [],
    skillLevel:     row.skill_level,
    totalEarnings:  parseFloat(row.total_earnings ?? '0'),
    averageRating:  row.average_rating ? parseFloat(row.average_rating) : null,
    portfolioUrl:   row.portfolio_url,
    updatedAt:      row.updated_at,
  };
}

function mapBusinessProfile(row: any) {
  return {
    userId:              row.user_id,
    companyName:         row.company_name,
    website:             row.website,
    industry:            row.industry,
    country:             row.country,
    description:         row.description,
    totalProjectsPosted: row.total_projects_posted ?? 0,
    averageRating:       row.average_rating ? parseFloat(row.average_rating) : null,
    updatedAt:           row.updated_at,
  };
}

function mapVerification(row: any) {
  return {
    id:          row.id,
    userId:      row.user_id,
    type:        row.type,
    status:      row.status,
    documentUrl: row.document_url,
    adminNote:   row.admin_note,
    submittedAt: row.submitted_at,
    reviewedAt:  row.reviewed_at,
  };
}

// ── Query resolvers ───────────────────────────────────────────────────────────

export const userQueries = {
  async me(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `SELECT * FROM users WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (result.rowCount === 0) {
      throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    }

    return mapUser(result.rows[0]);
  },

  async user(_: unknown, { id }: { id: string }, ctx: any) {
    const result = await db.query(
      `SELECT * FROM users WHERE id = $1 AND is_active = TRUE`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    }

    return mapUser(result.rows[0]);
  },

  async users(
    _: unknown,
    args: {
      accountType?: string;
      search?: string;
      skillLevel?: string;
      country?: string;
      minRating?: number;
      limit?: number;
      offset?: number;
    },
    ctx: any
  ) {
    const safeLimit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;

    const where: string[] = ['u.is_active = TRUE'];
    const params: any[] = [];
    let i = 1;

    if (args.accountType) {
      where.push(`u.account_type = $${i++}`);
      params.push(args.accountType);
    }
    if (args.country) {
      where.push(`u.country = $${i++}`);
      params.push(args.country);
    }
    if (args.search && args.search.trim()) {
      // Match full_name OR any skill in student_profiles.skills (case-insensitive)
      where.push(
        `(u.full_name ILIKE $${i} OR EXISTS (
          SELECT 1 FROM student_profiles sp2
          WHERE sp2.user_id = u.id
            AND EXISTS (
              SELECT 1 FROM unnest(sp2.skills) AS skill
              WHERE skill ILIKE $${i}
            )
        ))`
      );
      params.push(`%${args.search.trim()}%`);
      i++;
    }
    if (args.skillLevel) {
      where.push(`sp.skill_level = $${i++}`);
      params.push(args.skillLevel);
    }
    if (args.minRating != null) {
      where.push(`(sp.average_rating IS NOT NULL AND sp.average_rating >= $${i++})`);
      params.push(args.minRating);
    }

    // LEFT JOIN keeps non-student users in the result unless a student-only
    // filter (skillLevel / minRating) is set — those filters use sp.* columns
    // and naturally exclude rows without a matching student profile.
    const join =
      args.skillLevel != null || args.minRating != null
        ? 'INNER JOIN student_profiles sp ON sp.user_id = u.id'
        : 'LEFT JOIN student_profiles sp ON sp.user_id = u.id';

    params.push(safeLimit, offset);

    const sql = `
      SELECT u.*
      FROM users u
      ${join}
      WHERE ${where.join(' AND ')}
      ORDER BY COALESCE(sp.average_rating, 0) DESC, u.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    const result = await db.query(sql, params);
    return result.rows.map(mapUser);
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const userMutations = {
  async updateProfile(
    _: unknown,
    { input }: { input: { fullName?: string; country?: string; avatarUrl?: string } },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `UPDATE users
       SET full_name  = COALESCE($2, full_name),
           country    = COALESCE($3, country),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, input.fullName ?? null, input.country ?? null, input.avatarUrl ?? null]
    );

    return mapUser(result.rows[0]);
  },

  async updateStudentProfile(
    _: unknown,
    { input }: { input: Record<string, any> },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'student') {
      throw new GraphQLError('Only student accounts can update a student profile', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Upsert: create if first time, otherwise update
    const result = await db.query(
      `INSERT INTO student_profiles (user_id, bio, university, graduation_year, skills, skill_level, portfolio_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         bio             = COALESCE(EXCLUDED.bio,             student_profiles.bio),
         university      = COALESCE(EXCLUDED.university,      student_profiles.university),
         graduation_year = COALESCE(EXCLUDED.graduation_year, student_profiles.graduation_year),
         skills          = COALESCE(EXCLUDED.skills,          student_profiles.skills),
         skill_level     = COALESCE(EXCLUDED.skill_level,     student_profiles.skill_level),
         portfolio_url   = COALESCE(EXCLUDED.portfolio_url,   student_profiles.portfolio_url),
         updated_at      = NOW()
       RETURNING *`,
      [
        userId,
        input.bio            ?? null,
        input.university     ?? null,
        input.graduationYear ?? null,
        input.skills         ?? null,
        input.skillLevel     ?? null,
        input.portfolioUrl   ?? null,
      ]
    );

    return mapStudentProfile(result.rows[0]);
  },

  async updateBusinessProfile(
    _: unknown,
    { input }: { input: Record<string, any> },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'business') {
      throw new GraphQLError('Only business accounts can update a business profile', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const result = await db.query(
      `INSERT INTO business_profiles (user_id, company_name, website, industry, country, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = COALESCE(EXCLUDED.company_name, business_profiles.company_name),
         website      = COALESCE(EXCLUDED.website,      business_profiles.website),
         industry     = COALESCE(EXCLUDED.industry,     business_profiles.industry),
         country      = COALESCE(EXCLUDED.country,      business_profiles.country),
         description  = COALESCE(EXCLUDED.description,  business_profiles.description),
         updated_at   = NOW()
       RETURNING *`,
      [
        userId,
        input.companyName ?? null,
        input.website     ?? null,
        input.industry    ?? null,
        input.country     ?? null,
        input.description ?? null,
      ]
    );

    return mapBusinessProfile(result.rows[0]);
  },

  async submitVerification(
    _: unknown,
    { input }: { input: { type: string; documentUrl?: string } },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    const validTypes = ['phone', 'id_document', 'face', 'business_doc'];
    if (!validTypes.includes(input.type)) {
      throw new GraphQLError(`Invalid verification type. Must be one of: ${validTypes.join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const result = await db.query(
      `INSERT INTO user_verifications (user_id, type, document_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, input.type, input.documentUrl ?? null]
    );

    return mapVerification(result.rows[0]);
  },

  async deleteAccount(
    _: unknown,
    { confirmation }: { confirmation: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (confirmation !== 'DELETE') {
      throw new GraphQLError(
        'Type DELETE exactly (uppercase) to confirm account deletion.',
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    // Soft-delete: is_active=FALSE blocks login (me() filters on it) and the
    // deletion_requested_at stamp drives the 30-day cleanup job. Email stays
    // intact so the user can recover via support before the window expires.
    const result = await db.query(
      `UPDATE users
         SET is_active             = FALSE,
             deletion_requested_at = NOW(),
             updated_at            = NOW()
       WHERE id = $1
         AND is_active = TRUE
       RETURNING id`,
      [userId]
    );

    if (result.rowCount === 0) {
      throw new GraphQLError('Account not found or already deleted', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Revoke every outstanding refresh token so the soft-delete propagates to
    // every device immediately — the mobile client also clears its own tokens
    // on success, but a malicious refresh from another device would otherwise
    // still mint a fresh access token until the next rotation.
    await db.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`,
      [userId]
    );

    return true;
  },

  async uploadAvatar(
    _: unknown,
    { base64, mimeType }: { base64: string; mimeType: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    // Cloudinary upload via REST API
    const { env } = await import('../config/env');

    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY) {
      throw new GraphQLError('Cloudinary not configured', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    try {
      const axios = (await import('axios')).default;
      const crypto = await import('crypto');

      const timestamp = Math.floor(Date.now() / 1000);
      const folder    = 'queenskiilia/avatars';
      const publicId  = `user_${userId}`;

      const sigString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash('sha256').update(sigString).digest('hex');

      const formData = new URLSearchParams({
        file:        `data:${mimeType};base64,${base64}`,
        api_key:     env.CLOUDINARY_API_KEY,
        timestamp:   String(timestamp),
        signature,
        folder,
        public_id:   publicId,
        overwrite:   'true',
      });

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const avatarUrl = uploadRes.data.secure_url as string;

      const userResult = await db.query(
        `UPDATE users SET avatar_url = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, avatarUrl]
      );

      return mapUser(userResult.rows[0]);
    } catch (err: any) {
      throw new GraphQLError('Avatar upload failed: ' + err.message, {
        extensions: { code: 'UPLOAD_FAILED' },
      });
    }
  },
};

// ── Federation __resolveReference ────────────────────────────────────────────

export const userReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapUser(result.rows[0]) : null;
  },
};

// ── Type resolvers (nested fields) ───────────────────────────────────────────

export const userTypeResolvers = {
  async studentProfile(user: { id: string }) {
    const result = await db.query(
      `SELECT * FROM student_profiles WHERE user_id = $1`,
      [user.id]
    );
    return result.rowCount ? mapStudentProfile(result.rows[0]) : null;
  },

  async businessProfile(user: { id: string }) {
    const result = await db.query(
      `SELECT * FROM business_profiles WHERE user_id = $1`,
      [user.id]
    );
    return result.rowCount ? mapBusinessProfile(result.rows[0]) : null;
  },

  async verifications(user: { id: string }) {
    const result = await db.query(
      `SELECT * FROM user_verifications WHERE user_id = $1 ORDER BY submitted_at DESC`,
      [user.id]
    );
    return result.rows.map(mapVerification);
  },
};
