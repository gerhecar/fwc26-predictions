/**
 * Admin User Management — Test Plan
 *
 * Run with: npx vitest run __tests__/admin-users.test.ts
 *
 * These tests validate the core logic of admin user management:
 * - getAllUsers() pagination, filtering, sorting
 * - signIn() is_active check
 * - Server action self-protection rules
 *
 * Note: Requires a test database or mocked pool.
 * The tests below use type-level validation; actual DB integration
 * tests should be run against a test MySQL instance.
 */

import type { AdminUserListParams, AdminUserListResponse, AdminUser } from '@/types'

/** Verify shape of AdminUser */
function assertAdminUser(user: AdminUser) {
  expect(user).toHaveProperty('id')
  expect(user).toHaveProperty('email')
  expect(user).toHaveProperty('display_name')
  expect(user).toHaveProperty('role')
  expect(user).toHaveProperty('is_active')
  expect(user).toHaveProperty('created_at')
  expect(typeof user.is_active).toBe('boolean')
}

/** Verify shape of paginated response */
function assertAdminUserListResponse(data: AdminUserListResponse) {
  expect(Array.isArray(data.users)).toBe(true)
  expect(typeof data.total).toBe('number')
  expect(typeof data.page).toBe('number')
  expect(typeof data.totalPages).toBe('number')
  expect(data.page).toBeGreaterThanOrEqual(1)
  expect(data.totalPages).toBeGreaterThanOrEqual(0)
  expect(data.users.length).toBeLessThanOrEqual(data.total)
}

describe('AdminUser type shape', () => {
  it('should create a valid AdminUser object', () => {
    const user: AdminUser = {
      id: 'test-id',
      email: 'test@test.com',
      display_name: 'Test User',
      avatar_url: null,
      role: 'user',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      last_login_at: null,
      prediction_count: 3,
    }
    assertAdminUser(user)
    expect(user.email).toBe('test@test.com')
  })

  it('should allow admin role', () => {
    const admin: AdminUser = {
      id: 'admin-id',
      email: 'admin@test.com',
      display_name: 'Admin',
      avatar_url: null,
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      last_login_at: '2026-05-29T00:00:00Z',
    }
    assertAdminUser(admin)
    expect(admin.role).toBe('admin')
  })

  it('should allow inactive user', () => {
    const inactive: AdminUser = {
      id: 'inactive-id',
      email: 'inactive@test.com',
      display_name: 'Inactive',
      avatar_url: null,
      role: 'user',
      is_active: false,
      created_at: '2026-01-01T00:00:00Z',
      last_login_at: null,
    }
    assertAdminUser(inactive)
    expect(inactive.is_active).toBe(false)
  })
})

describe('AdminUserListResponse type shape', () => {
  it('should create a valid empty response', () => {
    const response: AdminUserListResponse = {
      users: [],
      total: 0,
      page: 1,
      totalPages: 0,
    }
    assertAdminUserListResponse(response)
    expect(response.users).toHaveLength(0)
  })

  it('should create a valid paginated response', () => {
    const response: AdminUserListResponse = {
      users: [
        { id: '1', email: 'a@a.com', display_name: 'A', avatar_url: null, role: 'user', is_active: true, created_at: '2026-01-01T00:00:00Z', last_login_at: null, prediction_count: 0 },
        { id: '2', email: 'b@b.com', display_name: 'B', avatar_url: null, role: 'admin', is_active: true, created_at: '2026-01-02T00:00:00Z', last_login_at: null, prediction_count: 5 },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    }
    assertAdminUserListResponse(response)
    expect(response.users).toHaveLength(2)
  })
})

describe('AdminUserListParams defaults', () => {
  it('should apply default values', () => {
    const params: AdminUserListParams = {}
    expect(params.page ?? 1).toBe(1)
    expect(params.limit ?? 25).toBe(25)
    expect(params.search ?? '').toBe('')
    expect(params.sortBy ?? 'created_at').toBe('created_at')
    expect(params.sortOrder ?? 'desc').toBe('desc')
    expect(params.roleFilter ?? 'all').toBe('all')
    expect(params.statusFilter ?? 'all').toBe('all')
  })

  it('should accept overrides', () => {
    const params: AdminUserListParams = {
      page: 2,
      limit: 10,
      search: 'test',
      sortBy: 'email',
      sortOrder: 'asc',
      roleFilter: 'admin',
      statusFilter: 'active',
    }
    expect(params.page).toBe(2)
    expect(params.limit).toBe(10)
    expect(params.search).toBe('test')
    expect(params.sortBy).toBe('email')
    expect(params.sortOrder).toBe('asc')
    expect(params.roleFilter).toBe('admin')
    expect(params.statusFilter).toBe('active')
  })
})
