# TODO: Fix Authentication Issue in Category Form

## Tasks
- [x] Update `src/app/auth/auth.service.ts` to initialize `currentUser` from localStorage in constructor and modify `getCurrentUser()` to load from localStorage if null.
- [x] Update `src/app/categories/category-form/category-form.component.ts` to add null check for `currentUser` in `onSubmit()` and redirect to login if not authenticated.
- [x] Update `src/app/auth/auth-callback/auth-callback.component.ts` to validate token before setting it in localStorage.
- [x] Update `src/app/auth/auth.service.ts` to use response.access as the token in login and signup methods.
