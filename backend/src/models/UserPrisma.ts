import db from '../lib/prisma';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  profileData: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  profileData?: Record<string, any> | null;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  passwordHash?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  profileData?: Record<string, any> | null;
}

if (typeof (globalThis as any).Temporal === 'undefined') {
  class MockInstant {
    epochMilliseconds: number;
    constructor(epochMilliseconds: number) {
      this.epochMilliseconds = epochMilliseconds;
    }
    get [Symbol.toStringTag]() { return 'Temporal.Instant'; }
    toString() { return new Date(this.epochMilliseconds).toISOString(); }
    toJSON() { return new Date(this.epochMilliseconds).toISOString(); }
  }

  (globalThis as any).Temporal = {
    Instant: MockInstant,
    Now: {
      instant: () => new MockInstant(Date.now())
    }
  };
  (globalThis as any).Temporal.Instant.from = (val: any) => new MockInstant(new Date(val).getTime());
}

export const UserModel = {
  get _orm() {
    return (db.orm as any).public.User;
  },

  async findByEmail(email: string): Promise<UserRow | null> {
    const lowerEmail = email.toLowerCase();
    return await this._orm.where({ email: lowerEmail }).first();
  },

  async findById(id: number): Promise<UserRow | null> {
    return await this._orm.where({ id }).first();
  },

  async create(data: UserCreateInput): Promise<UserRow> {
    const createPayload: any = {
      ...data,
      email: data.email.toLowerCase(),
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    };
    if (data.emailVerificationExpires) {
      createPayload.emailVerificationExpires = (globalThis as any).Temporal.Instant.from(data.emailVerificationExpires);
    }
    return await this._orm.create(createPayload);
  },

  async findByVerificationToken(hashedToken: string): Promise<UserRow | null> {
    const user = await this._orm
      .where({ emailVerificationToken: hashedToken })
      .first();
      
    if (!user || !user.emailVerificationExpires) return null;
    
    const nowMs = (globalThis as any).Temporal.Now.instant().epochMilliseconds;
    const expiresMs = user.emailVerificationExpires.epochMilliseconds;
    if (nowMs >= expiresMs) return null;
    
    return user;
  },

  async findByPasswordResetToken(hashedToken: string): Promise<UserRow | null> {
    const user = await this._orm
      .where({ passwordResetToken: hashedToken })
      .first();
      
    if (!user || !user.passwordResetExpires) return null;
    
    const nowMs = (globalThis as any).Temporal.Now.instant().epochMilliseconds;
    const expiresMs = user.passwordResetExpires.epochMilliseconds;
    if (nowMs >= expiresMs) return null;
    
    return user;
  },

  async updateById(id: number, data: UserUpdateInput): Promise<UserRow | null> {
    const updatePayload: any = {
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    };
    
    if (data.email) {
      updatePayload.email = data.email.toLowerCase();
    }
    if (data.emailVerificationExpires) {
      updatePayload.emailVerificationExpires = (globalThis as any).Temporal.Instant.from(data.emailVerificationExpires);
    }
    if (data.emailVerificationExpires === null) {
        updatePayload.emailVerificationExpires = null;
    }

    return await this._orm
      .where({ id })
      .update(updatePayload);
  }
};
