export const redirect = jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`); });
export const useRouter = jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() }));
export const useSearchParams = jest.fn(() => new URLSearchParams());
export const usePathname = jest.fn(() => "/");
