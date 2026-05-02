export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

const mockClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }) },
};

export const serverClient = jest.fn().mockResolvedValue(mockClient);
export const actionClient = jest.fn().mockResolvedValue(mockClient);
